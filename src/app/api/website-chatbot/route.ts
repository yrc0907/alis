import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 流式响应的编码器
function encodeStreamData(chunk: string): string {
  // 确保JSON格式正确且有一个换行结尾
  return `data: ${JSON.stringify({ content: chunk })}\n\n`;
}

// 系统提示词，定义聊天机器人行为和特点
const SYSTEM_PROMPT = `你是一个友善、专业的AI助手。
你需要以简洁、有帮助的方式回答用户的问题。
如果你不知道某个问题的答案，诚实地承认，不要编造信息。`;

// 默认配置
const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;

// 从知识库查询答案
async function queryWebsiteKnowledge(websiteId: string, question: string) {
  try {
    // 获取网站配置
    const config = await prisma.knowledgeConfig.findUnique({
      where: {
        websiteId: websiteId
      }
    });

    // 如果配置不存在或知识库被禁用，返回null
    if (!config || !config.enabled) return null;

    // 获取所有知识条目
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        websiteId: websiteId
      }
    });

    if (knowledgeItems.length === 0) return null;

    // 小写化并移除特殊字符以便更好地匹配
    const normalizedQuestion = question.toLowerCase().replace(/[^\w\s]/g, '');

    // 先检查关键词精确匹配
    for (const item of knowledgeItems) {
      // 关键词是以逗号分隔的字符串，需要转换为数组
      const keywords = item.keywords.split(',').map(k => k.trim().toLowerCase());

      for (const keyword of keywords) {
        if (normalizedQuestion.includes(keyword)) {
          return item.answer; // 精确匹配关键词，直接返回
        }
      }
    }

    // 如果没有关键词匹配，计算问题相似度
    let bestMatch = null;
    let bestScore = 0;

    for (const item of knowledgeItems) {
      const score = similarity(
        normalizedQuestion,
        item.question.toLowerCase().replace(/[^\w\s]/g, '')
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    // 如果相似度超过阈值，返回最佳匹配
    return bestScore >= config.threshold ? bestMatch?.answer : null;
  } catch (error) {
    console.error('Error querying knowledge base:', error);
    return null;
  }
}

// 简单的字符串相似度计算
function similarity(s1: string, s2: string): number {
  const longer = s1.length >= s2.length ? s1 : s2;
  const shorter = s1.length < s2.length ? s1 : s2;

  if (longer.length === 0) return 1.0;

  const matchCount = [...shorter].reduce((acc, char, i) =>
    acc + (longer.includes(char) ? 1 : 0), 0);

  return matchCount / longer.length;
}

// 流式响应中使用知识库答案
async function streamKnowledgeBaseAnswer(answer: string, controller: ReadableStreamController<Uint8Array>): Promise<void> {
  try {
    // 将知识库答案分成小块进行流式传输，模拟真实打字效果
    const chunkSize = 4; // 每块字符数
    for (let i = 0; i < answer.length; i += chunkSize) {
      const chunk = answer.substring(i, i + chunkSize);
      controller.enqueue(new TextEncoder().encode(encodeStreamData(chunk)));

      // 添加一点延迟以模拟真实打字
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    controller.close();
  } catch (error) {
    controller.enqueue(new TextEncoder().encode(encodeStreamData("知识库数据流式传输出错。")));
    controller.close();
  }
}

// 流式响应 - 调用DeepSeek API
async function generateStreamingResponse(message: string, websiteId: string, controller: ReadableStreamController<Uint8Array>): Promise<void> {
  try {
    // 首先检查是否有知识库匹配
    const knowledgeAnswer = await queryWebsiteKnowledge(websiteId, message);

    if (knowledgeAnswer) {
      // 如果找到知识库匹配，直接返回知识库答案
      await streamKnowledgeBaseAnswer(knowledgeAnswer, controller);
      return;
    }

    // 如果没有知识库匹配，调用DeepSeek API
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      controller.enqueue(new TextEncoder().encode(encodeStreamData("抱歉，AI服务当前不可用。请联系管理员设置API密钥。")));
      controller.close();
      return;
    }

    // 获取网站信息以自定义响应
    const website = await prisma.website.findUnique({
      where: {
        id: websiteId
      }
    });

    // 自定义系统提示词
    const customSystemPrompt = website
      ? `你是${website.name}的AI助手。${SYSTEM_PROMPT}`
      : SYSTEM_PROMPT;

    const requestBody = {
      model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: customSystemPrompt },
        { role: 'user', content: message }
      ],
      stream: true,
      temperature: Number(process.env.DEEPSEEK_TEMPERATURE) || DEFAULT_TEMPERATURE
    };

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok || !response.body) {
      controller.enqueue(new TextEncoder().encode(encodeStreamData("抱歉，连接AI服务时出错。请稍后再试。")));
      controller.close();
      return;
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码并处理块数据
        buffer += decoder.decode(value, { stream: true });

        // 处理多行数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(new TextEncoder().encode(encodeStreamData(content)));
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      controller.enqueue(new TextEncoder().encode(encodeStreamData("读取AI响应时发生错误。请稍后再试。")));
    } finally {
      controller.close();
    }
  } catch (error) {
    controller.enqueue(new TextEncoder().encode(encodeStreamData("抱歉，AI响应生成失败。请稍后再试。")));
    controller.close();
  }
}

// 聊天API接口
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, websiteId, apiKey } = body;

    // 验证必填字段
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // 验证API密钥
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        apiKey: apiKey
      }
    });

    if (!website) {
      return NextResponse.json(
        { error: 'Invalid API key or website ID' },
        { status: 401 }
      );
    }

    // 创建流式响应
    const stream = new ReadableStream({
      start: (controller) => {
        generateStreamingResponse(message, websiteId, controller);
      }
    });

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检请求）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 