import { NextResponse } from 'next/server';
import {
  loadKnowledgeBase,
  addKnowledgeItem,
} from '@/lib/knowledge-base';

export async function GET() {
  try {
    const items = loadKnowledgeBase();
    return NextResponse.json(items);
  } catch (error: unknown) {
    console.error('Error loading knowledge base:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to load knowledge base: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, keywords, answer } = body;

    // 验证必填字段
    if (!question || !answer || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Question, answer, and keywords array are required' },
        { status: 400 }
      );
    }

    // 添加新知识条目
    const newItem = addKnowledgeItem({ question, keywords, answer });
    return NextResponse.json(newItem);
  } catch (error: unknown) {
    console.error('Error adding knowledge item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to add knowledge item: ${errorMessage}` },
      { status: 500 }
    );
  }
} 