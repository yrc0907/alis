import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';



// 检测用户兴趣的关键词
const INTEREST_KEYWORDS = {
  PRODUCT: ['产品', '商品', '购买', '买', '多少钱', '价格', '功能', '特点', '新品'],
  SERVICE: ['服务', '帮助', '支持', '咨询', '方案', '解决方案'],
  PRICING: ['价格', '费用', '多少钱', '报价', '优惠', '打折', '便宜', '贵'],
  CONTACT: ['联系', '电话', '邮箱', '地址', '客服'],
  APPOINTMENT: ['预约', '约', '会面', '见面', '面谈', '安排时间']
};

// 分析用户消息中的兴趣点
async function analyzeUserInterest(message: string, websiteId: string, chatSessionId: string, userId?: string) {
  try {
    const normalizedMessage = message.toLowerCase();
    const detectedInterests = [];

    // 检查各类兴趣关键词
    for (const [interestType, keywords] of Object.entries(INTEREST_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedMessage.includes(keyword)) {
          detectedInterests.push({
            type: interestType,
            keyword: keyword,
            level: 0.6 // 基础兴趣水平
          });
          break; // 每种类型只记录一次
        }
      }
    }

    // 如果检测到兴趣点，记录到数据库
    if (detectedInterests.length > 0) {
      // 获取最高级别的兴趣
      const primaryInterest = detectedInterests.reduce((prev, current) =>
        prev.level > current.level ? prev : current
      );

      await prisma.userInterest.create({
        data: {
          interestType: primaryInterest.type as 'PRODUCT' | 'SERVICE' | 'PRICING' | 'CONTACT' | 'APPOINTMENT',
          interestLevel: primaryInterest.level,
          source: 'CHAT',
          metadata: JSON.stringify({
            message: message,
            detectedKeyword: primaryInterest.keyword,
            allInterests: detectedInterests
          }),
          websiteId,
          chatSessionId, // 这里使用的是会话的ID (主键)，而不是sessionId字段
          userId
        }
      });

      console.log(`Recorded user interest: ${primaryInterest.type} for session ${chatSessionId}`);
    }
  } catch (error) {
    console.error('Error analyzing user interest:', error);
    // 不中断聊天流程，即使分析失败
  }
}

// 检查是否是预约请求
function isAppointmentRequest(message: string): boolean {
  const appointmentKeywords = ['预约', '约个时间', '约时间', '预定', '面谈', '面试', '咨询', '约见', '约谈', '我要预约'];
  const lowerMessage = message.toLowerCase();
  return appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
}

// 添加预约表单指令到回复中
function addAppointmentOptions(aiResponse: string, websiteId: string): string {
  // 发送直接的预约表单指令，而不是链接
  return `${aiResponse}\n\n<APPOINTMENT_FORM:${websiteId}>`;
}

// 从知识库查询答案
async function queryWebsiteKnowledge(message: string, websiteId: string) {
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
    const normalizedQuestion = message.toLowerCase().replace(/[^\w\s]/g, '');

    // 先检查关键词精确匹配
    for (const item of knowledgeItems) {
      // 关键词是以逗号分隔的字符串，需要转换为数组
      const keywords = item.keywords.split(',').map(k => k.trim().toLowerCase());

      for (const keyword of keywords) {
        if (normalizedQuestion.includes(keyword)) {
          return item; // 精确匹配关键词，直接返回整个知识项
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
    return bestScore >= config.threshold ? bestMatch : null;
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

  const matchCount = [...shorter].reduce((acc, char) =>
    acc + (longer.includes(char) ? 1 : 0), 0);

  return matchCount / longer.length;
}


// 流式响应 - 调用DeepSeek API
async function generateStreamingResponse(
  message: string,
  websiteId: string,
  userName?: string
): Promise<Response | null> {
  try {
    // 获取API密钥
    console.log('username', userName)
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("Missing DEEPSEEK_API_KEY in environment variables");
      return null;
    }

    // 获取网站信息以自定义响应
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      select: {
        name: true,
        domain: true,
        description: true
      }
    });

    // 构建系统提示
    const websiteName = website?.name || "本网站";
    const websiteDomain = website?.domain || "未知域名";
    const websiteDesc = website?.description || "提供各种服务和产品";

    // 系统提示，指导AI如何回复
    const systemPrompt = `你是${websiteName}(${websiteDomain})的AI客服助手。${websiteDesc}
    回复要简洁、专业、有礼貌，不要过于冗长。
    如果用户询问预约、咨询服务或想与真人交谈，告诉他们可以通过预约表单预约时间，我们的团队会联系他们。
    不要编造不存在的信息。如果你不知道某个问题的答案，请诚实告知你没有相关信息，并建议用户联系客服。
    当回复涉及技术、产品特性或价格时，请给出清晰具体的信息。`;

    console.log('Making API request to DeepSeek API');
    console.log('API URL: https://api.deepseek.com/v1/chat/completions');
    console.log('Model:', process.env.DEEPSEEK_MODEL || 'deepseek-chat');

    // 调用DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
        stream: true
      })
    });

    if (!response.ok) {
      console.error(`DeepSeek API 错误: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('错误详情:', errorText);
      return null;
    }

    // 设置流式响应
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // 处理流式数据
    const processStream = async () => {
      if (!response.body) {
        writer.write(encoder.encode(encodeStreamData({ content: "无法获取API响应流" })));
        writer.close();
        return;
      }

      const reader = response.body.getReader();
      const textDecoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // 处理缓冲区中剩余的数据
            if (buffer) {
              processStreamBuffer(buffer, (content) => {
                if (content) {
                  writer.write(encoder.encode(encodeStreamData({ content })));
                }
              });
            }
            writer.close();
            break;
          }

          // 添加新数据到缓冲区
          buffer += textDecoder.decode(value, { stream: true });

          // 处理缓冲区中的完整行
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              // 跳过[DONE]行
              if (data === '[DONE]') continue;

              try {
                const parsedData = JSON.parse(data);
                if (parsedData.choices && parsedData.choices[0].delta.content) {
                  const content = parsedData.choices[0].delta.content;
                  writer.write(encoder.encode(encodeStreamData({ content })));
                }
              } catch (e) {
                console.error('JSON解析错误:', e, 'Line:', line);
              }
            }
          }
        }
      } catch (error: unknown) {
        console.error('流式处理错误:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        writer.write(encoder.encode(encodeStreamData({ content: `处理回复时出错: ${errorMessage}` })));
        writer.close();
      }
    };

    // 启动流处理
    processStream();

    // 返回流式响应
    return new Response(readable, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: unknown) {
    console.error('生成流式响应错误:', error);
    return null;
  }
}

// 生成非流式AI回复
async function generateAIResponse(message: string, websiteId: string): Promise<string> {
  try {
    // 获取API密钥
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return "抱歉，服务器未正确配置API密钥。请联系管理员设置DeepSeek API密钥。";
    }

    // 获取网站信息
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      select: {
        name: true,
        domain: true,
        description: true
      }
    });

    // 构建系统提示
    const websiteName = website?.name || "本网站";
    const websiteDomain = website?.domain || "未知域名";
    const websiteDesc = website?.description || "提供各种服务和产品";

    // 系统提示
    const systemPrompt = `你是${websiteName}(${websiteDomain})的AI客服助手。${websiteDesc}
    回复要简洁、专业、有礼貌，不要过于冗长。
    如果用户询问预约、咨询服务或想与真人交谈，告诉他们可以通过预约表单预约时间，我们的团队会联系他们。
    不要编造不存在的信息。如果你不知道某个问题的答案，请诚实告知你没有相关信息，并建议用户联系客服。
    当回复涉及技术、产品特性或价格时，请给出清晰具体的信息。`;

    // 调用DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
        stream: false
      })
    });

    if (!response.ok) {
      console.error(`DeepSeek API 错误: ${response.status}`);
      return "抱歉，AI服务暂时不可用，请稍后再试。";
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: unknown) {
    console.error('生成AI回复错误:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `抱歉，生成回复时出错: ${errorMessage}`;
  }
}

// 流式数据编码
function encodeStreamData(data: { content: string }): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// 帮助处理流缓冲区的函数
function processStreamBuffer(buffer: string, contentCallback: (content: string) => void) {
  const lines = buffer.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('data:')) {
      const jsonLine = line.substring(5).trim();
      if (jsonLine === '[DONE]') continue;

      try {
        const data = JSON.parse(jsonLine);
        const content = data.choices?.[0]?.delta?.content || '';

        if (content) {
          contentCallback(content);
        }
      } catch {
        // 忽略解析错误
      }
    }
  }
}

// CORS 头信息
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

// 聊天API接口
export async function POST(req: Request) {
  try {
    // 添加CORS头
    const headers = corsHeaders();

    // 解析请求体
    const body = await req.json();
    const { message, websiteId, apiKey, visitorId, chatSessionId: providedSessionId } = body;

    // 验证必需参数
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400, headers });
    }

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400, headers });
    }

    // 验证apiKey和websiteId
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: { user: true }
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404, headers });
    }

    if (website.apiKey !== apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers });
    }

    // 创建或更新聊天会话
    let session;
    let chatSessionId = providedSessionId;

    try {
      if (chatSessionId) {
        // 如果提供了会话ID，尝试查找现有会话
        session = await prisma.chatSession.findUnique({
          where: { sessionId: chatSessionId }
        });
      }

      // 如果会话不存在，创建新会话
      if (!session) {
        // 创建新的会话ID
        if (!chatSessionId) {
          const sessionIdPrefix = 'session_';
          chatSessionId = `${sessionIdPrefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }

        // 创建会话记录
        session = await prisma.chatSession.create({
          data: {
            sessionId: chatSessionId,
            visitorId: visitorId || 'anonymous',
            userId: website.userId,
            websiteId: websiteId
          }
        });

        console.log('创建新的聊天会话:', session.id);
      }

      // 创建聊天消息
      await prisma.chatMessage.create({
        data: {
          content: message,
          role: 'user',
          chatSessionId: session.id // 使用会话的id字段，而不是sessionId
        }
      });
    } catch (error) {
      console.error('处理聊天会话或消息时出错:', error);
      throw error; // 重新抛出错误，让外部catch块处理
    }

    // 分析用户兴趣
    await analyzeUserInterest(message, websiteId, session.id);

    // 检查是否是预约请求
    if (isAppointmentRequest(message)) {
      console.log('检测到预约请求');

      // 构建预约响应
      const appointmentResponse = `您好！我很乐意帮您预约。请在下方表单中填写您的信息，我们的团队会尽快与您联系确认。`;

      // 添加预约表单指令
      const finalResponse = addAppointmentOptions(appointmentResponse, websiteId);

      // 创建机器人回复消息
      await prisma.chatMessage.create({
        data: {
          content: appointmentResponse,
          role: 'assistant',
          chatSessionId: session.id
        }
      });

      // 返回响应
      return NextResponse.json(
        { content: finalResponse, chatSessionId: session.sessionId },
        { status: 200, headers }
      );
    }

    // 尝试从知识库获取匹配
    console.log(`查询网站知识库: ${websiteId}`);
    const knowledgeMatch = await queryWebsiteKnowledge(message, websiteId);

    if (knowledgeMatch) {
      console.log('找到知识库匹配');

      // 创建机器人回复消息
      await prisma.chatMessage.create({
        data: {
          content: knowledgeMatch.answer,
          role: 'assistant',
          chatSessionId: session.id
        }
      });

      // 处理流式响应
      const { readable, writable } = new TransformStream();
      const encoder = new TextEncoder();
      const writer = writable.getWriter();

      // 将知识库结果作为流式数据返回
      const streamData = encodeStreamData({ content: knowledgeMatch.answer });
      writer.write(encoder.encode(streamData));
      writer.close();

      return new Response(readable, {
        headers: {
          ...headers,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // 如果没有知识库匹配，则使用DeepSeek AI
    console.log('无知识库匹配，使用DeepSeek AI');
    const enableStreaming = true; // 默认启用流式响应

    if (enableStreaming) {
      // 使用流式响应
      const stream = await generateStreamingResponse(message, websiteId, website.user?.name || undefined);

      if (!stream) {
        console.error('生成流式响应失败');

        // 尝试使用非流式响应作为备份
        const aiResponse = await generateAIResponse(message, websiteId);

        // 创建机器人回复消息
        await prisma.chatMessage.create({
          data: {
            content: aiResponse,
            role: 'assistant',
            chatSessionId: session.id
          }
        });

        return NextResponse.json(
          { content: aiResponse, chatSessionId: session.sessionId },
          { status: 200, headers }
        );
      }

      // 返回流式响应
      return stream;
    } else {
      // 使用非流式响应
      const aiResponse = await generateAIResponse(message, websiteId);

      // 创建机器人回复消息
      await prisma.chatMessage.create({
        data: {
          content: aiResponse,
          role: 'assistant',
          chatSessionId: session.id
        }
      });

      return NextResponse.json(
        { content: aiResponse, chatSessionId: session.sessionId },
        { status: 200, headers }
      );
    }
  } catch (error: unknown) {
    console.error('聊天机器人API错误:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Error processing request: ${errorMessage}` },
      {
        status: 500,
        headers: corsHeaders()
      }
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
