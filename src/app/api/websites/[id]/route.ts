import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// 获取单个网站信息
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
    const id = (await params).id;

    // 查询网站，同时验证所有权
    const website = await prisma.website.findFirst({
      where: {
        id: id,
        userId: userId // 确保只能查询自己的网站
      },
      include: {
        config: true // 包含知识库配置
      }
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(website);
  } catch (error) {
    console.error('Error fetching website:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website' },
      { status: 500 }
    );
  }
}

// 更新网站信息
export async function PUT(
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
    const id = (await params).id;
    const { name, domain, description } = await req.json();

    // 验证必填字段
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // 验证网站是否存在并且属于当前用户
    const existingWebsite = await prisma.website.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!existingWebsite) {
      return NextResponse.json(
        { error: 'Website not found or unauthorized' },
        { status: 404 }
      );
    }

    // 如果域名改变了，检查新域名是否可用
    if (domain !== existingWebsite.domain) {
      const domainExists = await prisma.website.findFirst({
        where: {
          domain: domain,
          id: { not: id } // 排除当前网站
        }
      });

      if (domainExists) {
        return NextResponse.json(
          { error: 'Domain already in use' },
          { status: 400 }
        );
      }
    }

    // 更新网站信息
    const updatedWebsite = await prisma.website.update({
      where: { id },
      data: {
        name,
        domain,
        description
      },
      include: {
        config: true
      }
    });

    return NextResponse.json(updatedWebsite);
  } catch (error) {
    console.error('Error updating website:', error);
    return NextResponse.json(
      { error: 'Failed to update website' },
      { status: 500 }
    );
  }
}

// 删除网站
export async function DELETE(
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
    const id = (await params).id;

    // 验证网站是否存在并且属于当前用户
    const website = await prisma.website.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or unauthorized' },
        { status: 404 }
      );
    }

    // 删除网站（关联的知识库条目和配置会通过级联删除自动删除）
    await prisma.website.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting website:', error);
    return NextResponse.json(
      { error: 'Failed to delete website' },
      { status: 500 }
    );
  }
} 