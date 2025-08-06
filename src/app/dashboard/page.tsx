"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowUpRight, CreditCard, Activity, BarChart, LineChart, Globe, PlusCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 网站类型定义
interface Website {
  id: string;
  name: string;
  domain: string;
  description: string | null;
  createdAt: string;
  apiKey: string;
  knowledgeItems?: { id: string }[];
}

// Reusable stat card component for better maintainability
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  positive?: boolean;
}

const StatCard = ({ title, value, change, icon: Icon, positive = true }: StatCardProps) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        <p className={`text-xs ${positive ? "text-green-500" : "text-red-500"} flex items-center mt-1`}>
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {change}
        </p>
      </div>
      <div className="p-2 bg-primary/10 rounded-full">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
  </Card>
);

// 网站卡片组件
const WebsiteCard = ({ website }: { website: Website }) => {
  const knowledgeItemCount = website.knowledgeItems?.length || 0;
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/websites/${website.id}`);
  };

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-full">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-medium truncate">{website.name}</h3>
      </div>
      <p className="text-sm text-muted-foreground truncate mb-4">{website.domain}</p>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground">知识库条目</p>
          <p className="font-medium">{knowledgeItemCount}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/websites/${website.id}`}>管理</Link>
        </Button>
      </div>
    </Card>
  );
};

export default function DashboardPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
    name: "",
    domain: "",
    description: ""
  });
  const [error, setError] = useState("");
  const router = useRouter();

  // 获取网站列表
  const fetchWebsites = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/websites");

      if (!response.ok) {
        throw new Error("Failed to fetch websites");
      }

      const data = await response.json();
      setWebsites(data);
    } catch (error) {
      console.error("Error fetching websites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加新网站
  const addWebsite = async () => {
    try {
      setError("");

      if (!newWebsite.name.trim() || !newWebsite.domain.trim()) {
        setError("网站名称和域名不能为空");
        return;
      }

      const response = await fetch("/api/websites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWebsite),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "添加网站失败");
      }

      const createdWebsite = await response.json();

      setWebsites([createdWebsite, ...websites]);
      setIsDialogOpen(false);
      setNewWebsite({ name: "", domain: "", description: "" });

      // 重定向到新建网站的详情页
      router.push(`/dashboard/websites/${createdWebsite.id}`);
    } catch (error: any) {
      console.error("Error adding website:", error);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  return (
    // 调整内边距和间距
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your dashboard overview.</p>
      </div>

      {/* 网站管理部分 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">您的网站</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          添加网站
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card className="p-4 h-[140px]" key={i}>
              <div className="animate-pulse flex flex-col h-full">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-6"></div>
                <div className="mt-auto flex justify-between items-center">
                  <div>
                    <div className="h-2 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-8"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : websites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((website) => (
            <WebsiteCard key={website.id} website={website} />
          ))}
        </div>
      ) : (
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <Globe className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">暂无网站</h3>
          <p className="text-muted-foreground mb-4">添加您的第一个网站以开始使用聊天机器人和知识库</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            添加网站
          </Button>
        </Card>
      )}

      {/* 最近预约和用户兴趣 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 最近预约卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>最近预约</CardTitle>
              <CardDescription>
                用户通过聊天机器人提交的预约请求
              </CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {websites.length > 0 ? (
                  <div className="space-y-4">
                    {[
                      { name: '张先生', email: 'zhang@example.com', date: '2023-08-15 14:00', website: '公司官网', status: 'PENDING' },
                      { name: '李小姐', email: 'li@example.com', date: '2023-08-14 10:30', website: '产品展示页', status: 'CONFIRMED' },
                      { name: '匿名用户', email: 'anonymous@example.com', date: '2023-08-12 16:15', website: '公司官网', status: 'COMPLETED' }
                    ].map((appointment, i) => (
                      <div key={i} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${appointment.status === 'PENDING' ? 'bg-amber-500' :
                            appointment.status === 'CONFIRMED' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}>
                            {appointment.name.substring(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{appointment.name}</p>
                            <p className="text-xs text-muted-foreground">{appointment.date}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">查看</Button>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Button variant="link" size="sm" className="text-xs">
                        查看所有预约 →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">暂无预约记录</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 用户兴趣卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>用户兴趣分析</CardTitle>
              <CardDescription>
                根据聊天内容分析的用户兴趣
              </CardDescription>
            </div>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-200 rounded-full w-3/4"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-200 rounded-full w-1/2"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-200 rounded-full w-1/4"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <div>
                {websites.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm mb-2">最近30天的用户兴趣分布</p>

                    {/* 产品兴趣 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>产品信息</span>
                        <span className="text-muted-foreground">42%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>

                    {/* 价格兴趣 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>价格咨询</span>
                        <span className="text-muted-foreground">28%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 bg-amber-500 rounded-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>

                    {/* 预约兴趣 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>预约需求</span>
                        <span className="text-muted-foreground">18%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: '18%' }}></div>
                      </div>
                    </div>

                    {/* 联系方式 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>联系方式</span>
                        <span className="text-muted-foreground">12%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 bg-purple-500 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <Button variant="link" size="sm" className="text-xs">
                        查看详细分析 →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">暂无用户兴趣数据</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总网站数"
          value={`${websites.length}`}
          change="+12.5%"
          icon={Globe}
        />

        <StatCard
          title="总知识条目"
          value={websites.reduce((sum, site) => sum + (site.knowledgeItems?.length || 0), 0).toString()}
          change="+7.2%"
          icon={CreditCard}
        />

        <StatCard
          title="活跃对话"
          value="1,274"
          change="+18.3%"
          icon={Activity}
        />

        <StatCard
          title="回答准确率"
          value="85.2%"
          change="+3.1%"
          icon={BarChart}
        />
      </div>

      {/* 活动日志和分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">最近活动</h3>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-4 border-b pb-4 last:border-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">新增知识库条目</p>
                  <p className="text-xs text-muted-foreground">在 "公司网站" 中</p>
                </div>
                <p className="text-xs text-muted-foreground">2 小时前</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">聊天分析</h3>
          </div>
          <div className="h-[260px] flex items-center justify-center border rounded-md">
            <div className="text-center p-6">
              <LineChart className="h-12 w-12 mx-auto text-primary mb-2" />
              <h4 className="text-lg font-medium">月度对话量</h4>
              <p className="text-sm text-muted-foreground mt-1">
                查看详细的对话数据和知识库使用情况
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 添加网站对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新网站</DialogTitle>
            <DialogDescription>
              添加一个新网站以配置聊天机器人和知识库。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">网站名称</Label>
              <Input
                id="name"
                placeholder="例如：公司官网"
                value={newWebsite.name}
                onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">网站域名</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={newWebsite.domain}
                onChange={(e) => setNewWebsite({ ...newWebsite, domain: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">请输入不带 http:// 或 https:// 的域名</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">网站描述（可选）</Label>
              <Textarea
                id="description"
                placeholder="简短描述您的网站..."
                value={newWebsite.description}
                onChange={(e) => setNewWebsite({ ...newWebsite, description: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={addWebsite}>添加网站</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
