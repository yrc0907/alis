import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// 获取网站的知识库配置
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // 验证用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const websiteId = (await params).id;

    // 确认网站存在并且属于当前用户
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        userId: userId
      }
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or unauthorized' },
        { status: 404 }
      );
    }

    // 获取网站的知识库配置
    const config = await prisma.knowledgeConfig.findUnique({
      where: {
        websiteId: websiteId
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error: unknown) {
    console.error('Error fetching knowledge config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch knowledge config: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// 创建或更新网站的知识库配置
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // 验证用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const websiteId = (await params).id;
    const { enabled, threshold } = await req.json();

    // 验证必填字段
    if (enabled === undefined || threshold === undefined) {
      return NextResponse.json(
        { error: 'Enabled and threshold are required' },
        { status: 400 }
      );
    }

    // 确认网站存在并且属于当前用户
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        userId: userId
      }
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or unauthorized' },
        { status: 404 }
      );
    }

    // 查询是否已存在配置
    const existingConfig = await prisma.knowledgeConfig.findUnique({
      where: {
        websiteId: websiteId
      }
    });

    // 创建或更新配置
    const config = existingConfig
      ? await prisma.knowledgeConfig.update({
        where: {
          id: existingConfig.id
        },
        data: {
          enabled,
          threshold
        }
      })
      : await prisma.knowledgeConfig.create({
        data: {
          enabled,
          threshold,
          websiteId
        }
      });

    return NextResponse.json(config);
  } catch (error: unknown) {
    console.error('Error updating knowledge config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update knowledge config: ${errorMessage}` },
      { status: 500 }
    );
  }
} 