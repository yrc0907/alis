import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取未读聊天会话数量
export async function GET(req: NextRequest) {
  try {
    // 这里我们需要查询未读消息的数量
    // 由于原始数据库模型中没有显式的未读标记，我们需要通过其他方式推断
    // 例如，我们可以假设有最新消息且角色为"user"的会话是未读的

    // 获取有未读消息的会话数量
    // 注意：这是一个简化的实现，实际项目中可能需要根据具体的已读/未读逻辑调整
    const unreadCount = await prisma.chatSession.count({
      where: {
        messages: {
          some: {
            role: "user",
            // 这里可以添加更多条件，例如时间戳等
          }
        }
        // 这里可以添加其他条件，例如没有被标记为已读的
      }
    });

    return NextResponse.json({
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching unread chat count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread chat count" },
      { status: 500 }
    );
  }
} 