import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST() {
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

    // 如果用户没有任何网站，直接返回成功
    if (websiteIds.length === 0) {
      return NextResponse.json({ success: true, message: 'No websites found for user.' });
    }

    // 将这些网站上所有未读的预约标记为已读
    const updateResult = await prisma.appointment.updateMany({
      where: {
        websiteId: {
          in: websiteIds,
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true, count: updateResult.count });
  } catch (error) {
    console.error('Error marking appointments as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 