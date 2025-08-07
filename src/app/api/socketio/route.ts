import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Socket.io server instance
let io: SocketIOServer | undefined;

export async function GET(req: Request) {
  if (io) return new Response("Socket.IO server already running");

  // Get the raw HTTP server
  const httpServer = new NetServer();

  // Initialize Socket.IO server
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Client joining a chat room (session)
    socket.on('join', (data) => {
      const { chatSessionId, role } = data;
      console.log(`${role} joined chat session: ${chatSessionId}`);

      // Join the room with the chatSessionId
      socket.join(chatSessionId);

      // Notify others in the room
      socket.to(chatSessionId).emit('user_joined', {
        role,
        message: role === 'admin' ? '客服人员已接入' : '访客已连接'
      });
    });

    // Handle chat messages
    socket.on('chat_message', async (data) => {
      try {
        const { chatSessionId, content, role, sessionId } = data;
        console.log(`Message from ${role} in session ${chatSessionId}: ${content}`);

        // Find chat session by sessionId
        let chatSession = await prisma.chatSession.findFirst({
          where: {
            sessionId: sessionId
          }
        });

        if (!chatSession) {
          socket.emit('error', { message: 'Chat session not found' });
          return;
        }

        // Save message to database
        const savedMessage = await prisma.chatMessage.create({
          data: {
            chatSessionId: chatSession.id,
            content: content,
            role: role === 'admin' ? 'assistant' : 'user',
            createdAt: new Date()
          }
        });

        // Update chat session
        await prisma.chatSession.update({
          where: { id: chatSession.id },
          data: {
            lastActiveAt: new Date(),
            isRead: role === 'admin' // Mark as read if admin sends a message
          }
        });

        // Broadcast message to everyone in the room including sender
        io?.to(chatSessionId).emit('chat_message', {
          id: savedMessage.id,
          content: savedMessage.content,
          role: savedMessage.role,
          createdAt: savedMessage.createdAt.toISOString()
        });

      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { chatSessionId, isTyping, role } = data;
      socket.to(chatSessionId).emit('typing', { isTyping, role });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('A client disconnected:', socket.id);
    });
  });

  // Start listening on a port
  httpServer.listen(3001, () => {
    console.log('Socket.IO server running on port 3001');
  });

  return new Response("Socket.IO server started");
}

export const runtime = 'nodejs'; 