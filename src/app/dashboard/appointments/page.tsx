"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Mail, Phone, User, Calendar as CalendarIcon } from "lucide-react";

// 预约状态标签颜色映射
const statusColors = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-green-500",
  CANCELLED: "bg-red-500",
  COMPLETED: "bg-blue-500"
};

// 预约状态中文翻译
const statusTranslations = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  COMPLETED: "已完成"
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();

  // 获取预约数据
  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/appointments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // 当用户进入此页面时，将所有未读预约标记为已读
  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        await fetch('/api/appointments/mark-all-read', {
          method: 'POST',
        });
        console.log('All appointments marked as read.');
        // 这里可以触发一个事件或状态更新，来移除侧边栏的红点
        // 由于侧边栏是定时轮询的，红点会在下一次轮询时自动消失
      } catch (error) {
        console.error('Failed to mark appointments as read:', error);
      }
    };

    markAllAsRead();
  }, []); // 空依赖数组确保只在组件首次加载时运行

  // 打开预约详情对话框
  const openAppointmentDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  // 更新预约状态
  const updateAppointmentStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      // 更新本地状态
      setAppointments(prevAppointments =>
        prevAppointments.map(appointment =>
          appointment.id === id ? { ...appointment, status } : appointment
        )
      );

      // 更新选中的预约
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment({ ...selectedAppointment, status });
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  // 标记为已读
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`/api/appointments/${id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark appointment as read');
      }

      // 更新本地状态
      setAppointments(prevAppointments =>
        prevAppointments.map(appointment =>
          appointment.id === id ? { ...appointment, isRead: true } : appointment
        )
      );

      // 更新选中的预约
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment({ ...selectedAppointment, isRead: true });
      }
    } catch (error) {
      console.error('Error marking appointment as read:', error);
    }
  };

  // 根据标签过滤预约
  const filteredAppointments = activeTab === "all"
    ? appointments
    : appointments.filter(appointment => appointment.status === activeTab);

  // 对预约进行排序（未读在前，按日期降序）
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    // 首先按未读状态排序
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    // 然后按日期降序排序
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">预约管理</h1>
        <p className="text-muted-foreground mt-2">管理用户通过聊天机器人提交的所有预约请求</p>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">全部预约</TabsTrigger>
          <TabsTrigger value="PENDING">待确认</TabsTrigger>
          <TabsTrigger value="CONFIRMED">已确认</TabsTrigger>
          <TabsTrigger value="COMPLETED">已完成</TabsTrigger>
          <TabsTrigger value="CANCELLED">已取消</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>预约列表</CardTitle>
              <CardDescription>
                {activeTab === "all" ? "所有预约请求" : `${statusTranslations[activeTab]}的预约`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <span className="ml-2">加载中...</span>
                </div>
              ) : sortedAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">客户信息</TableHead>
                      <TableHead>预约时间</TableHead>
                      <TableHead>网站</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAppointments.map((appointment) => (
                      <TableRow key={appointment.id} className={!appointment.isRead ? "bg-muted/30" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {appointment.name || "匿名用户"}
                                {!appointment.isRead && (
                                  <span className="ml-2 h-2 w-2 rounded-full bg-primary inline-block"></span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{appointment.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(appointment.date).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.website?.name || "未知网站"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[appointment.status]}>
                            {statusTranslations[appointment.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openAppointmentDialog(appointment)}>
                            查看详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">暂无预约</h3>
                  <p className="text-sm text-muted-foreground">当前没有{activeTab === "all" ? "" : statusTranslations[activeTab] + "的"}预约请求</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 预约详情对话框 */}
      {selectedAppointment && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>预约详情</DialogTitle>
              <DialogDescription>
                预约ID: {selectedAppointment.id}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1 text-muted-foreground">客户姓名</div>
                <div className="col-span-3 font-medium">
                  {selectedAppointment.name || "匿名用户"}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1 text-muted-foreground">联系邮箱</div>
                <div className="col-span-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href={`mailto:${selectedAppointment.email}`} className="text-blue-600 hover:underline">
                    {selectedAppointment.email}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1 text-muted-foreground">联系电话</div>
                <div className="col-span-3 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${selectedAppointment.phone}`} className="text-blue-600 hover:underline">
                    {selectedAppointment.phone}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1 text-muted-foreground">预约时间</div>
                <div className="col-span-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(selectedAppointment.date).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {selectedAppointment.duration && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1 text-muted-foreground">预计时长</div>
                  <div className="col-span-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {selectedAppointment.duration} 分钟
                  </div>
                </div>
              )}
              {selectedAppointment.subject && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1 text-muted-foreground">预约主题</div>
                  <div className="col-span-3">{selectedAppointment.subject}</div>
                </div>
              )}
              {selectedAppointment.notes && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1 text-muted-foreground">备注信息</div>
                  <div className="col-span-3">{selectedAppointment.notes}</div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1 text-muted-foreground">当前状态</div>
                <div className="col-span-3">
                  <Badge className={statusColors[selectedAppointment.status]}>
                    {statusTranslations[selectedAppointment.status]}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-wrap sm:flex-nowrap gap-2">
              {selectedAppointment.status === "PENDING" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, "CANCELLED")}
                    className="w-full sm:w-auto"
                  >
                    拒绝预约
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, "CONFIRMED")}
                    className="w-full sm:w-auto"
                  >
                    确认预约
                  </Button>
                </>
              )}
              {selectedAppointment.status === "CONFIRMED" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, "CANCELLED")}
                    className="w-full sm:w-auto"
                  >
                    取消预约
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, "COMPLETED")}
                    className="w-full sm:w-auto"
                  >
                    标记完成
                  </Button>
                </>
              )}
              {!selectedAppointment.isRead && (
                <Button
                  variant="secondary"
                  onClick={() => markAsRead(selectedAppointment.id)}
                  className="w-full sm:w-auto"
                >
                  标记为已读
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 