import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 标记聊天会话为已读
export async function PUT(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;

    // 检查会话是否存在
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    // 在实际项目中，你需要一个合适的字段来标记已读状态
    // 由于原数据库模型没有，这里示例一下逻辑
    // 如果有已读字段，可以这样更新：
    /*
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { isRead: true }
    });
    */

    // 如果使用的是最后一条消息的已读状态，可以标记所有消息为已读
    /*
    await prisma.chatMessage.updateMany({
      where: { chatSessionId: chatId },
      data: { isRead: true }
    });
    */

    // 假设成功标记了已读状态
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking chat as read:", error);
    return NextResponse.json(
      { error: "Failed to mark chat as read" },
      { status: 500 }
    );
  }
} 