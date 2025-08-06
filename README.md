# ALIS 聊天机器人平台

ALIS 是一个功能强大的聊天机器人平台，支持多网站管理、AI 聊天、自定义知识库、用户预约和兴趣分析功能。

## 功能特点

- 多网站管理：每个用户可以创建多个网站并独立配置
- 智能聊天机器人：基于 DeepSeek AI 实现智能对话
- 自定义知识库：为特定问题配置专业答案
- 用户预约系统：允许访客通过聊天机器人预约咨询
- 兴趣分析：自动识别用户意向并提供数据分析
- 简单嵌入：一段代码即可在任何网站上集成聊天机器人

## 环境配置

在项目根目录创建一个`.env.local`文件，并添加以下配置：

```
# DeepSeek AI配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TEMPERATURE=0.7

# 其他配置
AUTH_SECRET=your_auth_secret_here
```

请确保替换`your_deepseek_api_key_here`为你的实际 DeepSeek API 密钥。

## 快速开始

1. 安装依赖：

```bash
pnpm install
```

2. 创建数据库迁移：

```bash
npx prisma migrate dev
```

3. 启动开发服务器：

```bash
pnpm run dev
```

4. 打开浏览器访问：<http://localhost:3000>

## 嵌入聊天机器人

要在你的网站上嵌入聊天机器人，添加以下代码：

```html
<script
  src="https://your-alis-domain.com/chatbot-embed.js"
  data-name="AI助手"
  data-message="您好！有什么我能帮您的吗？"
  data-color="#fb923c"
  data-position="bottom-right"
  data-api-url="https://your-alis-domain.com/api/website-chatbot"
  data-website-id="你的网站ID"
  data-api-key="你的API密钥"
></script>
```

## 故障排除

如果聊天机器人无法正确响应，请检查：

1. DeepSeek API 密钥是否正确配置在`.env.local`文件中
2. 网站 ID 和 API 密钥是否正确
3. API 端点 URL 是否正确（需要完整 URL）
4. 网络请求控制台是否有 CORS 或其他错误

## 开发者文档

更多详细信息和 API 文档，请参阅`docs/`目录。
