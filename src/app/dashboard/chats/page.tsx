"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Search, RefreshCw, Filter, HeadphonesIcon, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";

// 时间格式化辅助函数
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  }
};

// 聊天会话类型
interface ChatSession {
  id: string;
  visitorId: string;
  startedAt: string;
  lastActiveAt: string;
  websiteId: string;
  websiteName: string;
  websiteDomain: string;
  lastMessage: string;
  messageCount: number;
  isRead: boolean;
  needsHumanSupport?: boolean;
  supportRequestedAt?: string;
  lastPageUrl?: string;
}

export default function ChatsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();
  const PAGE_SIZE = 10;

  // Socket.IO 连接和监听
  useEffect(() => {
    // 创建 Socket.IO 连接
    const newSocket = io(`${window.location.origin.replace(/:\d+$/, '')}:3001`);

    newSocket.on('connect', () => {
      console.log('Socket connected to dashboard:', newSocket.id);
      // 订阅管理员频道
      newSocket.emit('join_admin_channel');
    });

    // 监听新的客服请求
    newSocket.on('new_customer_service_request', (data) => {
      console.log('New customer service request:', data);
      // 显示通知
      toast.info(
        <div onClick={() => router.push(`/dashboard/chats/${data.chatSessionId}`)}>
          <div className="font-bold">新的客服请求</div>
          <div>访客 {data.visitorId || '匿名'} 请求人工客服</div>
        </div>,
        {
          duration: 10000, // 10秒
          action: {
            label: "查看",
            onClick: () => router.push(`/dashboard/chats/${data.chatSessionId}`)
          },
        }
      );

      // 刷新会话列表
      fetchChatSessions();

      // 增加新请求计数（如果不在客服请求标签页）
      if (activeTab !== 'support') {
        setNewRequestCount(prev => prev + 1);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected from dashboard');
    });

    setSocket(newSocket);

    // 组件卸载时清理
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 获取网站列表用于筛选
  const fetchWebsites = async () => {
    try {
      const response = await fetch("/api/websites");
      if (response.ok) {
        const data = await response.json();
        setWebsites(data);
      }
    } catch (error) {
      console.error("Error fetching websites:", error);
    }
  };

  // 获取聊天会话
  const fetchChatSessions = async () => {
    try {
      setIsLoading(true);

      let url = `/api/chats?offset=${(currentPage - 1) * PAGE_SIZE}&limit=${PAGE_SIZE}`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      if (websiteFilter) {
        url += `&websiteId=${websiteFilter}`;
      }

      if (statusFilter) {
        url += `&isRead=${statusFilter === "read"}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch chat sessions");
      }

      const data = await response.json();
      setChatSessions(data.items);
      setTotalSessions(data.total);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理页面变更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理聊天点击
  const handleChatClick = (chatId: string) => {
    router.push(`/dashboard/chats/${chatId}`);
  };

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    fetchChatSessions();
  };

  // 重置过滤器
  const resetFilters = () => {
    setSearchTerm("");
    setWebsiteFilter(null);
    setStatusFilter(null);
    setCurrentPage(1);
  };

  // 处理标签切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // 如果切换到客服请求标签，重置新请求计数
    if (value === 'support') {
      setNewRequestCount(0);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchWebsites();
    fetchChatSessions();

    // 设置定期刷新
    const refreshInterval = setInterval(() => {
      fetchChatSessions();
    }, 30000); // 每30秒自动刷新一次

    return () => clearInterval(refreshInterval);
  }, []);

  // 页面或过滤器变更时重新加载
  useEffect(() => {
    fetchChatSessions();
  }, [currentPage, websiteFilter, statusFilter]);

  // 生成分页组件
  const renderPagination = () => {
    const totalPages = Math.ceil(totalSessions / PAGE_SIZE);
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxButtons = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-4 gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </Button>

        {startPage > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(1)}>1</Button>
            {startPage > 2 && <span className="px-2 flex items-center">...</span>}
          </>
        )}

        {pageNumbers.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 flex items-center">...</span>}
            <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)}>{totalPages}</Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一页
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">用户聊天</h1>
        <Button onClick={() => fetchChatSessions()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>聊天会话</CardTitle>
        </CardHeader>

        <CardContent>
          {/* 搜索和过滤器 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索访客ID或聊天内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={websiteFilter || "all"} onValueChange={(value) => setWebsiteFilter(value === "all" ? null : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="所有网站" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有网站</SelectItem>
                  {websites.map(website => (
                    <SelectItem key={website.id} value={website.id}>
                      {website.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="所有状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="read">已读</SelectItem>
                  <SelectItem value="unread">未读</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={resetFilters}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 标签页：全部/未读 */}
          <Tabs defaultValue="all" className="mb-4" value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="unread">未读</TabsTrigger>
              <TabsTrigger value="support" className="relative">
                <HeadphonesIcon className="h-4 w-4 mr-1" />
                客服请求
                {newRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newRequestCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {/* 聊天会话列表 */}
              {renderChatSessionsList()}
            </TabsContent>
            <TabsContent value="unread">
              {/* 未读聊天会话列表 */}
              {renderChatSessionsList(true)}
            </TabsContent>
            <TabsContent value="support">
              {/* 需要客服支持的聊天会话列表 */}
              {renderChatSessionsList(false, true)}
            </TabsContent>
          </Tabs>

          {/* 分页 */}
          {renderPagination()}
        </CardContent>
      </Card>
    </div>
  );

  // 渲染聊天会话列表
  function renderChatSessionsList(unreadOnly = false, supportOnly = false) {
    const filteredSessions = chatSessions.filter(session => {
      if (unreadOnly && supportOnly) {
        return !session.isRead && session.needsHumanSupport;
      }
      if (unreadOnly) {
        return !session.isRead;
      }
      if (supportOnly) {
        return session.needsHumanSupport;
      }
      return true;
    });

    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-40"></div>
                </div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredSessions.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">暂无聊天会话</h3>
          <p className="text-muted-foreground">
            {unreadOnly ? '没有未读的聊天会话' : '当前没有任何聊天会话记录'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className="flex items-center justify-between p-3 border rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
            onClick={() => handleChatClick(session.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${!session.isRead ? 'bg-blue-500' : session.needsHumanSupport ? 'bg-red-500' : 'bg-gray-400'}`}>
                {session.visitorId ? session.visitorId.substring(0, 1).toUpperCase() : '?'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {session.visitorId ? `访客 ${session.visitorId.substring(0, 6)}` : '匿名访客'}
                  </p>
                  {!session.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                  {session.needsHumanSupport && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                      <HeadphonesIcon className="h-3 w-3 mr-1" />
                      需要客服
                    </span>
                  )}
                </div>
                <div className="flex text-xs text-muted-foreground">
                  <span className="mr-2">{session.websiteName}</span>
                  <span>·</span>
                  <span className="ml-2">{formatTimeAgo(new Date(session.lastActiveAt))}</span>
                  {session.supportRequestedAt && (
                    <>
                      <span>·</span>
                      <span className="ml-2 text-red-500">
                        请求时间: {formatTimeAgo(new Date(session.supportRequestedAt))}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1 max-w-[300px]">
                  {session.lastMessage || "无消息内容"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">查看</Button>
          </div>
        ))}
      </div>
    );
  }
} 