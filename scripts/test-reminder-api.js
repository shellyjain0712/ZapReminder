// Test basic reminder creation and retrieval
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReminderAPI() {
  console.log('🧪 Testing Reminder API...');
  
  try {
    // Test 1: Check if we can connect to database
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test 2: Check if User table exists and has data
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test 3: Check if Reminder table exists
    const reminderCount = await prisma.reminder.count();
    console.log(`✅ Found ${reminderCount} reminders in database`);
    
    // Test 4: Try to find the current user
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'shellyjain0045@gmail.com'
      }
    });
    
    if (testUser) {
      console.log(`✅ Found test user: ${testUser.name || testUser.email}`);
      
      // Test 5: Try to get user's reminders
      const userReminders = await prisma.reminder.findMany({
        where: {
          userId: testUser.id
        },
        take: 5
      });
      
      console.log(`✅ User has ${userReminders.length} reminders`);
      
      if (userReminders.length > 0) {
        console.log('📝 Sample reminder:', {
          title: userReminders[0].title,
          dueDate: userReminders[0].dueDate,
          priority: userReminders[0].priority
        });
      }
    } else {
      console.log('⚠️  Test user not found');
    }
    
    console.log('\n🎉 Reminder API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Reminder API:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testReminderAPI();
