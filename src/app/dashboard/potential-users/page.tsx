"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PotentialUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  interestType: string;
  interestLevel: number;
  source: string;
  createdAt: string;
  websiteName: string;
}

export default function PotentialUsersPage() {
  const [users, setUsers] = useState<PotentialUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PotentialUser | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchPotentialUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/potential-users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error("Failed to fetch potential users");
        }
      } catch (error) {
        console.error("Error fetching potential users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPotentialUsers();
  }, []);

  const handleOpenEmailDialog = (user: PotentialUser) => {
    setSelectedUser(user);
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedUser) return;
    setIsSending(true);
    try {
      const response = await fetch('/api/emails/send-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: emailSubject,
          body: emailBody,
        }),
      });

      if (response.ok) {
        // Here you might want to show a success toast/notification
        console.log("Email sent successfully!");
        setIsEmailDialogOpen(false);
        setEmailSubject("");
        setEmailBody("");
      } else {
        // Here you might want to show an error toast/notification
        console.error("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">潜在用户</h1>
        <Card>
          <CardHeader>
            <CardTitle>对您的产品或服务感兴趣的用户</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>兴趣来源</TableHead>
                  <TableHead>兴趣类型</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">加载中...</TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">暂无潜在用户</TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name || '匿名'}</TableCell>
                      <TableCell>
                        <div>{user.email}</div>
                        <div>{user.phone || '未提供'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{user.interestType}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleOpenEmailDialog(user)}>
                          发送邮件
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发送邮件给 {selectedUser?.name || selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">主题</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="邮件主题"
              />
            </div>
            <div>
              <Label htmlFor="body">内容</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="邮件内容..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)} disabled={isSending}>
              取消
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? "发送中..." : "发送"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 