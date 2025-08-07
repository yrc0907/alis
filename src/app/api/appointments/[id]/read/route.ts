import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

type PostContext = {
  params: {
    id: string;
  };
};

// 按照 Next.js 15 类型定义
export async function POST(req: NextRequest, context: PostContext) {
  try {
    const session = await auth();

    // 验证用户是否已登录
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: appointmentId } = context.params;

    // 获取预约
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        website: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 验证用户是否有权限更新此预约
    if (appointment.website?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 标记为已读
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedAppointment);
  } catch (error: unknown) {
    console.error('Error marking appointment as read:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to mark appointment as read: ${errorMessage}` },
      { status: 500 }
    );
  }
} 