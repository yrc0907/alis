"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { BarChart, Globe, PlusCircle, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

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

// 预约类型定义
interface Appointment {
  id: string;
  name: string | null;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  website: {
    name: string;
  };
}

// 用户兴趣类型定义
interface UserInterest {
  type: string;
  count: number;
  percentage?: string;
}

// 潜在用户类型定义
interface PotentialUser {
  id: string;
  name: string | null;
  email: string;
  source: string;
  createdAt: string;
}

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [potentialUsers, setPotentialUsers] = useState<PotentialUser[]>([]);
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
    } catch (error: unknown) {
      console.error("Error adding website:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    }
  };

  // 获取最近的预约
  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments?limit=5"); // 获取最近5条
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  // 获取用户兴趣数据
  const fetchUserInterests = async () => {
    try {
      const response = await fetch("/api/user-interests");
      if (!response.ok) {
        throw new Error("Failed to fetch user interests");
      }
      const data = await response.json();
      // 计算总数
      const totalInterests = data.interestsByType.reduce((acc: number, item: UserInterest) => acc + item.count, 0);
      // 转换成带百分比的数据
      const interestsWithPercentage = data.interestsByType.map((item: UserInterest) => ({
        ...item,
        percentage: totalInterests > 0 ? ((item.count / totalInterests) * 100).toFixed(0) : 0,
      }));
      setUserInterests(interestsWithPercentage);
    } catch (error) {
      console.error("Error fetching user interests:", error);
    }
  };

  // 获取潜在用户
  const fetchPotentialUsers = async () => {
    try {
      const response = await fetch('/api/potential-users?limit=5');
      if (response.ok) {
        const data = await response.json();
        setPotentialUsers(data);
      }
    } catch (error) {
      console.error("Error fetching potential users:", error);
    }
  };

  useEffect(() => {
    fetchWebsites();
    fetchAppointments();
    fetchUserInterests();
    fetchPotentialUsers();
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
                {websites.length > 0 && appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${appointment.status === 'PENDING' ? 'bg-amber-500' :
                            appointment.status === 'CONFIRMED' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}>
                            {appointment.name ? appointment.name.substring(0, 1) : '匿'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{appointment.name || '匿名用户'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(appointment.date).toLocaleString()}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/appointments/${appointment.id}`}>查看</Link>
                        </Button>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Button variant="link" size="sm" className="text-xs" asChild>
                        <Link href="/dashboard/appointments">查看所有预约 →</Link>
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
                {websites.length > 0 && userInterests.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm mb-2">最近30天的用户兴趣分布</p>

                    {userInterests.map((interest, index) => (
                      <div className="space-y-1" key={index}>
                        <div className="flex justify-between text-xs">
                          <span>{interest.type}</span>
                          <span className="text-muted-foreground">{interest.percentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className={`h-2 rounded-full`}
                            style={{
                              width: `${interest.percentage}%`,
                              backgroundColor: `hsl(${200 + index * 40}, 70%, 50%)`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 text-center">
                      <Button variant="link" size="sm" className="text-xs" asChild>
                        <Link href="/dashboard/analysis">查看详细分析 →</Link>
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

      {/* 潜在用户 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>潜在用户</CardTitle>
            <CardDescription>
              最近识别出的高意向用户
            </CardDescription>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : potentialUsers.length > 0 ? (
            <div className="space-y-4">
              {potentialUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-500 text-white">
                      {user.name ? user.name.substring(0, 1) : '匿'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name || '匿名用户'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{user.source}</Badge>
                </div>
              ))}
              <div className="text-center pt-2">
                <Button variant="link" size="sm" className="text-xs" asChild>
                  <Link href="/dashboard/potential-users">查看所有潜在用户 →</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">暂无潜在用户记录</p>
            </div>
          )}
        </CardContent>
      </Card>


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
