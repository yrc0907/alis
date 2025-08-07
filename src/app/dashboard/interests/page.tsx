"use client";

import { useState, useEffect, useMemo } from "react";
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

const interestColors = {
  PRODUCT: "#3b82f6",
  SERVICE: "#10b981",
  PRICING: "#f59e0b",
  CONTACT: "#8b5cf6",
  APPOINTMENT: "#ef4444",
  GENERAL: "#6b7280",
};

type InterestType = keyof typeof interestColors;

const interestTranslations: Record<InterestType, string> = {
  PRODUCT: "产品信息",
  SERVICE: "服务咨询",
  PRICING: "价格咨询",
  CONTACT: "联系方式",
  APPOINTMENT: "预约需求",
  GENERAL: "一般问题",
};

const sourceTranslations: Record<string, string> = {
  CHAT: "聊天对话",
  WEBSITE_VISIT: "网站访问",
  SEARCH: "搜索查询",
  REFERRAL: "推荐来源",
  DIRECT: "直接访问",
  APPOINTMENT: "预约提交"
};

interface RecentInterest {
  id: string;
  interestType: InterestType;
  interestLevel: number;
  source: string;
  createdAt: string;
  website: { name: string };
  chatSession?: { visitorId?: string };
}

interface InterestData {
  statistics: {
    totalInterests: number;
    uniqueVisitors: number;
    avgInterestLevel: number;
    conversionRate: number;
  };
  interestsByType: { type: InterestType; count: number }[];
  dailyInterests: { date: string; count: number; interestType: InterestType }[];
  interests: RecentInterest[];
}

export default function InterestsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [interestData, setInterestData] = useState<InterestData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const webResponse = await fetch('/api/websites');
        if (webResponse.ok) {
          const webData = await webResponse.json();
          setWebsites(webData);
        }

        const interestResponse = await fetch(`/api/user-interests?websiteId=${selectedWebsite}&period=${selectedTimeRange}`);
        if (interestResponse.ok) {
          const intData = await interestResponse.json();
          setInterestData(intData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedWebsite, selectedTimeRange]);

  const pieChartData = useMemo(() => {
    if (!interestData) return [];
    return interestData.interestsByType.map(item => ({
      name: interestTranslations[item.type] || item.type,
      value: item.count,
      color: interestColors[item.type] || '#ccc'
    }));
  }, [interestData]);

  const lineChartData = useMemo(() => {
    if (!interestData) return [];
    const transformed: { [date: string]: any } = {};
    interestData.dailyInterests.forEach(item => {
      const date = new Date(item.date).toLocaleDateString();
      if (!transformed[date]) {
        transformed[date] = { date };
      }
      const typeName = interestTranslations[item.interestType] || item.interestType;
      transformed[date][typeName] = (transformed[date][typeName] || 0) + item.count;
    });
    return Object.values(transformed);
  }, [interestData]);

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

      {isLoading ? <div className="text-center py-10">加载中...</div> :
        !interestData ? <div className="text-center py-10">无法加载数据。</div> :
          (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-medium">总兴趣点击</CardTitle>
                      <CardDescription>过去{selectedTimeRange}天</CardDescription>
                    </div>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{interestData.statistics.totalInterests}</div>
                    <p className="text-xs text-muted-foreground">在所有网站上</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-medium">有效转化率</CardTitle>
                      <CardDescription>预约兴趣占比</CardDescription>
                    </div>
                    <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(interestData.statistics.conversionRate * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">基于总兴趣数</p>
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
                    <div className="text-2xl font-bold">{interestData.statistics.uniqueVisitors}</div>
                    <p className="text-xs text-muted-foreground">唯一用户数</p>
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
                    <div className="text-2xl font-bold">{interestData.statistics.avgInterestLevel.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">范围 0-1</p>
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
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={130}
                                innerRadius={70}
                                fill="#8884d8"
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                              >
                                {pieChartData.map((entry, index) => (
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
                        <CardDescription>过去{selectedTimeRange}天各类型兴趣的变化趋势</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={lineChartData}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              {Object.keys(interestTranslations).map((type) => (
                                <Line key={type} type="monotone" dataKey={interestTranslations[type as InterestType]} stroke={interestColors[type as InterestType]} />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>每日兴趣量</CardTitle>
                        <CardDescription>过去{selectedTimeRange}天每日兴趣总量统计</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={lineChartData}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              {Object.keys(interestTranslations).map((type) => (
                                <Bar key={type} dataKey={interestTranslations[type as InterestType]} stackId="a" fill={interestColors[type as InterestType]} />
                              ))}
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
                          {interestData.interests.map((interest) => (
                            <TableRow key={interest.id}>
                              <TableCell className="font-medium">{interest.chatSession?.visitorId || '匿名访客'}</TableCell>
                              <TableCell>
                                <Badge style={{ backgroundColor: interestColors[interest.interestType] }}>
                                  {interestTranslations[interest.interestType]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${interest.interestLevel * 100}%` }}
                                    />
                                  </div>
                                  <span>{(interest.interestLevel * 100).toFixed(0)}%</span>
                                </div>
                              </TableCell>
                              <TableCell>{sourceTranslations[interest.source] ?? interest.source}</TableCell>
                              <TableCell>
                                {new Date(interest.createdAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>{interest.website.name}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
    </div>
  );
} 