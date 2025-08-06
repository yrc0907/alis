import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isDebug?: boolean;
}

interface ChatbotProps {
  initialMessage?: string;
  botName?: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  apiEndpoint?: string;
}

export default function Chatbot({
  initialMessage = "Hi there! How can I help you today?",
  botName = "Corinna AI",
  primaryColor = "#fb923c", // Orange-400
  position = "bottom-right",
  apiEndpoint = "/api/chatbot",
}: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial message when component mounts
  useEffect(() => {
    setMessages([
      {
        id: '0',
        text: initialMessage,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, [initialMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add bot response
      // 检查响应中是否包含调试信息
      const hasDebugPrefix = typeof data.message === 'string' && data.message.startsWith('调试信息:');
      const debugInfo = data.debug ? JSON.stringify(data.debug, null, 2) : '';

      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.message || "Sorry, I couldn't process your request.",
        sender: 'bot',
        timestamp: new Date(),
        isDebug: hasDebugPrefix
      };

      // 如果有额外的调试信息，添加调试消息
      setMessages(prev => [...prev, botMessage]);

      // 如果有调试信息对象，显示详细调试信息
      if (debugInfo) {
        const debugMessage: Message = {
          id: `debug-${Date.now()}`,
          text: `调试数据: ${debugInfo}`,
          sender: 'bot',
          timestamp: new Date(),
          isDebug: true
        };
        setMessages(prev => [...prev, debugMessage]);
      }
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (isMinimized) setIsMinimized(false);
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const closeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  const positionClass = position === 'bottom-left'
    ? 'left-4'
    : 'right-4';

  return (
    <>
      {/* Chat button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className={`fixed ${positionClass} bottom-4 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:shadow-xl`}
          style={{ backgroundColor: primaryColor }}
          aria-label="Open chat"
          title="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed ${positionClass} bottom-4 flex flex-col rounded-lg bg-white shadow-xl transition-all`}
          style={{
            width: '350px',
            height: isMinimized ? '60px' : '500px',
            maxHeight: '80vh'
          }}
        >
          {/* Chat header */}
          <div
            className="flex cursor-pointer items-center justify-between rounded-t-lg p-4"
            style={{ backgroundColor: primaryColor }}
            onClick={toggleMinimize}
          >
            <h3 className="font-medium text-white">{botName}</h3>
            <div className="flex gap-2">
              {isMinimized ? (
                <Maximize2 className="h-5 w-5 text-white" onClick={toggleMinimize} />
              ) : (
                <Minimize2 className="h-5 w-5 text-white" onClick={toggleMinimize} />
              )}
              <X className="h-5 w-5 text-white" onClick={closeChat} />
            </div>
          </div>

          {/* Chat messages */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 ${message.sender === 'user'
                      ? 'bg-gray-200 text-gray-800'
                      : message.isDebug
                        ? 'bg-gray-700 text-white'
                        : `text-white`
                      }`}
                    style={{
                      backgroundColor:
                        message.sender === 'user'
                          ? '#f1f5f9'
                          : message.isDebug
                            ? '#334155' // 深灰色用于调试信息
                            : primaryColor,
                      maxWidth: '80%'
                    }}
                  >
                    {message.isDebug ? (
                      <div>
                        <p className="text-xs font-mono mb-1 text-orange-300">DEBUG INFO</p>
                        <p className="text-sm font-mono whitespace-pre-wrap">{message.text}</p>
                      </div>
                    ) : (
                      <p className="text-sm">{message.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="mb-4 flex justify-start">
                  <div
                    className="rounded-lg px-4 py-2 text-white"
                    style={{ backgroundColor: primaryColor, maxWidth: '80%' }}
                  >
                    <p className="text-sm">Typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Chat input */}
          {!isMinimized && (
            <form onSubmit={handleSendMessage} className="flex border-t p-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-r-md px-4 py-2 text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={isLoading}
                aria-label="Send message"
                title="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
} 