"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
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

// 定义预约对象类型
type Appointment = {
  id: string;
  name: string | null;
  email: string;
  phone: string;
  date: string;
  notes: string | null;
  subject: string | null;
  duration: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  isRead: boolean;
  website?: {
    name: string | null;
  };
};

// 新增：邮件通知的额外数据类型
type NotificationData = {
  reason?: string;
  newDateTime?: string;
};


// 定义预约状态
type AppointmentStatus = Appointment['status'];

// 预约状态标签颜色映射
const statusColors: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-green-500",
  CANCELLED: "bg-red-500",
  COMPLETED: "bg-blue-500"
};

// 预约状态中文翻译
const statusTranslations: Record<AppointmentStatus, string> = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  COMPLETED: "已完成"
};

// 新增：拒绝预约的子组件
function RejectAppointmentForm({ onCancel, onSubmit, isLoading }: { onCancel: () => void, onSubmit: (reason: string) => Promise<void>, isLoading: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <div className="mt-4">
      <h3 className="font-medium mb-2">拒绝理由 (可选)</h3>
      <textarea
        className="w-full p-2 border rounded-md"
        rows={3}
        placeholder="例如：时间冲突，需要更多信息等。"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>取消</Button>
        <Button variant="destructive" onClick={() => onSubmit(reason)} disabled={isLoading}>
          {isLoading ? "处理中..." : "确认拒绝"}
        </Button>
      </div>
    </div>
  );
}

// 新增：修改预约时间的子组件
function RescheduleAppointmentForm({ onCancel, onSubmit, currentDateTime, isLoading }: { onCancel: () => void, onSubmit: (newDateTime: string, reason: string) => Promise<void>, currentDateTime: string, isLoading: boolean }) {
  const [newDateTime, setNewDateTime] = useState(currentDateTime);
  const [reason, setReason] = useState('');
  return (
    <div className="mt-4">
      <h3 className="font-medium mb-2">修改预约时间</h3>
      <label htmlFor="datetime-input" className="sr-only">选择新的预约日期和时间</label>
      <input
        id="datetime-input"
        type="datetime-local"
        className="w-full p-2 border rounded-md mb-2"
        value={newDateTime}
        onChange={(e) => setNewDateTime(e.target.value)}
        disabled={isLoading}
      />
      <h3 className="font-medium mb-2">修改理由 (可选)</h3>
      <textarea
        className="w-full p-2 border rounded-md"
        rows={3}
        placeholder="例如：调整内部日程安排。"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>取消</Button>
        <Button onClick={() => onSubmit(newDateTime, reason)} disabled={isLoading}>
          {isLoading ? "修改中..." : "确认修改"}
        </Button>
      </div>
    </div>
  );
}


export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppointmentStatus | "all">("all");
  const [dialogView, setDialogView] = useState<'details' | 'reject' | 'reschedule'>('details');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // 获取预约数据
  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/appointments');
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        const data: Appointment[] = await response.json();
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
      } catch (error) {
        console.error('Failed to mark appointments as read:', error);
      }
    };
    markAllAsRead();
  }, []);

  // 打开预约详情对话框
  const openAppointmentDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogView('details');
    setIsDialogOpen(true);
    if (!appointment.isRead) {
      markAsRead(appointment.id);
    }
  };

  // 发送邮件的通用函数
  const sendEmailNotification = async (type: 'CONFIRMATION' | 'REJECTION' | 'RESCHEDULED', appointmentId: string, additionalData: NotificationData = {}) => {
    try {
      await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          type,
          ...additionalData,
        }),
      });
      console.log(`Email of type ${type} sent for appointment ${appointmentId}`);
    } catch (error) {
      console.error(`Failed to send email for appointment ${appointmentId}:`, error);
      // 在这里可以添加用户反馈，例如一个toast通知
      toast.error("邮件发送失败，请稍后再试。");
    }
  };

  // 更新预约状态
  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');

      const updatedAppointment = await response.json();
      setAppointments(prev =>
        prev.map(app => (app.id === id ? updatedAppointment : app))
      );
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(updatedAppointment);
      }

      // 如果是确认预约，发送确认邮件
      if (status === 'CONFIRMED') {
        await sendEmailNotification('CONFIRMATION', id);
      }
      toast.success("预约状态已成功更新！");
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error("状态更新失败，请检查网络连接。");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 标记为已读
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/appointments/${id}/read`, {
        method: 'POST',
      });
      setAppointments(prev =>
        prev.map(app => (app.id === id ? { ...app, isRead: true } : app))
      );
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(prev => prev ? { ...prev, isRead: true } : null);
      }
      toast.info("预约已标记为已读。");
    } catch (error) {
      console.error('Error marking appointment as read:', error);
      toast.error("操作失败，请稍后再试。");
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!selectedAppointment) return;
    setIsActionLoading(true);
    try {
      // 1. 更新状态为CANCELLED
      await updateAppointmentStatus(selectedAppointment.id, "CANCELLED");
      // 2. 发送拒绝邮件
      await sendEmailNotification('REJECTION', selectedAppointment.id, { reason });
      setIsDialogOpen(false);
      toast.success("预约已成功拒绝。");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (newDateTime: string, reason: string) => {
    if (!selectedAppointment) return;
    setIsActionLoading(true);
    try {
      // 1. 调用API更新预约时间
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDateTime }),
      });
      if (!response.ok) throw new Error('Failed to reschedule appointment');

      const updatedAppointment = await response.json();

      // 2. 更新本地状态
      setAppointments(prev =>
        prev.map(app => (app.id === selectedAppointment.id ? updatedAppointment : app))
      );

      // 3. 发送修改时间邮件
      await sendEmailNotification('RESCHEDULED', selectedAppointment.id, { newDateTime, reason });

      setIsDialogOpen(false);
      toast.success("预约时间已成功修改！");
    } catch (error) {
      console.error('Error in reschedule process:', error);
      toast.error("修改预约失败，请稍后再试。");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 根据标签过滤预约
  const filteredAppointments = activeTab === "all"
    ? appointments
    : appointments.filter(appointment => appointment.status === activeTab);

  // 对预约进行排序（未读在前，按日期降序）
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">预约管理</h1>
        <p className="text-muted-foreground mt-2">管理用户通过聊天机器人提交的所有预约请求</p>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as AppointmentStatus | "all")} className="w-full">
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
              {dialogView === 'details' && <DialogDescription>预约ID: {selectedAppointment.id}</DialogDescription>}
            </DialogHeader>

            {dialogView === 'details' && (
              <>
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
                  <Button variant="outline" onClick={() => setDialogView('reschedule')} disabled={isActionLoading}>修改时间</Button>
                  {selectedAppointment.status === "PENDING" && (
                    <>
                      <Button variant="destructive" onClick={() => setDialogView('reject')} disabled={isActionLoading}>拒绝</Button>
                      <Button onClick={() => updateAppointmentStatus(selectedAppointment.id, "CONFIRMED")} disabled={isActionLoading}>
                        {isActionLoading ? "处理中..." : "确认预约"}
                      </Button>
                    </>
                  )}
                  {selectedAppointment.status === "CONFIRMED" && (
                    <Button onClick={() => updateAppointmentStatus(selectedAppointment.id, "COMPLETED")} disabled={isActionLoading}>
                      {isActionLoading ? "处理中..." : "标记完成"}
                    </Button>
                  )}
                  {!selectedAppointment.isRead && (
                    <Button
                      variant="secondary"
                      onClick={() => markAsRead(selectedAppointment.id)}
                      className="w-full sm:w-auto"
                      disabled={isActionLoading}
                    >
                      标记为已读
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}

            {dialogView === 'reject' && (
              <RejectAppointmentForm
                onCancel={() => setDialogView('details')}
                onSubmit={handleRejectSubmit}
                isLoading={isActionLoading}
              />
            )}

            {dialogView === 'reschedule' && (
              <RescheduleAppointmentForm
                onCancel={() => setDialogView('details')}
                onSubmit={handleRescheduleSubmit}
                currentDateTime={new Date(selectedAppointment.date).toISOString().slice(0, 16)}
                isLoading={isActionLoading}
              />
            )}

          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 