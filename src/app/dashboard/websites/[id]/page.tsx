"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Settings, Database, MessageSquare } from "lucide-react";
import Link from "next/link";
import EmbedCodeGenerator from "./embed-code";

// 知识库页面组件 - 负责展示和管理知识库条目
import KnowledgeBase from "./knowledge";
// 聊天机器人设置页面组件 - 负责管理聊天机器人的配置
import ChatbotSettings from "./chatbot-settings";

interface Website {
  id: string;
  name: string;
  domain: string;
  description: string | null;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
  config?: {
    id: string;
    enabled: boolean;
    threshold: number;
  };
}

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedWebsite, setEditedWebsite] = useState<{
    name: string;
    domain: string;
    description: string;
  }>({
    name: "",
    domain: "",
    description: ""
  });
  const [error, setError] = useState("");

  const websiteId = params?.id as string;

  // 获取网站详情
  const fetchWebsite = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/websites/${websiteId}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard"); // 如果网站不存在，返回主页
          return;
        }
        throw new Error("Failed to fetch website");
      }

      const data = await response.json();
      setWebsite(data);
      setEditedWebsite({
        name: data.name,
        domain: data.domain,
        description: data.description || ""
      });
    } catch (error) {
      console.error("Error fetching website:", error);
    } finally {
      setLoading(false);
    }
  };

  // 更新网站信息
  const updateWebsite = async () => {
    try {
      setError("");

      if (!editedWebsite.name || !editedWebsite.domain) {
        setError("网站名称和域名不能为空");
        return;
      }

      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editedWebsite)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新网站失败");
      }

      const updatedWebsite = await response.json();
      setWebsite(updatedWebsite);
      setEditing(false);
    } catch (error: any) {
      console.error("Error updating website:", error);
      setError(error.message);
    }
  };

  // 删除网站
  const deleteWebsite = async () => {
    if (!confirm("确定要删除此网站吗？此操作无法撤销，所有相关的知识库内容将被永久删除。")) {
      return;
    }

    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("删除网站失败");
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting website:", error);
      alert("删除网站时出错，请稍后再试");
    }
  };

  useEffect(() => {
    if (websiteId) {
      fetchWebsite();
    }
  }, [websiteId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center">
          <Link href="/dashboard" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-40 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="p-6">
        <Link href="/dashboard" className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        </Link>
        <Card className="mt-4">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium">网站不存在</h2>
              <p className="text-muted-foreground mt-2">未找到请求的网站或您没有权限访问</p>
              <Button className="mt-4" onClick={() => router.push("/dashboard")}>返回仪表板</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          {!editing ? (
            <div>
              <h1 className="text-2xl font-bold">{website.name}</h1>
              <p className="text-sm text-muted-foreground">{website.domain}</p>
            </div>
          ) : null}
        </div>
        {!editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>编辑网站</Button>
            <Button variant="destructive" onClick={deleteWebsite}>删除网站</Button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>编辑网站信息</CardTitle>
            <CardDescription>更新您的网站配置信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">网站名称</Label>
              <Input
                id="edit-name"
                value={editedWebsite.name}
                onChange={(e) => setEditedWebsite({ ...editedWebsite, name: e.target.value })}
                placeholder="网站名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-domain">网站域名</Label>
              <Input
                id="edit-domain"
                value={editedWebsite.domain}
                onChange={(e) => setEditedWebsite({ ...editedWebsite, domain: e.target.value })}
                placeholder="example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">网站描述</Label>
              <Textarea
                id="edit-description"
                value={editedWebsite.description}
                onChange={(e) => setEditedWebsite({ ...editedWebsite, description: e.target.value })}
                placeholder="简要描述您的网站..."
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setEditing(false)}>取消</Button>
            <Button onClick={updateWebsite}>保存更改</Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          {website.description && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>网站描述</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{website.description}</p>
              </CardContent>
            </Card>
          )}

          <EmbedCodeGenerator website={website} />

          <Tabs defaultValue="knowledge">
            <TabsList className="mb-6">
              <TabsTrigger value="knowledge" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                知识库
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                聊天机器人
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                设置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="knowledge" className="space-y-4">
              <KnowledgeBase websiteId={website.id} />
            </TabsContent>

            <TabsContent value="chatbot" className="space-y-4">
              <ChatbotSettings websiteId={website.id} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API信息</CardTitle>
                  <CardDescription>用于API调用的身份验证</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>API 密钥</Label>
                    <div className="relative">
                      <Input value={website.apiKey} readOnly />
                      <Button
                        className="absolute right-1 top-1"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(website.apiKey);
                          alert("API密钥已复制到剪贴板");
                        }}
                      >
                        复制
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      此密钥用于您的API请求身份验证，请妥善保管。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 