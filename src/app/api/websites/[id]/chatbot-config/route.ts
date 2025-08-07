import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// GET chatbot configuration for a website
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await prisma.chatbotConfig.findUnique({
      where: { websiteId: params.id },
    });

    if (config) {
      console.log('GET /chatbot-config: Found config, returning:', config);
      return NextResponse.json(config);
    }

    // If no config exists, return default values (don't create it yet)
    return NextResponse.json({
      displayName: "客服助手",
      welcomeMessage: "您好！我能为您提供什么帮助？",
      primaryColor: "#fb923c",
      position: "bottom-right",
      model: "deepseek-chat",
      temperature: 0.7,
      maxMessagesInContext: 10,
      streamingEnabled: true,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// UPDATE chatbot configuration for a website
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log('POST /chatbot-config: Received body to save:', body);

    const config = await prisma.chatbotConfig.upsert({
      where: { websiteId: params.id },
      update: body,
      create: {
        ...body,
        websiteId: params.id,
      },
    });

    console.log('POST /chatbot-config: Upserted, returning:', config);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to save config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
} 