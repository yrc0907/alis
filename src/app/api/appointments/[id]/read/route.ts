import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// 标记预约为已读
export async function POST(
  _req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();

    // 验证用户是否已登录
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appointmentId = context.params.id;

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
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // 验证用户是否有权限更新此预约
    if (appointment.website?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
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
  } catch (error) {
    console.error('Error marking appointment as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark appointment as read' },
      { status: 500 }
    );
  }
} 