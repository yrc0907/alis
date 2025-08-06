import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 找到该用户拥有的所有网站
    const userWebsites = await prisma.website.findMany({
      where: { userId },
      select: { id: true },
    });

    const websiteIds = userWebsites.map((site: { id: string }) => site.id);

    // 如果用户没有任何网站，直接返回0
    if (websiteIds.length === 0) {
      return NextResponse.json({ unreadCount: 0 });
    }

    // 计算这些网站上所有未读的预约数量
    const unreadCount = await prisma.appointment.count({
      where: {
        websiteId: {
          in: websiteIds,
        },
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error: unknown) {
    console.error('Error fetching unread appointment count:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
} 