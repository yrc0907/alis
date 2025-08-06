import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { newDateTime } = await req.json();

    if (!newDateTime) {
      return NextResponse.json({ error: 'New date and time are required' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { website: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 安全检查：确保当前用户是该预约所属网站的所有者
    if (appointment.website.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 更新预约时间
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: new Date(newDateTime),
        status: 'PENDING', // 修改时间后，状态重置为待客户确认
        isRead: false, // 标记为未读，以便管理员注意
      },
    });

    // 注意：邮件发送已移至通用的 /api/emails/send 接口处理
    // 前端将在调用此接口成功后，再调用邮件接口

    return NextResponse.json(updatedAppointment);

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 