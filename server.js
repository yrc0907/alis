const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require("socket.io");
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*", // 在生产环境中，请务必将其限制为您的客户网站的域名
      methods: ["GET", "POST"]
    }
  });

  const adminSockets = new Set();

  io.on("connection", (socket) => {
    console.log('一个客户端已连接:', socket.id);

    socket.on('join_admin_channel', () => {
      console.log(`管理员 ${socket.id} 已加入管理员频道`);
      adminSockets.add(socket.id);
      socket.join('admin-channel');
    });

    socket.on('join', (data) => {
      const { chatSessionId, role } = data;
      console.log(`'${role}' ${socket.id} 已加入房间: ${chatSessionId}`);
      socket.join(chatSessionId);

      if (role === 'admin') {
        socket.to(chatSessionId).emit('user_joined', { role: 'admin', message: '客服人员已接入' });
      }
    });

    socket.on('customer_service_request', async (data) => {
      const { sessionId, reason, websiteId } = data;
      console.log(`收到来自 ${socket.id} 的客服请求, 会话ID: ${sessionId}`);

      try {
        const session = await prisma.chatSession.update({
          where: { sessionId: sessionId },
          data: {
            needsHumanSupport: true,
            isRead: false,
            supportRequestedAt: new Date()
          },
          include: { website: true }
        });

        if (session) {
          const notification = {
            chatSessionId: session.id,
            sessionId: session.sessionId,
            visitorId: session.visitorId,
            websiteName: session.website?.name || '未知网站',
            reason: reason,
            timestamp: new Date().toISOString()
          };

          io.to('admin-channel').emit('new_customer_service_request', notification);
          console.log('已向管理员发送客服请求通知');

          socket.emit('customer_service_requested', { success: true, message: '请求已发送' });
        } else {
          socket.emit('error', { message: '找不到会话' });
        }
      } catch (error) {
        console.error('处理客服请求时出错:', error);
        socket.emit('error', { message: '处理请求时发生服务器错误' });
      }
    });

    socket.on('chat_message', async (data) => {
      const { chatSessionId, content, role } = data;
      console.log(`收到来自 '${role}' 的消息，内容: "${content}"，房间: ${chatSessionId}`);

      const session = await prisma.chatSession.findUnique({
        where: { sessionId: chatSessionId },
      });

      if (session) {
        const message = await prisma.chatMessage.create({
          data: {
            chatSessionId: session.id,
            content: content,
            role: role === 'admin' ? 'assistant' : 'user',
          },
        });
        io.to(chatSessionId).emit('chat_message', message);
        console.log(`消息已广播到房间: ${chatSessionId}`);
      } else {
        console.log(`未找到会话: ${chatSessionId}`);
      }
    });

    socket.on('typing', (data) => {
      const { chatSessionId, isTyping, role } = data;
      socket.to(chatSessionId).emit('typing', { isTyping, role });
    });

    socket.on("disconnect", () => {
      console.log('客户端已断开连接:', socket.id);
      if (adminSockets.has(socket.id)) {
        adminSockets.delete(socket.id);
        console.log(`管理员 ${socket.id} 已离开管理员频道`);
      }
    });
  });

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`> 服务器已在 http://localhost:${PORT} 上准备就绪`);
  });
}); 