import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取聊天会话列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 支持分页和筛选
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 10;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset") as string) : 0;
    const websiteId = searchParams.get("websiteId");
    const isRead = searchParams.get("isRead");
    const search = searchParams.get("search");
    const needsHumanSupport = searchParams.get("needsHumanSupport");

    // 构建查询条件
    const where: any = {};

    // 按网站ID筛选
    if (websiteId) {
      where.websiteId = websiteId;
    }

    // 按已读/未读状态筛选
    if (isRead !== null) {
      const isReadBool = isRead === "true";
      where.isRead = isReadBool;
    }

    // 按是否需要人工支持筛选
    if (needsHumanSupport !== null) {
      const needsHumanSupportBool = needsHumanSupport === "true";
      where.needsHumanSupport = needsHumanSupportBool;
    }

    // 搜索关键词
    if (search) {
      where.OR = [
        {
          messages: {
            some: {
              content: {
                contains: search,
              },
            },
          },
        },
        {
          visitorId: {
            contains: search,
          },
        },
      ];
    }

    // 获取会话列表
    const chatSessions = await prisma.chatSession.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        lastActiveAt: "desc",
      },
      include: {
        website: {
          select: {
            name: true,
            domain: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // 转换数据结构，添加网站名称和消息数量
    const formattedSessions = chatSessions.map((session) => ({
      id: session.id,
      sessionId: session.sessionId,
      visitorId: session.visitorId || "匿名",
      startedAt: session.startedAt,
      lastActiveAt: session.lastActiveAt,
      websiteId: session.websiteId,
      websiteName: session.website.name,
      websiteDomain: session.website.domain,
      lastMessage: session.messages[0]?.content || "",
      messageCount: session._count.messages,
      // TypeScript可能未更新类型定义，使用类型断言
      isRead: (session as any).isRead ?? true,
      needsHumanSupport: (session as any).needsHumanSupport ?? false,
      supportRequestedAt: (session as any).supportRequestedAt,
      lastPageUrl: (session as any).lastPageUrl,
    }));

    // 获取总数
    const total = await prisma.chatSession.count({ where });

    return NextResponse.json({
      items: formattedSessions,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
} 