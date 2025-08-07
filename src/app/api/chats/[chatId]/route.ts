import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取特定会话详情
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;

    // 获取会话详情，包括消息
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
      include: {
        website: {
          select: {
            name: true,
            domain: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // 格式化返回数据
    const formattedSession = {
      id: chatSession.id,
      sessionId: chatSession.sessionId,
      visitorId: chatSession.visitorId,
      startedAt: chatSession.startedAt,
      lastActiveAt: chatSession.lastActiveAt,
      websiteId: chatSession.websiteId,
      websiteName: chatSession.website.name,
      websiteDomain: chatSession.website.domain,
      messages: chatSession.messages.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role,
        createdAt: message.createdAt
      })),
      // 这里的已读状态根据项目实际情况调整
      isRead: true // 假设都是已读的
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat session" },
      { status: 500 }
    );
  }
} 