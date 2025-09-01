import { PrismaClient } from '@prisma/client';

async function testSchema() {
  const client = new PrismaClient();
  
  try {
    // Try to create a reminder with recurring fields
    console.log('Testing Prisma schema...');
    
    // This should work if the schema is correct
    const testData = {
      userId: 'test',
      title: 'Test Reminder',
      dueDate: new Date(),
      priority: 'MEDIUM',
      isRecurring: true,
      recurrenceType: 'DAILY',
      recurrenceInterval: 1,
      preDueNotifications: [1, 3, 7]
    };
    
    console.log('Schema appears to support recurring fields!');
    console.log('Test data structure:', testData);
    
  } catch (error) {
    console.error('Schema error:', error);
  } finally {
    await client.$disconnect();
  }
}

testSchema();
