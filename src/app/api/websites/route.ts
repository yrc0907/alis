import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// 获取当前用户的所有网站
export async function GET() {
  try {
    const session = await auth();

    // 验证用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户ID
    const userId = session.user.id;

    // 查询该用户的所有网站
    const websites = await prisma.website.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch websites' },
      { status: 500 }
    );
  }
}

// 创建新网站
export async function POST(req: Request) {
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
    console.log("Creating website for user ID:", userId); // 调试信息

    const { name, domain, description } = await req.json();

    // 验证必填字段
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // 使用更宽松的域名验证规则
    // 接受任何不含http://或https://的域名格式，只需确保包含至少一个点
    if (domain.includes('http://') || domain.includes('https://') || !domain.includes('.')) {
      return NextResponse.json(
        { error: 'Invalid domain format. Do not include http:// or https://, and make sure it contains a dot (e.g. example.com)' },
        { status: 400 }
      );
    }

    // 检查域名是否已被使用
    const existingWebsite = await prisma.website.findFirst({
      where: {
        domain: domain
      }
    });

    if (existingWebsite) {
      return NextResponse.json(
        { error: 'Domain already in use' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const userExists = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!userExists) {
      console.error("User not found with ID:", userId);
      return NextResponse.json(
        { error: 'User not found. Please re-login and try again.' },
        { status: 404 }
      );
    }

    // 创建新网站及其知识库配置
    try {
      const newWebsite = await prisma.website.create({
        data: {
          name,
          domain,
          description: description || "",
          userId,
          config: {
            create: {
              enabled: true,
              threshold: 0.7
            }
          }
        },
        include: {
          config: true
        }
      });

      return NextResponse.json(newWebsite, { status: 201 });
    } catch (createError) {
      console.error("Failed to create website:", createError);
      return NextResponse.json(
        { error: `Database error: ${(createError as Error).message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing website creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 