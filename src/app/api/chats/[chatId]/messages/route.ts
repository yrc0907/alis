import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取特定聊天会话的消息
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;
    const { searchParams } = new URL(req.url);
    const afterId = searchParams.get("after");

    // 检查聊天会话是否存在
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // 查询条件
    const where: any = {
      chatSessionId: chatId,
    };

    // 如果提供了afterId参数，则只获取该ID之后的消息
    if (afterId) {
      // 首先找到这条消息，以便获取它的创建时间
      const lastMessage = await prisma.chatMessage.findUnique({
        where: { id: afterId },
        select: { createdAt: true }
      });

      if (lastMessage) {
        where.createdAt = {
          gt: lastMessage.createdAt // 获取在这条消息之后创建的消息
        };
      }
    }

    // 获取消息
    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    // 格式化返回的消息
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      role: message.role,
      createdAt: message.createdAt
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// 发送新消息
export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;
    const { content, role } = await req.json();

    if (!content || !role) {
      return NextResponse.json(
        { error: "Content and role are required" },
        { status: 400 }
      );
    }

    // 检查聊天会话是否存在
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // 创建新消息
    const newMessage = await prisma.chatMessage.create({
      data: {
        content,
        role,
        chatSessionId: chatId,
      },
    });

    // 更新会话的最后活跃时间
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({
      id: newMessage.id,
      content: newMessage.content,
      role: newMessage.role,
      createdAt: newMessage.createdAt,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 