"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Trash2, Save, Edit } from "lucide-react";

// 知识库条目类型
interface KnowledgeItem {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

// 知识库配置类型
interface KnowledgeConfig {
  enabled: boolean;
  threshold: number;
}

export default function KnowledgeBasePage() {
  // 状态管理
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [config, setConfig] = useState<KnowledgeConfig>({
    enabled: true,
    threshold: 0.7
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    keywords: '',
    answer: ''
  });

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 加载知识库项目
        const itemsRes = await fetch('/api/knowledge');
        if (!itemsRes.ok) throw new Error('Failed to load knowledge base');
        const itemsData = await itemsRes.json();
        setItems(itemsData);

        // 加载知识库配置
        const configRes = await fetch('/api/knowledge/config');
        if (!configRes.ok) throw new Error('Failed to load knowledge base config');
        const configData = await configRes.json();
        setConfig(configData);

      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 处理表单变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 保存配置
  const saveConfig = async () => {
    try {
      const res = await fetch('/api/knowledge/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!res.ok) throw new Error('Failed to save config');
      alert('Configuration saved successfully');
    } catch (err) {
      setError('Failed to save configuration');
      console.error('Error saving config:', err);
    }
  };

  // 添加新项目
  const addItem = async () => {
    try {
      // 验证表单
      if (!formData.question || !formData.answer || !formData.keywords) {
        alert('Please fill in all fields');
        return;
      }

      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);

      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          answer: formData.answer,
          keywords
        })
      });

      if (!res.ok) throw new Error('Failed to add item');

      const newItem = await res.json();
      setItems(prev => [...prev, newItem]);

      // 重置表单
      setFormData({ question: '', keywords: '', answer: '' });

    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding item:', err);
    }
  };

  // 删除项目
  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });

      if (!res.ok) throw new Error('Failed to delete item');

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete item');
      console.error('Error deleting item:', err);
    }
  };

  // 开始编辑项目
  const startEditing = (item: KnowledgeItem) => {
    setEditingId(item.id);
    setFormData({
      question: item.question,
      keywords: item.keywords.join(', '),
      answer: item.answer
    });
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ question: '', keywords: '', answer: '' });
  };

  // 更新项目
  const updateItem = async () => {
    if (!editingId) return;

    try {
      // 验证表单
      if (!formData.question || !formData.answer || !formData.keywords) {
        alert('Please fill in all fields');
        return;
      }

      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);

      const res = await fetch(`/api/knowledge/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          answer: formData.answer,
          keywords
        })
      });

      if (!res.ok) throw new Error('Failed to update item');

      const updatedItem = await res.json();

      setItems(prev => prev.map(item =>
        item.id === editingId ? updatedItem : item
      ));

      cancelEditing();

    } catch (err) {
      setError('Failed to update item');
      console.error('Error updating item:', err);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">知识库管理</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：知识库配置 */}
        <Card>
          <CardHeader>
            <CardTitle>知识库配置</CardTitle>
            <CardDescription>调整知识库的行为</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="kb-enabled">启用知识库</Label>
              <Switch
                id="kb-enabled"
                checked={config.enabled}
                onCheckedChange={checked => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="threshold">匹配阈值: {config.threshold}</Label>
                <span className="text-sm text-muted-foreground">{(config.threshold * 100).toFixed(0)}%</span>
              </div>
              <input
                title="匹配阈值"
                id="threshold"
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={config.threshold}
                onChange={e => setConfig(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                值越高，匹配越精确，但可能错过相似问题
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveConfig} className="w-full">保存配置</Button>
          </CardFooter>
        </Card>

        {/* 中间：添加/编辑知识 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{editingId ? '编辑知识' : '添加新知识'}</CardTitle>
            <CardDescription>
              {editingId ? '修改现有知识条目' : '向知识库添加新的问答对'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">问题</Label>
              <Input
                id="question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                placeholder="输入用户可能提问的问题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">关键词（用逗号分隔）</Label>
              <Input
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                placeholder="关键词1, 关键词2, 关键词3"
              />
              <p className="text-xs text-muted-foreground">
                添加关键词以提高匹配精度。多个关键词用逗号分隔。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">回答</Label>
              <Textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                placeholder="输入对应的回答"
                rows={5}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {editingId ? (
              <>
                <Button variant="outline" onClick={cancelEditing}>取消</Button>
                <Button onClick={updateItem}>
                  <Save className="h-4 w-4 mr-2" /> 更新知识
                </Button>
              </>
            ) : (
              <Button onClick={addItem} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" /> 添加知识
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* 知识库列表 */}
      <h2 className="text-xl font-bold mt-10 mb-4">知识库条目</h2>
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            知识库为空。添加一些问答对以开始使用。
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg">{item.question}</CardTitle>
                <CardDescription>
                  关键词: {item.keywords.join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="line-clamp-4">{item.answer}</p>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/30 p-2">
                <Button variant="ghost" size="sm" onClick={() => startEditing(item)}>
                  <Edit className="h-4 w-4 mr-1" /> 编辑
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> 删除
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 