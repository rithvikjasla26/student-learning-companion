import { PrismaClient } from '@prisma/client';
import app from '../../app.js';

// Shared Prisma client for tests
export const prismaTest = new PrismaClient();

// Test helper to clean up database after each test
export async function cleanupDatabase() {
  try {
    // Delete test data in correct order (respecting foreign keys)
    await prismaTest.studentBadge.deleteMany({});
    await prismaTest.badge.deleteMany({});
    await prismaTest.checkInSession.deleteMany({});
    await prismaTest.widgetResponse.deleteMany({});
    await prismaTest.studentTopicProgress.deleteMany({});
    await prismaTest.topic.deleteMany({});
    await prismaTest.studentStats.deleteMany({});
    await prismaTest.student.deleteMany({});
    await prismaTest.parent.deleteMany({});
    await prismaTest.user.deleteMany({});
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

export { app };
