import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import type { Prisma } from '@prisma/client'

// 获取用户兴趣数据
export async function GET(req: Request) {
  try {
    const session = await auth();

    // 验证用户是否已登录
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get('websiteId');
    const period = parseInt(searchParams.get('period') || '30'); // 默认30天
    const userId = session.user.id;

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // 构建查询条件
    const whereCondition: Prisma.UserInterestWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // 如果指定了网站ID，只查询该网站的数据
    if (websiteId && websiteId !== 'all') {
      whereCondition.websiteId = websiteId;
    } else {
      // 否则查询该用户所有网站的数据
      const userWebsites = await prisma.website.findMany({
        where: { userId },
        select: { id: true }
      });

      whereCondition.websiteId = {
        in: userWebsites.map((site: { id: string }) => site.id)
      };
    }

    // 获取用户兴趣数据
    const interests = await prisma.userInterest.findMany({
      where: whereCondition,
      include: {
        website: {
          select: {
            name: true,
            domain: true
          }
        },
        chatSession: {
          select: {
            visitorId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 按类型统计兴趣数量
    const interestsByType = await prisma.userInterest.groupBy({
      by: ['interestType'],
      where: whereCondition,
      _count: {
        interestType: true
      }
    });

    // 统计每日兴趣数量
    const dailyInterests = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        interestType,
        COUNT(*) as count
      FROM UserInterest
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
      ${websiteId && websiteId !== 'all'
        ? prisma.$queryRaw`AND websiteId = ${websiteId}`
        : prisma.$queryRaw`AND websiteId IN (SELECT id FROM Website WHERE userId = ${userId})`}
      GROUP BY DATE(createdAt), interestType
      ORDER BY DATE(createdAt)
    `;

    // 计算平均兴趣级别
    const avgInterestLevel = await prisma.userInterest.aggregate({
      where: whereCondition,
      _avg: {
        interestLevel: true
      }
    });

    // 计算总兴趣点击数
    const totalInterests = interests.length;

    // 计算独立访客数
    const uniqueVisitors = new Set();
    interests.forEach(interest => {
      const visitorId = interest.userId ||
        interest.chatSession?.visitorId ||
        `anonymous_${interest.chatSessionId}`;
      if (visitorId) {
        uniqueVisitors.add(visitorId);
      }
    });

    // 计算有效转化率（估算值：预约兴趣占比）
    const appointmentInterests = interests.filter(interest =>
      interest.interestType === 'APPOINTMENT'
    ).length;
    const conversionRate = totalInterests > 0
      ? appointmentInterests / totalInterests
      : 0;

    // 构建响应数据
    const response = {
      interests: interests,
      statistics: {
        totalInterests,
        uniqueVisitors: uniqueVisitors.size,
        avgInterestLevel: avgInterestLevel._avg.interestLevel || 0,
        conversionRate
      },
      interestsByType: interestsByType.map((item: { interestType: string, _count: { interestType: number } }) => ({
        type: item.interestType,
        count: item._count.interestType
      })),
      dailyInterests
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error fetching user interests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch user interests: ${errorMessage}` },
      { status: 500 }
    );
  }
} 