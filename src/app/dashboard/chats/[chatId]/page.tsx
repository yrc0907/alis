"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Bot, User, RefreshCw } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import io, { Socket } from "socket.io-client";

// 聊天消息类型
interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  createdAt: string;
}

// 聊天会话类型
interface ChatSession {
  id: string;
  sessionId: string;
  visitorId: string | null;
  startedAt: string;
  lastActiveAt: string;
  websiteId: string;
  websiteName: string;
  messages: ChatMessage[];
  isRead: boolean;
  needsHumanSupport?: boolean;
}

// 格式化日期函数
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

export default function ChatDetailPage() {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;

  // 获取聊天会话详情
  const fetchChatSession = async () => {
    if (!chatId) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chats/${chatId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch chat session");
      }

      const data = await response.json();
      setChatSession(data);

      // 标记为已读
      markAsRead();
    } catch (error) {
      console.error("Error fetching chat session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 标记会话为已读
  const markAsRead = async () => {
    try {
      await fetch(`/api/chats/${chatId}/read`, {
        method: "PUT"
      });
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };

  // 发送新消息
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatSession) return;

    try {
      setIsSending(true);

      // 如果有Socket连接，使用Socket发送
      if (socket && socket.connected) {
        // 添加到本地显示
        const tempId = `temp-${Date.now()}`;
        const tempMessage: ChatMessage = {
          id: tempId,
          content: newMessage,
          role: "assistant",
          createdAt: new Date().toISOString()
        };

        setChatSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, tempMessage],
            lastActiveAt: new Date().toISOString()
          };
        });

        // 通过Socket发送
        socket.emit('chat_message', {
          chatSessionId: chatSession.sessionId,
          sessionId: chatSession.sessionId,
          content: newMessage,
          role: 'admin'
        });
      } else {
        // 回退到HTTP API
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            content: newMessage,
            role: "assistant"
          })
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const messageData = await response.json();

        // 更新本地状态
        setChatSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, messageData],
            lastActiveAt: new Date().toISOString()
          };
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // 用户输入时发送"正在输入"状态
  const handleTyping = () => {
    if (!socket || !socket.connected || !chatSession) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        chatSessionId: chatSession.sessionId,
        isTyping: true,
        role: 'admin'
      });
    }

    // 清除之前的超时
    if (typingTimeout) clearTimeout(typingTimeout);

    // 设置新的超时
    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (socket && socket.connected) {
        socket.emit('typing', {
          chatSessionId: chatSession.sessionId,
          isTyping: false,
          role: 'admin'
        });
      }
    }, 2000); // 2秒后停止"正在输入"状态

    setTypingTimeout(timeout);
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 初始化Socket连接
  useEffect(() => {
    if (!chatSession) return;

    // 确保之前的连接已关闭
    if (socket) socket.disconnect();

    // 创建新连接
    const newSocket = io(`${window.location.origin.replace(/:\d+$/, '')}:3001`);

    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);

      // 加入聊天室
      newSocket.emit('join', {
        chatSessionId: chatSession.sessionId,
        role: 'admin'
      });
    });

    newSocket.on('chat_message', (data) => {
      console.log('New message received:', data);

      // 如果是访客发的消息，添加到聊天界面
      if (data.role === 'user') {
        setChatSession(prev => {
          if (!prev) return prev;

          // 避免重复消息
          if (prev.messages.some(m => m.id === data.id)) {
            return prev;
          }

          return {
            ...prev,
            messages: [...prev.messages, {
              id: data.id,
              content: data.content,
              role: data.role,
              createdAt: data.createdAt
            }],
            lastActiveAt: new Date().toISOString()
          };
        });
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    // 清理函数
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      newSocket.disconnect();
    };
  }, [chatSession?.sessionId]);

  // 初始加载
  useEffect(() => {
    fetchChatSession();
  }, [chatId]);

  // 消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse h-8 bg-gray-200 w-1/4 rounded"></div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!chatSession) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">聊天会话不存在</h2>
        <p className="text-muted-foreground mb-6">无法找到请求的聊天会话</p>
        <Button asChild>
          <Link href="/dashboard/chats">返回聊天列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* 标题栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/chats">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              {chatSession.visitorId ? `访客 ${chatSession.visitorId.substring(0, 6)}` : '匿名访客'}
              {!chatSession.isRead && (
                <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
                  未读
                </Badge>
              )}
              {chatSession.needsHumanSupport && (
                <Badge variant="secondary" className="ml-2 bg-red-500 text-white">
                  需要客服支持
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              来自 {chatSession.websiteName} ·
              最近活跃于 {formatDateTime(chatSession.lastActiveAt)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchChatSession}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 聊天内容 */}
      <Card className="overflow-hidden">
        {/* 聊天消息列表 */}
        <CardContent className="p-4 h-[calc(100vh-280px)] overflow-y-auto bg-slate-50">
          <div className="space-y-4">
            {chatSession.messages.length > 0 ? (
              chatSession.messages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'self-start' : message.role === 'system' ? 'self-center' : 'self-end flex-row-reverse'}`}>
                    {message.role !== 'system' && (
                      <Avatar className={message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}>
                        <AvatarFallback>
                          {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div className={`rounded-lg p-3 ${message.role === 'user'
                        ? 'bg-white border'
                        : message.role === 'system'
                          ? 'bg-gray-100 border border-gray-200 text-gray-600 text-sm'
                          : 'bg-primary text-primary-foreground'
                        }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 px-1">
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">该会话暂无消息</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* 消息输入框 */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder="输入回复消息..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              className="flex-1"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="self-end"
            >
              {isSending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              发送
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            按 Enter 发送消息，Shift + Enter 换行
          </p>
        </div>
      </Card>
    </div>
  );
} 