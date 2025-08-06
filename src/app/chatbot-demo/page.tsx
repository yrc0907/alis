"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Chatbot from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatbotDemo() {
  const [config, setConfig] = useState({
    botName: "Corinna AI",
    initialMessage: "Hi there! How can I help you today?",
    primaryColor: "#fb923c",
    position: "bottom-right",
  });

  // 基础嵌入代码
  const basicEmbedCode = `<script src="${window.location.origin}/chatbot-embed.js" 
  data-name="${config.botName}"
  data-message="${config.initialMessage}"
  data-color="${config.primaryColor}"
  data-position="${config.position}"
></script>`;

  // React 组件代码
  const reactComponentCode = `import { Chatbot } from '@your-package/chatbot';

function YourApp() {
  return (
    <div>
      {/* Your website content */}
      
      <Chatbot
        botName="${config.botName}"
        initialMessage="${config.initialMessage}"
        primaryColor="${config.primaryColor}"
        position="${config.position}"
        apiEndpoint="/api/chatbot"
      />
    </div>
  );
}`;

  // 自定义配置处理函数
  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">嵌入式聊天机器人</h1>
      <p className="text-lg mb-8">
        在这里您可以配置和测试聊天机器人，然后将其嵌入到您的网站中。
      </p>

      <div className="mb-6 flex justify-center">
        <a
          href="/embed-example.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-orange-400 px-4 py-2 font-medium text-white hover:bg-orange-500 transition-colors"
        >
          查看完整示例页面
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 配置面板 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>配置您的聊天机器人</CardTitle>
              <CardDescription>
                自定义聊天机器人的外观和行为
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName">机器人名称</Label>
                <Input
                  id="botName"
                  value={config.botName}
                  onChange={(e) => handleConfigChange('botName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialMessage">初始消息</Label>
                <Input
                  id="initialMessage"
                  value={config.initialMessage}
                  onChange={(e) => handleConfigChange('initialMessage', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">主题颜色</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    value={config.primaryColor}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                  />
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                    className="w-10 h-10 p-1 rounded"
                    aria-label="选择颜色"
                    title="选择颜色"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>位置</Label>
                <div className="flex gap-4">
                  <Button
                    variant={config.position === "bottom-right" ? "default" : "outline"}
                    onClick={() => handleConfigChange('position', 'bottom-right')}
                  >
                    右下角
                  </Button>
                  <Button
                    variant={config.position === "bottom-left" ? "default" : "outline"}
                    onClick={() => handleConfigChange('position', 'bottom-left')}
                  >
                    左下角
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 嵌入代码 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>嵌入代码</CardTitle>
              <CardDescription>
                复制以下代码并粘贴到您网站的HTML中
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="script">
                <TabsList className="mb-4">
                  <TabsTrigger value="script">脚本标签</TabsTrigger>
                  <TabsTrigger value="react">React 组件</TabsTrigger>
                </TabsList>

                <TabsContent value="script">
                  <div className="relative">
                    <SyntaxHighlighter language="html" style={atomDark}>
                      {basicEmbedCode}
                    </SyntaxHighlighter>
                    <Button
                      className="absolute top-2 right-2"
                      variant="secondary"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(basicEmbedCode)}
                    >
                      复制
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="react">
                  <div className="relative">
                    <SyntaxHighlighter language="jsx" style={atomDark}>
                      {reactComponentCode}
                    </SyntaxHighlighter>
                    <Button
                      className="absolute top-2 right-2"
                      variant="secondary"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(reactComponentCode)}
                    >
                      复制
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* 预览面板 */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>实时预览</CardTitle>
              <CardDescription>
                点击右下角的聊天图标来测试您的聊天机器人
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] relative">
              <div className="absolute inset-0 bg-gray-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500 text-center">这里是您的网站内容<br />聊天机器人会显示在右下角</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 聊天机器人实例 */}
      <Chatbot
        botName={config.botName}
        initialMessage={config.initialMessage}
        primaryColor={config.primaryColor}
        position={config.position as "bottom-right" | "bottom-left"}
      />
    </div>
  );
} 