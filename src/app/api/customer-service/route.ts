import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 触发Socket.IO事件的辅助函数
const triggerSocketEvent = async (sessionId: string, reason: string) => {
  try {
    // 这里我们可以使用内部API调用或者其他方式来触发Socket.IO事件
    // 由于API路由和Socket.IO服务器是分开的，我们使用内部fetch来触发通知
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    await fetch(`${baseUrl}/notify-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Internal-Auth': process.env.INTERNAL_API_SECRET || 'internal-secret'
      },
      body: JSON.stringify({
        type: 'customer_service_request',
        sessionId: sessionId,
        reason: reason
      })
    });
    console.log('Socket.IO notification triggered');
  } catch (error) {
    console.error('Failed to trigger Socket.IO notification:', error);
    // 这里不抛出错误，因为这是一个辅助通知功能，不应影响主要流程
  }
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      message,
      websiteId,
      apiKey,
      chatSessionId,
      pageUrl,
      userAgent,
      supportReason,
      needsHumanSupport
    } = data;

    // 验证必要的参数
    if (!chatSessionId || !websiteId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // 验证API密钥和网站ID
    const website = await prisma.website.findUnique({
      where: {
        id: websiteId,
      },
    });

    if (!website || (apiKey && website.apiKey !== apiKey)) {
      return NextResponse.json(
        { error: "Invalid website ID or API key" },
        { status: 401 }
      );
    }

    // 查找或创建聊天会话
    let chatSession = await prisma.chatSession.findUnique({
      where: {
        sessionId: chatSessionId,
      },
    });

    if (!chatSession) {
      // 如果会话不存在，创建一个新会话
      chatSession = await prisma.chatSession.create({
        data: {
          sessionId: chatSessionId,
          websiteId: websiteId,
          startedAt: new Date(),
          lastActiveAt: new Date(),
          isRead: false,
        },
      });
    }

    // 更新会话状态为需要人工支持
    await prisma.chatSession.update({
      where: {
        id: chatSession.id,
      },
      data: {
        needsHumanSupport: true,
        lastActiveAt: new Date(),
        isRead: false, // 确保被标记为未读，以便在后台显示提示
        supportRequestedAt: new Date(),
        lastPageUrl: pageUrl || null,
        lastUserAgent: userAgent || null,
      },
    });

    // 添加人工支持请求消息
    await prisma.chatMessage.create({
      data: {
        chatSessionId: chatSession.id,
        role: "system",
        content: `用户请求人工客服支持。原因: ${supportReason || "未提供"}`,
        createdAt: new Date(),
      },
    });

    // 如果有消息内容，也添加用户消息
    if (message && message !== "请求人工客服") {
      await prisma.chatMessage.create({
        data: {
          chatSessionId: chatSession.id,
          role: "user",
          content: message,
          createdAt: new Date(),
        },
      });
    }

    // 触发Socket.IO通知
    await triggerSocketEvent(chatSessionId, supportReason || "未提供");

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Customer service request registered successfully",
    });
  } catch (error) {
    console.error("Error processing customer service request:", error);
    return NextResponse.json(
      { error: "Failed to process customer service request" },
      { status: 500 }
    );
  }
}

// 添加OPTIONS处理以支持CORS预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
} 