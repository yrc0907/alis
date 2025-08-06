'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyIcon, CheckIcon } from 'lucide-react';

interface EmbedCodeGeneratorProps {
  website: {
    id: string;
    name: string;
    domain: string;
    apiKey: string;
  };
}

export default function EmbedCodeGenerator({ website }: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  // 设置基础URL
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // 生成嵌入代码
  const scriptCode = `<script src="${baseUrl}/chatbot-embed.js" 
  data-name="${website.name} 助手"
  data-message="您好！我是${website.name}的AI助手，有什么可以帮您的吗？" 
  data-color="#fb923c" 
  data-position="bottom-right"
  data-api-url="${baseUrl}/api/website-chatbot"
  data-website-id="${website.id}"
  data-api-key="${website.apiKey}">
</script>`;

  // API 使用示例代码
  const apiCode = `// 使用fetch发送请求到聊天机器人API
fetch('${baseUrl}/api/website-chatbot', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "用户的问题",
    websiteId: "${website.id}",
    apiKey: "${website.apiKey}"
  })
})
.then(response => response.json())
.then(data => {
  console.log(data.message);
})
.catch(error => {
  console.error('Error:', error);
});`;

  // 复制代码到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>网站嵌入代码</CardTitle>
        <CardDescription>将聊天机器人集成到您的网站中</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="script">
          <TabsList className="mb-4">
            <TabsTrigger value="script">HTML脚本</TabsTrigger>
            <TabsTrigger value="api">API调用</TabsTrigger>
          </TabsList>

          <TabsContent value="script">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{scriptCode}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(scriptCode)}
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              将此代码复制到您网站的HTML中，放置在&lt;body&gt;标签结束前。
            </p>
          </TabsContent>

          <TabsContent value="api">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{apiCode}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(apiCode)}
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              通过API直接与聊天机器人交互，适用于自定义集成场景。
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>注意：</strong> API密钥具有访问权限，请勿与未授权人员共享。如果需要重置API密钥，请联系管理员。
        </p>
      </CardFooter>
    </Card>
  );
} 