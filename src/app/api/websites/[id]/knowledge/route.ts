import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// 获取网站的所有知识库条目
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
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
    const { id: websiteId } = params;

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

    // 获取网站的所有知识库条目
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        websiteId: websiteId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(knowledgeItems);
  } catch (error) {
    console.error('Error fetching knowledge items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge items' },
      { status: 500 }
    );
  }
}

// 添加新的知识库条目
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
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
    const { id: websiteId } = params;
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

    // 处理关键词，转换为逗号分隔的字符串
    let keywordsString = '';
    if (Array.isArray(keywords)) {
      keywordsString = keywords.join(',');
    } else if (typeof keywords === 'string') {
      keywordsString = keywords;
    }

    // 创建新的知识库条目
    const newItem = await prisma.knowledgeItem.create({
      data: {
        question,
        answer,
        keywords: keywordsString,
        websiteId
      }
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge item' },
      { status: 500 }
    );
  }
} 