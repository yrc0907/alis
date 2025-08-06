import { NextResponse } from 'next/server';
import { loadKnowledgeConfig, saveKnowledgeConfig } from '@/lib/knowledge-base';

export async function GET() {
  try {
    const config = loadKnowledgeConfig();
    return NextResponse.json(config);
  } catch (error: unknown) {
    console.error('Error loading knowledge config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to load knowledge config: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { enabled, threshold } = body;

    // 验证必填字段
    if (typeof enabled !== 'boolean' || typeof threshold !== 'number') {
      return NextResponse.json(
        { error: 'Enabled (boolean) and threshold (number) are required' },
        { status: 400 }
      );
    }

    // 验证阈值范围
    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Threshold must be between 0 and 1' },
        { status: 400 }
      );
    }

    // 保存配置
    const config = saveKnowledgeConfig({ enabled, threshold });
    return NextResponse.json(config);
  } catch (error: unknown) {
    console.error('Error saving knowledge config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to save knowledge config: ${errorMessage}` },
      { status: 500 }
    );
  }
} 