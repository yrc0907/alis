import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// CORS 头信息
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin'
  };
}

// 处理预检请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// 获取当前用户的所有预约
export async function GET() {
  try {
    const session = await auth();

    // 验证用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // 获取用户ID
    const userId = session.user.id;

    // 查询所有与该用户相关的预约
    // 这包括：
    // 1. 用户直接创建的预约
    // 2. 用户拥有的网站上的预约
    const websites = await prisma.website.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true
      }
    });

    const websiteIds = websites.map(site => site.id);

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { userId: userId },
          { websiteId: { in: websiteIds } }
        ]
      },
      include: {
        website: {
          select: {
            name: true,
            domain: true
          }
        },
        user: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(appointments, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// 创建新预约
export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      phone,
      date,
      notes,
      subject,
      duration,
      websiteId,
      userId,
      chatSessionId
    } = await req.json();

    console.log('收到预约请求:', { websiteId, email, date });

    // 验证必填字段
    if (!email || !phone || !date || !websiteId) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 验证网站是否存在
    const website = await prisma.website.findUnique({
      where: { id: websiteId }
    });

    if (!website) {
      return NextResponse.json(
        { error: `Website not found with ID: ${websiteId}` },
        { status: 404, headers: corsHeaders() }
      );
    }

    // 根据客户端会话ID查找数据库会话主键
    let dbChatSessionId: string | undefined = undefined;
    if (chatSessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { sessionId: chatSessionId },
        select: { id: true }
      });

      if (session) {
        dbChatSessionId = session.id;
        console.log(`Found chat session DB ID: ${dbChatSessionId} for client session ID: ${chatSessionId}`);
      } else {
        console.warn(`Chat session with client ID ${chatSessionId} not found.`);
      }
    }

    // 创建预约
    const appointment = await prisma.appointment.create({
      data: {
        name,
        email,
        phone,
        date: new Date(date),
        notes,
        subject,
        duration,
        websiteId,
        userId,
        chatSessionId: dbChatSessionId, // 使用正确的数据库ID
        status: 'PENDING'
      }
    });

    console.log('预约创建成功:', appointment.id);

    // 如果存在聊天会话ID，记录用户预约兴趣
    if (dbChatSessionId) {
      try {
        await prisma.userInterest.create({
          data: {
            interestType: 'APPOINTMENT',
            interestLevel: 0.8, // 预约表示较高的兴趣水平
            source: 'CHAT',
            metadata: JSON.stringify({
              appointmentId: appointment.id,
              subject: subject || 'General Inquiry'
            }),
            websiteId,
            chatSessionId: dbChatSessionId, // 使用正确的数据库ID
            userId
          }
        });
        console.log('记录预约兴趣成功');
      } catch (interestError) {
        // 仅记录错误，不影响预约创建结果
        console.error('记录预约兴趣失败:', interestError);
      }
    }

    return NextResponse.json(
      appointment,
      { status: 201, headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: `Failed to create appointment: ${error.message || 'Unknown error'}` },
      { status: 500, headers: corsHeaders() }
    );
  }
} 