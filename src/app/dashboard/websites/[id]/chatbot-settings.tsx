"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 聊天机器人设置类型
interface ChatbotConfig {
  // 基本设置
  displayName: string;
  welcomeMessage: string;
  primaryColor: string;
  position: "bottom-right" | "bottom-left";
  avatarUrl?: string;
  // AI设置
  model: string;
  temperature: number;
  // 行为设置
  maxMessagesInContext: number;
  streamingEnabled: boolean;
}

// 组件属性
interface ChatbotSettingsProps {
  websiteId: string;
}

export default function ChatbotSettings({ websiteId }: ChatbotSettingsProps) {
  // 使用默认值初始化配置
  const [config, setConfig] = useState<ChatbotConfig>({
    displayName: "",
    welcomeMessage: "您好！我能为您提供什么帮助？",
    primaryColor: "#fb923c",
    position: "bottom-right",
    model: "deepseek-chat",
    temperature: 0.7,
    maxMessagesInContext: 10,
    streamingEnabled: true
  });
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 添加预览交互状态
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [userMessage, setUserMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ type: "bot" | "user", content: string, time: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // 初始化聊天记录
  useEffect(() => {
    if (config.welcomeMessage) {
      setChatMessages([
        {
          type: "bot",
          content: config.welcomeMessage,
          time: "10:30 AM"
        }
      ]);
    }
  }, [config.welcomeMessage]);

  // 获取聊天机器人配置
  const fetchChatbotConfig = useCallback(async () => {
    try {
      setLoading(true);
      // 在实际应用中，这里应该从API获取配置
      // 目前我们使用模拟数据
      setTimeout(() => {
        setConfig({
          ...config,
          displayName: `${websiteId} 助手`, // 默认使用网站ID作为名称
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching chatbot config:", error);
      setLoading(false);
    }
  }, [config, websiteId]);

  // 保存聊天机器人配置
  const saveChatbotConfig = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      // 在实际应用中，这里应该调用API保存配置
      // 目前我们使用模拟延迟
      setTimeout(() => {
        setSuccess(true);
        setSaving(false);

        // 3秒后隐藏成功消息
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }, 1000);
    } catch (error: unknown) {
      console.error("Error saving chatbot config:", error);
      const errorMessage = error instanceof Error ? error.message : "保存配置失败，请稍后再试";
      setError(errorMessage);
      setSaving(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    if (websiteId) {
      fetchChatbotConfig();
    }
  }, [websiteId, fetchChatbotConfig]);

  // 处理发送消息
  const handleSendMessage = () => {
    if (!userMessage.trim()) return;

    // 添加用户消息
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages([...chatMessages, {
      type: "user",
      content: userMessage,
      time: currentTime
    }]);

    setUserMessage("");
    setIsTyping(true);

    // 模拟AI回复
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, {
        type: "bot",
        content: "感谢您的咨询！这是一个模拟回复，在实际部署后，AI将会根据您的问题提供专业解答。",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  // 处理按键事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // 处理颜色改变
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({
      ...config,
      primaryColor: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">聊天机器人设置</h2>
          <p className="text-sm text-muted-foreground">
            定制您网站的聊天机器人外观和行为
          </p>
        </div>
        <Button onClick={saveChatbotConfig} disabled={saving}>
          {saving ? "保存中..." : "保存设置"}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 border border-green-300 text-green-600 rounded-md text-sm">
          设置已成功保存！
        </div>
      )}

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance">外观</TabsTrigger>
          <TabsTrigger value="behavior">行为</TabsTrigger>
          <TabsTrigger value="ai">AI设置</TabsTrigger>
        </TabsList>

        {/* 外观设置 */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>外观设置</CardTitle>
              <CardDescription>
                定制聊天机器人在您网站上的展示方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">显示名称</Label>
                  <Input
                    id="displayName"
                    value={config.displayName}
                    onChange={(e) => setConfig({ ...config, displayName: e.target.value })}
                    placeholder="例如：客服助手"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">欢迎消息</Label>
                  <Input
                    id="welcomeMessage"
                    value={config.welcomeMessage}
                    onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                    placeholder="例如：您好！我能为您提供什么帮助？"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">位置</Label>
                  <Select
                    value={config.position}
                    onValueChange={(value: "bottom-right" | "bottom-left") =>
                      setConfig({ ...config, position: value })
                    }
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder="选择位置" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">右下角</SelectItem>
                      <SelectItem value="bottom-left">左下角</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">主题颜色</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    />
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={handleColorChange}
                      className="w-10 h-10 p-1 rounded"
                      aria-label="选择颜色"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">头像URL（可选）</Label>
                <Input
                  id="avatarUrl"
                  value={config.avatarUrl || ""}
                  onChange={(e) => setConfig({ ...config, avatarUrl: e.target.value })}
                  placeholder="例如：https://example.com/avatar.png"
                />
                <p className="text-xs text-muted-foreground">
                  留空将使用默认头像
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>预览</CardTitle>
              <CardDescription>
                聊天机器人的外观预览
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center bg-white rounded-lg p-8 min-h-[500px] relative overflow-hidden">
              {/* 模拟网站背景 - 简化成白色背景 */}


              <div className={`absolute z-10 flex flex-col ${config.position === "bottom-right" ? "right-6" : "left-6"} bottom-6 items-${config.position === "bottom-right" ? "end" : "start"}`}>
                {/* 聊天窗口 */}
                <div
                  className={`mb-4 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform origin-bottom-${config.position === "bottom-right" ? "right" : "left"} ${isChatOpen
                    ? "opacity-100 scale-100 max-h-[500px]"
                    : "opacity-0 scale-95 max-h-0 mb-0"
                    }`}
                >
                  {/* 聊天头部 */}
                  <div className="p-4 flex items-center justify-between" style={{ backgroundColor: config.primaryColor, color: 'white' }}>
                    <div className="flex items-center">
                      {config.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={config.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full mr-3" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                      )}
                      <h3 className="font-medium text-sm">{config.displayName || "聊天助手"}</h3>
                    </div>
                    <button
                      className="p-1 hover:bg-white/10 rounded"
                      aria-label="关闭聊天"
                      onClick={() => setIsChatOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  {/* 聊天消息区域 */}
                  <div className="bg-gray-50 p-4 h-64 overflow-y-auto flex flex-col space-y-3">
                    {/* 动态消息渲染 */}
                    {chatMessages.map((msg, index) => (
                      msg.type === "bot" ? (
                        <div className="flex" key={index}>
                          {config.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={config.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full mr-2 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: config.primaryColor }}>
                              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                {(config.displayName || "AI").substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                          )}
                          <div className="ml-2 bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%]">
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-[10px] text-gray-400 mt-1 text-right">{msg.time}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end" key={index}>
                          <div className="mr-2 p-3 rounded-lg rounded-tr-none shadow-sm max-w-[80%] text-white" style={{ backgroundColor: config.primaryColor }}>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-[10px] text-white/70 mt-1 text-right">{msg.time}</p>
                          </div>
                        </div>
                      )
                    ))}

                    {/* 正在输入指示器 */}
                    {isTyping && (
                      <div className="flex">
                        {config.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={config.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full mr-2 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: config.primaryColor }}>
                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                              {(config.displayName || "AI").substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <div className="ml-2 bg-white py-2 px-4 rounded-lg rounded-tl-none shadow-sm inline-flex">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 输入区域 */}
                  <div className="p-3 bg-white border-t border-gray-100">
                    <div className="relative rounded-full bg-gray-100 flex items-center">
                      <Input
                        placeholder="输入消息..."
                        className="text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                      <button
                        className="absolute right-1 rounded-full p-1.5"
                        style={{ backgroundColor: config.primaryColor }}
                        aria-label="发送消息"
                        onClick={handleSendMessage}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 聊天按钮 */}
                <button
                  className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110"
                  style={{ backgroundColor: config.primaryColor }}
                  aria-label={isChatOpen ? "隐藏聊天" : "打开聊天"}
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isChatOpen ?
                      <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></> :
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    }
                  </svg>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 添加一个样式标签用于打字动画 */}
          <style jsx global>{`
            .typing-indicator {
              display: flex;
              align-items: center;
            }
            
            .typing-indicator span {
              height: 8px;
              width: 8px;
              float: left;
              margin: 0 1px;
              background-color: #9e9ea1;
              display: block;
              border-radius: 50%;
              opacity: 0.4;
            }
            
            .typing-indicator span:nth-of-type(1) {
              animation: 1s blink infinite 0.3333s;
            }
            
            .typing-indicator span:nth-of-type(2) {
              animation: 1s blink infinite 0.6666s;
            }
            
            .typing-indicator span:nth-of-type(3) {
              animation: 1s blink infinite 0.9999s;
            }
            
            @keyframes blink {
              50% {
                opacity: 1;
              }
            }
          `}</style>
        </TabsContent>

        {/* 行为设置 */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>行为设置</CardTitle>
              <CardDescription>
                配置聊天机器人的交互行为
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxMessages">上下文消息数量</Label>
                  <span className="text-sm text-muted-foreground">{config.maxMessagesInContext}</span>
                </div>
                <Input
                  id="maxMessages"
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={config.maxMessagesInContext}
                  onChange={(e) => setConfig({ ...config, maxMessagesInContext: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  AI响应时考虑的历史消息数量，较高的值提供更多上下文但可能增加成本
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">启用流式响应</h4>
                  <p className="text-sm text-muted-foreground">
                    显示逐字打字的动画效果，创造更自然的对话体验
                  </p>
                </div>
                <Switch
                  checked={config.streamingEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, streamingEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI设置 */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI设置</CardTitle>
              <CardDescription>
                配置聊天机器人的AI行为参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">AI模型</Label>
                <Select
                  value={config.model}
                  onValueChange={(value) => setConfig({ ...config, model: value })}
                >
                  <SelectTrigger id="model">
                    <SelectValue placeholder="选择AI模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                    <SelectItem value="deepseek-chat-pro">DeepSeek Chat Pro (推荐)</SelectItem>
                    <SelectItem value="deepseek-coder">DeepSeek Coder (技术问题)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  不同模型有不同的能力和成本，请根据需求选择
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">响应创造性 (Temperature)</Label>
                  <span className="text-sm text-muted-foreground">{config.temperature}</span>
                </div>
                <Input
                  id="temperature"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  较低的值产生更一致的回答，较高的值产生更多样化的回答
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>系统提示词</CardTitle>
              <CardDescription>
                定义聊天机器人的角色和行为指南
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[200px]"
                placeholder="例如：你是一个友善的客服助手，专注于解答用户关于我们产品的问题。请保持回答简洁、友好且有帮助。"
                value={`你是${config.displayName || "客服助手"}，一个专业、友善的AI助手。
你需要以简洁、有帮助的方式回答用户的问题。
如果你不知道某个问题的答案，诚实地承认，不要编造信息。`}
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-2">
                系统提示词会自动根据您的网站信息生成，目前不支持自定义
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 