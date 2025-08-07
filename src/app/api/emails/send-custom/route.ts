import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: `Alis Ai <noreply@${process.env.EMAIL_DOMAIN}>`,
      to: [to],
      subject: subject,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully', data });

  } catch (error: unknown) {
    console.error('Server Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
} 