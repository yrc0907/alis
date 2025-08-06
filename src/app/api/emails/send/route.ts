import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { AppointmentConfirmationEmail } from '@/emails/AppointmentConfirmation';
import { AppointmentRejectionEmail } from '@/emails/AppointmentRejection';
import { AppointmentRescheduledEmail } from '@/emails/AppointmentRescheduled';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appointmentId, type, reason, newDateTime } = body;

    if (!appointmentId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { website: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 安全检查：确保当前用户是该预约所属网站的所有者
    if (appointment.website.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let emailComponent;
    let subject = '';

    switch (type) {
      case 'CONFIRMATION':
        subject = `预约确认: ${appointment.website.name}`;
        emailComponent = AppointmentConfirmationEmail({
          customerName: appointment.name ?? undefined,
          appointmentDate: appointment.date,
          websiteName: appointment.website.name,
          websiteUrl: `http://${appointment.website.domain}`,
        });
        break;
      case 'REJECTION':
        subject = `关于您在 ${appointment.website.name} 的预约`;
        emailComponent = AppointmentRejectionEmail({
          customerName: appointment.name ?? undefined,
          appointmentDate: appointment.date,
          rejectionReason: reason,
          websiteName: appointment.website.name,
          websiteUrl: `http://${appointment.website.domain}`,
        });
        break;
      case 'RESCHEDULED':
        if (!newDateTime) {
          return NextResponse.json({ error: 'New date and time are required for rescheduling' }, { status: 400 });
        }
        subject = `重要通知: 您的预约时间已更新`;
        emailComponent = AppointmentRescheduledEmail({
          customerName: appointment.name ?? undefined,
          originalDate: appointment.date,
          newDate: new Date(newDateTime),
          rescheduleReason: reason,
          websiteName: appointment.website.name,
          // TODO: 生成一个带有时效性和签名的确认链接
          confirmationUrl: `http://${appointment.website.domain}/appointment/confirm?id=${appointment.id}&token=...`,
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: `通知 <noreply@${process.env.EMAIL_DOMAIN}>`,
      to: [appointment.email],
      subject: subject,
      react: emailComponent,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully', data });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 