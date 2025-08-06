import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// 获取单个知识条目
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
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
    const awaitedParams = await params;
    const websiteId = awaitedParams.id;
    const itemId = awaitedParams.itemId;

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

    // 获取知识条目
    const knowledgeItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: itemId,
        websiteId: websiteId
      }
    });

    if (!knowledgeItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(knowledgeItem);
  } catch (error) {
    console.error('Error fetching knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge item' },
      { status: 500 }
    );
  }
}

// 更新知识条目
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
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
    const awaitedParams = await params;
    const websiteId = awaitedParams.id;
    const itemId = awaitedParams.itemId;
    const { question, answer, keywords } = await req.json();

    // 验证必填字段
    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
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

    // 确认知识条目存在
    const existingItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: itemId,
        websiteId: websiteId
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }

    // 处理关键词，转换为逗号分隔的字符串
    let keywordsString = '';
    if (Array.isArray(keywords)) {
      keywordsString = keywords.join(',');
    } else if (typeof keywords === 'string') {
      keywordsString = keywords;
    }

    // 更新知识条目
    const updatedItem = await prisma.knowledgeItem.update({
      where: {
        id: itemId
      },
      data: {
        question,
        answer,
        keywords: keywordsString
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge item' },
      { status: 500 }
    );
  }
}

// 删除知识条目
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
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
    const awaitedParams = await params;
    const websiteId = awaitedParams.id;
    const itemId = awaitedParams.itemId;

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

    // 确认知识条目存在
    const existingItem = await prisma.knowledgeItem.findFirst({
      where: {
        id: itemId,
        websiteId: websiteId
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }

    // 删除知识条目
    await prisma.knowledgeItem.delete({
      where: {
        id: itemId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge item' },
      { status: 500 }
    );
  }
} 