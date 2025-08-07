import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// 获取潜在用户
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 获取用户的所有网站
    const userWebsites = await prisma.website.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const websiteIds = userWebsites.map(site => site.id);
    const websiteIdToName = Object.fromEntries(userWebsites.map(site => [site.id, site.name]));

    // 1. 从预约中获取潜在用户
    const appointments = await prisma.appointment.findMany({
      where: {
        websiteId: { in: websiteIds },
        // 可以添加更多过滤条件，例如只看最近的或未处理的
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        websiteId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const potentialFromAppointments = appointments.map(a => ({
      id: `apt-${a.id}`,
      name: a.name,
      email: a.email,
      phone: a.phone,
      interestType: 'APPOINTMENT',
      interestLevel: 1.0, // 预约被视为最高兴趣
      source: 'APPOINTMENT',
      createdAt: a.createdAt,
      websiteName: websiteIdToName[a.websiteId] || 'N/A',
    }));

    // 2. 从高兴趣度中获取潜在用户
    const highInterests = await prisma.userInterest.findMany({
      where: {
        websiteId: { in: websiteIds },
        interestLevel: { gte: 0.7 }, // 兴趣阈值，可配置
      },
      include: {
        chatSession: {
          select: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 10 // 获取一些聊天上下文
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const potentialFromInterests = highInterests.map(i => ({
      id: `int-${i.id}`,
      // 尝试从聊天记录或预约中获取用户信息
      name: null, // 需要更复杂的逻辑来提取
      email: '', // 需要更复杂的逻辑来提取
      phone: null, // 需要更复杂的逻辑来提取
      interestType: i.interestType,
      interestLevel: i.interestLevel,
      source: i.source,
      createdAt: i.createdAt,
      websiteName: websiteIdToName[i.websiteId] || 'N/A',
      // 可以在这里添加聊天摘要
    }));

    // 合并和去重（基于email）
    const allPotentials = [...potentialFromAppointments, ...potentialFromInterests];
    const uniquePotentials = Array.from(new Map(allPotentials.map(p => [p.email, p])).values());

    // 排序
    uniquePotentials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(uniquePotentials);

  } catch (error) {
    console.error('Error fetching potential users:', error);
    return NextResponse.json({ error: 'Failed to fetch potential users' }, { status: 500 });
  }
} 