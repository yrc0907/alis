# DeepSeek AI 聊天机器人设置指南

本指南将帮助您设置 DeepSeek AI 聊天机器人。

## 1. 获取 DeepSeek API 密钥

1. 访问 [DeepSeek 官网](https://deepseek.com)
2. 注册/登录您的账户
3. 在个人设置或 API 管理页面获取您的 API 密钥

## 2. 设置环境变量

在项目根目录创建一个`.env.local`文件，并添加以下内容：

```
# DeepSeek AI API配置
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=2000
DEEPSEEK_TEMPERATURE=0.7
```

将`your_api_key_here`替换为您在第一步中获取的实际 API 密钥。

## 3. 环境变量说明

- `DEEPSEEK_API_KEY`: 您的 DeepSeek API 密钥
- `DEEPSEEK_MODEL`: 使用的 AI 模型（默认为"deepseek-chat"）
- `DEEPSEEK_MAX_TOKENS`: 每次响应生成的最大令牌数（默认 2000）
- `DEEPSEEK_TEMPERATURE`: 生成文本的随机性（0.7 为平衡值，越低越确定性，越高越创意）

## 4. 重启应用

设置环境变量后，重启应用以使更改生效：

```bash
npm run dev
# 或
pnpm dev
```

## 故障排除

如果您在设置过程中遇到问题，请检查：

1. API 密钥是否正确设置
2. 网络连接是否正常
3. 日志中是否有错误信息

如需更多帮助，请联系技术支持。
