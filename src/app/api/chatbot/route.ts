import { NextResponse } from 'next/server';

// 简单的响应生成函数，你可以替换为更复杂的AI逻辑
function generateResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // 简单的规则匹配响应
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! How can I help you today?";
  }

  if (lowerMessage.includes('help')) {
    return "I'm here to help! What do you need assistance with?";
  }

  if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help with?";
  }

  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return "Goodbye! Feel free to come back if you have more questions.";
  }

  if (lowerMessage.includes('name')) {
    return "I'm Corinna AI, your friendly assistant!";
  }

  if (lowerMessage.includes('weather')) {
    return "I'm sorry, I don't have access to real-time weather data. You might want to check a weather service for that information.";
  }

  if (lowerMessage.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }

  // 默认响应
  return "I'm not sure how to respond to that. Can you try asking something else?";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 生成响应
    const response = generateResponse(message);

    // 模拟处理延迟，使体验更自然
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 