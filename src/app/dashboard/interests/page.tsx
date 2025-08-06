"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LineChart as LineChartIcon, Users, Search, Activity } from "lucide-react";

interface Website {
  id: string;
  name: string;
}

// 兴趣类型颜色映射
const interestColors = {
  PRODUCT: "#3b82f6", // blue
  SERVICE: "#10b981", // green
  PRICING: "#f59e0b", // amber
  CONTACT: "#8b5cf6", // purple
  APPOINTMENT: "#ef4444", // red
  GENERAL: "#6b7280", // gray
};

type InterestType = keyof typeof interestColors;

// 兴趣类型中文翻译
const interestTranslations: Record<InterestType, string> = {
  PRODUCT: "产品信息",
  SERVICE: "服务咨询",
  PRICING: "价格咨询",
  CONTACT: "联系方式",
  APPOINTMENT: "预约需求",
  GENERAL: "一般问题",
};

// 兴趣源类型中文翻译
const sourceTranslations = {
  CHAT: "聊天对话",
  WEBSITE_VISIT: "网站访问",
  SEARCH: "搜索查询",
  REFERRAL: "推荐来源",
  DIRECT: "直接访问",
};

type SourceType = keyof typeof sourceTranslations;

// 示例数据 - 日期范围内各类型兴趣数量
const interestTypeData = [
  { name: '产品信息', value: 42, color: '#3b82f6' },
  { name: '价格咨询', value: 28, color: '#f59e0b' },
  { name: '预约需求', value: 18, color: '#ef4444' },
  { name: '联系方式', value: 12, color: '#8b5cf6' },
];

// 示例数据 - 过去30天每日兴趣数量
const dailyInterestData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().substring(0, 10),
    '产品信息': Math.floor(Math.random() * 10) + 5,
    '价格咨询': Math.floor(Math.random() * 8) + 2,
    '预约需求': Math.floor(Math.random() * 5) + 1,
    '联系方式': Math.floor(Math.random() * 4) + 1,
  };
});

interface RecentInterest {
  id: string;
  type: InterestType;
  level: number;
  source: SourceType;
  timestamp: string;
  user: string;
  website: string;
}

// 示例数据 - 最近兴趣点击
const recentInterestData: RecentInterest[] = [
  {
    id: '1',
    type: 'PRODUCT',
    level: 0.8,
    source: 'CHAT',
    timestamp: '2023-08-15T14:30:00',
    user: 'Anonymous Visitor',
    website: 'Company Website'
  },
  {
    id: '2',
    type: 'PRICING',
    level: 0.7,
    source: 'CHAT',
    timestamp: '2023-08-15T13:45:00',
    user: 'Zhang San',
    website: 'Product Landing Page'
  },
  {
    id: '3',
    type: 'APPOINTMENT',
    level: 0.9,
    source: 'CHAT',
    timestamp: '2023-08-15T11:20:00',
    user: 'Li Si',
    website: 'Company Website'
  },
  {
    id: '4',
    type: 'SERVICE',
    level: 0.6,
    source: 'WEBSITE_VISIT',
    timestamp: '2023-08-15T10:15:00',
    user: 'Anonymous Visitor',
    website: 'Support Portal'
  },
  {
    id: '5',
    type: 'CONTACT',
    level: 0.5,
    source: 'CHAT',
    timestamp: '2023-08-15T09:30:00',
    user: 'Wang Wu',
    website: 'Contact Page'
  }
];

export default function InterestsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");
  const [, setIsLoading] = useState(true);

  // 获取网站列表
  useEffect(() => {
    const fetchWebsites = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/websites', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch websites');
        }

        const data = await response.json();
        setWebsites(data);
      } catch (error) {
        console.error('Error fetching websites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebsites();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">用户兴趣分析</h1>
        <p className="text-muted-foreground mt-2">了解用户对您网站内容的兴趣点和行为模式</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="grid gap-2">
          <h2 className="text-lg font-semibold">数据筛选</h2>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择网站" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有网站</SelectItem>
                {websites.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">过去7天</SelectItem>
                <SelectItem value="30">过去30天</SelectItem>
                <SelectItem value="90">过去90天</SelectItem>
                <SelectItem value="365">过去一年</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline">
          导出数据
        </Button>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">总兴趣点击</CardTitle>
              <CardDescription>过去30天</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-green-500 mr-1">↑ 12.5%</span> 较上一周期
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">有效转化率</CardTitle>
              <CardDescription>兴趣点击到行动</CardDescription>
            </div>
            <LineChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-green-500 mr-1">↑ 3.2%</span> 较上一周期
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">独立访客</CardTitle>
              <CardDescription>表达兴趣的用户</CardDescription>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">832</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-green-500 mr-1">↑ 8.7%</span> 较上一周期
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">平均兴趣度</CardTitle>
              <CardDescription>用户兴趣深度</CardDescription>
            </div>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.67</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-red-500 mr-1">↓ 1.2%</span> 较上一周期
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">数据图表</TabsTrigger>
          <TabsTrigger value="details">兴趣详情</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>兴趣分布</CardTitle>
                <CardDescription>各类型兴趣的占比分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={interestTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        innerRadius={70}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {interestTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>兴趣趋势</CardTitle>
                <CardDescription>过去30天各类型兴趣的变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyInterestData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="产品信息" stroke="#3b82f6" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="价格咨询" stroke="#f59e0b" />
                      <Line type="monotone" dataKey="预约需求" stroke="#ef4444" />
                      <Line type="monotone" dataKey="联系方式" stroke="#8b5cf6" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>每日兴趣量</CardTitle>
                <CardDescription>过去30天每日兴趣总量统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyInterestData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="产品信息" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="价格咨询" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="预约需求" stackId="a" fill="#ef4444" />
                      <Bar dataKey="联系方式" stackId="a" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>兴趣详情列表</CardTitle>
              <CardDescription>用户最近的兴趣点记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>兴趣类型</TableHead>
                    <TableHead>兴趣度</TableHead>
                    <TableHead>来源</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>网站</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInterestData.map((interest) => (
                    <TableRow key={interest.id}>
                      <TableCell className="font-medium">{interest.user}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: interestColors[interest.type] }}>
                          {interestTranslations[interest.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${interest.level * 100}%` }}
                            />
                          </div>
                          <span>{(interest.level * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{sourceTranslations[interest.source]}</TableCell>
                      <TableCell>
                        {new Date(interest.timestamp).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>{interest.website}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 