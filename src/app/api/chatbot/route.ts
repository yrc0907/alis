import { NextResponse } from 'next/server';
import { queryKnowledgeBase } from '@/lib/knowledge-base';

// 支持跨域请求的函数
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // 在生产环境中，应该指定确切的来源域名
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// 处理预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// DeepSeek AI API 类型定义
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 系统提示词，定义聊天机器人行为和特点
const SYSTEM_PROMPT = `你是一个友善、专业的AI助手。
你的名字是Corinna AI，是由DeepSeek AI技术驱动的。
你需要以简洁、有帮助的方式回答用户的问题。
当被问及你的能力时，你可以解释你由DeepSeek AI提供支持，可以帮助回答问题、提供信息和协助完成任务。
如果你不知道某个问题的答案，诚实地承认，不要编造信息。`;

// 默认配置
const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;

// 修改流式响应的编码器
function encodeStreamData(chunk: string): string {
  // 确保JSON格式正确且有一个换行结尾
  return `data: ${JSON.stringify({ content: chunk })}\n\n`;
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

// 调用DeepSeek API生成回复 - 流式响应版本
async function generateStreamingResponse(messages: ChatMessage[], controller: ReadableStreamController<Uint8Array>): Promise<void> {
  try {
    // 首先检查是否有知识库匹配
    const userQuestion = messages[messages.length - 1].content;
    const knowledgeMatch = queryKnowledgeBase(userQuestion);

    if (knowledgeMatch) {
      // 如果找到知识库匹配，直接返回知识库答案
      await streamKnowledgeBaseAnswer(knowledgeMatch.answer, controller);
      return;
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      controller.enqueue(new TextEncoder().encode(encodeStreamData("抱歉，AI服务当前不可用。请联系管理员设置API密钥。")));
      controller.close();
      return;
    }

    const requestBody: ChatCompletionRequest = {
      model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      stream: true, // 启用流式响应
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

      // 处理剩余的缓冲区数据
      if (buffer && buffer !== 'data: [DONE]') {
        try {
          if (buffer.startsWith('data: ')) {
            const data = JSON.parse(buffer.substring(6));
            const content = data.choices?.[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(encodeStreamData(content)));
            }
          }
        } catch (e) {
          // 忽略解析错误
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

// 非流式版本的API调用 - 用于不支持流式传输的场景
async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
  // 首先检查是否有知识库匹配
  const userQuestion = messages[messages.length - 1].content;
  const knowledgeMatch = queryKnowledgeBase(userQuestion);

  if (knowledgeMatch) {
    // 如果找到知识库匹配，直接返回知识库答案
    return knowledgeMatch.answer;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return "抱歉，AI服务当前不可用。请联系管理员设置API密钥。";
  }

  try {
    const requestBody: ChatCompletionRequest = {
      model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: Number(process.env.DEEPSEEK_MAX_TOKENS) || DEFAULT_MAX_TOKENS,
      temperature: Number(process.env.DEEPSEEK_TEMPERATURE) || DEFAULT_TEMPERATURE,
      stream: false
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return "抱歉，连接AI服务时出错。请稍后再试。";
    }

    const responseText = await response.text();

    try {
      const data = JSON.parse(responseText) as ChatCompletionResponse;
      if (!data.choices || data.choices.length === 0) {
        return "抱歉，AI没有返回有效响应。请稍后再试。";
      }

      return data.choices[0].message.content;
    } catch (parseError) {
      return "抱歉，解析AI响应时出错。请稍后再试。";
    }
  } catch (error) {
    return "抱歉，AI响应生成失败。请稍后再试。";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], stream = true } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        {
          status: 400,
          headers: corsHeaders()
        }
      );
    }

    // 转换消息历史为DeepSeek API格式
    const formattedHistory: ChatMessage[] = history.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // 添加当前用户消息
    formattedHistory.push({ role: 'user', content: message });

    // 如果客户端请求流式响应
    if (stream) {
      // 创建流式响应
      const stream = new ReadableStream({
        start: (controller) => {
          generateStreamingResponse(formattedHistory, controller);
        }
      });

      // 返回流式响应
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders()
        }
      });
    } else {
      // 使用非流式API调用
      const aiResponse = await generateAIResponse(formattedHistory);

      return NextResponse.json(
        { message: aiResponse },
        { headers: corsHeaders() }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: corsHeaders()
      }
    );
  }
} 