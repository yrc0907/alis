import fs from 'fs';
import path from 'path';

// 知识库条目接口
export interface KnowledgeItem {
  id: string;
  keywords: string[];      // 用于匹配的关键词
  question: string;        // 原始问题
  answer: string;          // 预定义回答
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
}

// 知识库配置接口
export interface KnowledgeBaseConfig {
  enabled: boolean;        // 是否启用知识库
  threshold: number;       // 匹配阈值，越高越精确
}

// 知识库默认配置
const DEFAULT_CONFIG: KnowledgeBaseConfig = {
  enabled: true,
  threshold: 0.7
};

// 知识库数据路径
const DATA_DIR = path.join(process.cwd(), 'data');
const KNOWLEDGE_FILE = path.join(DATA_DIR, 'knowledge-base.json');
const CONFIG_FILE = path.join(DATA_DIR, 'knowledge-config.json');

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 加载知识库
export function loadKnowledgeBase(): KnowledgeItem[] {
  ensureDataDir();

  try {
    if (fs.existsSync(KNOWLEDGE_FILE)) {
      const data = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading knowledge base:', error);
  }

  // 如果文件不存在或加载失败，返回空数组并创建新文件
  saveKnowledgeBase([]);
  return [];
}

// 保存知识库
export function saveKnowledgeBase(items: KnowledgeItem[]) {
  ensureDataDir();
  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(items, null, 2));
}

// 加载知识库配置
export function loadKnowledgeConfig(): KnowledgeBaseConfig {
  ensureDataDir();

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading knowledge config:', error);
  }

  // 如果配置不存在，创建默认配置
  saveKnowledgeConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

// 保存知识库配置
export function saveKnowledgeConfig(config: KnowledgeBaseConfig) {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// 添加知识条目
export function addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeItem {
  const items = loadKnowledgeBase();
  const now = new Date().toISOString();

  const newItem: KnowledgeItem = {
    id: Date.now().toString(),
    ...item,
    createdAt: now,
    updatedAt: now
  };

  items.push(newItem);
  saveKnowledgeBase(items);
  return newItem;
}

// 更新知识条目
export function updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): KnowledgeItem | null {
  const items = loadKnowledgeBase();
  const index = items.findIndex(item => item.id === id);

  if (index === -1) return null;

  const updatedItem = {
    ...items[index],
    ...updates,
    id, // 确保ID不变
    updatedAt: new Date().toISOString()
  };

  items[index] = updatedItem;
  saveKnowledgeBase(items);
  return updatedItem;
}

// 删除知识条目
export function deleteKnowledgeItem(id: string): boolean {
  const items = loadKnowledgeBase();
  const initialLength = items.length;

  const newItems = items.filter(item => item.id !== id);

  if (newItems.length !== initialLength) {
    saveKnowledgeBase(newItems);
    return true;
  }

  return false;
}

// 简单的字符串相似度计算 (0-1范围，1为完全匹配)
function similarity(s1: string, s2: string): number {
  const longer = s1.length >= s2.length ? s1.toLowerCase() : s2.toLowerCase();
  const shorter = s1.length < s2.length ? s1.toLowerCase() : s2.toLowerCase();

  if (longer.length === 0) return 1.0;

  const matchCount = [...shorter].reduce((acc, char, i) =>
    acc + (longer.includes(char) ? 1 : 0), 0);

  return matchCount / longer.length;
}

// 查询知识库
export function queryKnowledgeBase(question: string): KnowledgeItem | null {
  const config = loadKnowledgeConfig();

  // 如果知识库功能被禁用，直接返回null
  if (!config.enabled) return null;

  const items = loadKnowledgeBase();
  let bestMatch: KnowledgeItem | null = null;
  let bestScore = 0;

  // 小写化并移除特殊字符以便更好地匹配
  const normalizedQuestion = question.toLowerCase().replace(/[^\w\s]/g, '');

  // 先检查关键词精确匹配
  for (const item of items) {
    for (const keyword of item.keywords) {
      if (normalizedQuestion.includes(keyword.toLowerCase())) {
        return item; // 精确匹配关键词，直接返回
      }
    }

    // 检查问题相似度
    const score = similarity(normalizedQuestion, item.question.toLowerCase().replace(/[^\w\s]/g, ''));
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // 如果相似度超过阈值，返回最佳匹配
  return bestScore >= config.threshold ? bestMatch : null;
} 