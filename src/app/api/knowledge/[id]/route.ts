import { NextResponse } from 'next/server';
import { updateKnowledgeItem, deleteKnowledgeItem } from '@/lib/knowledge-base';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await req.json();
    const { question, keywords, answer } = body;

    // 验证必填字段
    if (!question || !answer || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Question, answer, and keywords array are required' },
        { status: 400 }
      );
    }

    // 更新知识条目
    const updatedItem = updateKnowledgeItem(id, { question, keywords, answer });

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedItem);
  } catch (error: unknown) {
    console.error('Error updating knowledge item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update knowledge item: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const deleted = deleteKnowledgeItem(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting knowledge item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to delete knowledge item: ${errorMessage}` },
      { status: 500 }
    );
  }
} 