import { PrismaClient } from '@prisma/client';

// 避免在开发环境中创建多个Prisma Client实例
declare global {
  var prisma: PrismaClient | undefined;
}

// 使用全局变量以避免热重载时创建多个实例
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma; 