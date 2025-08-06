"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Pencil, Trash2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// 知识库条目类型
interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  keywords: string;
  websiteId: string;
  createdAt: string;
  updatedAt: string;
}

// 知识库配置类型
interface KnowledgeConfig {
  id: string;
  enabled: boolean;
  threshold: number;
  websiteId: string;
}

interface KnowledgeBaseProps {
  websiteId: string;
}

export default function KnowledgeBase({ websiteId }: KnowledgeBaseProps) {
  // 知识库条目状态
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 知识库配置状态
  const [config, setConfig] = useState<KnowledgeConfig>({
    id: "",
    enabled: true,
    threshold: 0.7,
    websiteId: websiteId
  });

  // 对话框状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [newItem, setNewItem] = useState({
    question: "",
    answer: "",
    keywords: ""
  });

  // 获取知识库条目
  const fetchKnowledgeItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/websites/${websiteId}/knowledge`);

      if (!response.ok) {
        throw new Error("Failed to fetch knowledge items");
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching knowledge items:", error);
      setError("获取知识库条目失败");
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  // 获取知识库配置
  const fetchKnowledgeConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/config`);

      if (!response.ok) {
        if (response.status !== 404) {
          // 404表示配置不存在，使用默认配置
          throw new Error("Failed to fetch knowledge config");
        }
        return;
      }

      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching knowledge config:", error);
    }
  }, [websiteId]);

  // 更新知识库配置
  const updateConfig = async (newConfig: Partial<KnowledgeConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };

      const response = await fetch(`/api/websites/${websiteId}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedConfig)
      });

      if (!response.ok) {
        throw new Error("Failed to update config");
      }

      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error updating config:", error);
      alert("更新配置失败，请稍后再试");
    }
  };

  // 添加知识库条目
  const addKnowledgeItem = async () => {
    try {
      setError("");

      if (!newItem.question.trim() || !newItem.answer.trim()) {
        setError("问题和答案不能为空");
        return;
      }

      const response = await fetch(`/api/websites/${websiteId}/knowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) {
        throw new Error("Failed to add knowledge item");
      }

      const addedItem = await response.json();
      setItems([addedItem, ...items]);
      setNewItem({ question: "", answer: "", keywords: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding knowledge item:", error);
      setError("添加知识库条目失败");
    }
  };

  // 更新知识库条目
  const updateKnowledgeItem = async () => {
    try {
      setError("");

      if (!editingItem) return;

      if (!editingItem.question.trim() || !editingItem.answer.trim()) {
        setError("问题和答案不能为空");
        return;
      }

      const response = await fetch(`/api/websites/${websiteId}/knowledge/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: editingItem.question,
          answer: editingItem.answer,
          keywords: editingItem.keywords
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update knowledge item");
      }

      const updatedItem = await response.json();
      setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating knowledge item:", error);
      setError("更新知识库条目失败");
    }
  };

  // 删除知识库条目
  const deleteKnowledgeItem = async (id: string) => {
    if (!confirm("确定要删除此知识库条目吗？此操作无法撤销。")) {
      return;
    }

    try {
      const response = await fetch(`/api/websites/${websiteId}/knowledge/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete knowledge item");
      }

      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting knowledge item:", error);
      alert("删除知识库条目失败，请稍后再试");
    }
  };

  // 初始加载数据
  useEffect(() => {
    if (websiteId) {
      fetchKnowledgeItems();
      fetchKnowledgeConfig();
    }
  }, [websiteId, fetchKnowledgeItems, fetchKnowledgeConfig]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">知识库管理</h2>
          <p className="text-sm text-muted-foreground">
            定义特定问题的回答，帮助聊天机器人提供精确的信息
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          添加条目
        </Button>
      </div>

      {/* 知识库配置 */}
      <Card>
        <CardHeader>
          <CardTitle>知识库配置</CardTitle>
          <CardDescription>控制知识库的行为和匹配设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">启用知识库</h4>
              <p className="text-sm text-muted-foreground">
                启用后，聊天机器人会先尝试从知识库中查找答案
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig({ enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="threshold">相似度阈值: {config.threshold}</Label>
              <span className="text-sm text-muted-foreground">
                {config.threshold < 0.5 ? "低" : config.threshold > 0.8 ? "高" : "中"}
              </span>
            </div>
            <Input
              id="threshold"
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={config.threshold}
              onChange={(e) => updateConfig({ threshold: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              设置较高的阈值可以提高匹配精度，但可能会减少匹配次数
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 知识库条目列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse flex flex-col space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {editingItem?.id === item.id ? (
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`edit-question-${item.id}`}>问题</Label>
                    <Input
                      id={`edit-question-${item.id}`}
                      value={editingItem.question}
                      onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-answer-${item.id}`}>答案</Label>
                    <Textarea
                      id={`edit-answer-${item.id}`}
                      rows={4}
                      value={editingItem.answer}
                      onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-keywords-${item.id}`}>关键词（用逗号分隔）</Label>
                    <Input
                      id={`edit-keywords-${item.id}`}
                      value={editingItem.keywords}
                      onChange={(e) => setEditingItem({ ...editingItem, keywords: e.target.value })}
                      placeholder="关键词1,关键词2,关键词3"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={updateKnowledgeItem}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="font-medium">{item.question}</div>
                      <p className="text-sm">{item.answer}</p>
                      {item.keywords && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.keywords.split(",").map((keyword, i) => (
                            keyword.trim() && (
                              <span
                                key={i}
                                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                              >
                                {keyword.trim()}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKnowledgeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center">
            <h3 className="font-medium mb-2">暂无知识库条目</h3>
            <p className="text-sm text-muted-foreground mb-4">
              添加第一个知识库条目，帮助聊天机器人回答特定问题
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              添加条目
            </Button>
          </div>
        </Card>
      )}

      {/* 添加知识库条目对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加知识库条目</DialogTitle>
            <DialogDescription>
              创建一个新的知识库条目，当用户提出相似问题时将使用此回答。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="question">问题</Label>
              <Input
                id="question"
                placeholder="例如：公司的营业时间是什么？"
                value={newItem.question}
                onChange={(e) => setNewItem({ ...newItem, question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">答案</Label>
              <Textarea
                id="answer"
                placeholder="例如：我们的营业时间是周一至周五上午9点至下午6点，周末休息。"
                rows={4}
                value={newItem.answer}
                onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">关键词（用逗号分隔）</Label>
              <Input
                id="keywords"
                placeholder="例如：营业时间,开门,关门,几点"
                value={newItem.keywords}
                onChange={(e) => setNewItem({ ...newItem, keywords: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">关键词可以帮助更准确地匹配用户问题</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={addKnowledgeItem}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 