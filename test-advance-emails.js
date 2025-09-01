import { PrismaClient } from '@prisma/client';
import { sendReminderNotification } from '../src/lib/notifications.js';

const prisma = new PrismaClient();

async function testAdvanceEmails() {
  console.log('🔧 Testing Advance Email Notifications...\n');
  
  try {
    // 1. Check if we have users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please sign up first.');
      return;
    }
    
    const user = users[0]; // Use first user for testing
    console.log(`Using user: ${user.email}\n`);
    
    // 2. Create a test reminder with advance notification
    const now = new Date();
    const reminderTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
    const notificationTime = new Date(now.getTime() + (2 * 60 * 1000)); // 2 minutes from now
    
    console.log(`Current time: ${now.toLocaleString()}`);
    console.log(`Reminder time: ${reminderTime.toLocaleString()}`);
    console.log(`Notification time: ${notificationTime.toLocaleString()}\n`);
    
    // Delete any existing test reminders
    await prisma.reminder.deleteMany({
      where: {
        title: 'TEST: Advance Email Notification'
      }
    });
    
    // Create new test reminder
    const testReminder = await prisma.reminder.create({
      data: {
        title: 'TEST: Advance Email Notification',
        description: 'This is a test reminder to verify advance email notifications work',
        dueDate: reminderTime,
        reminderTime: reminderTime,
        notificationTime: notificationTime,
        priority: 'HIGH',
        emailNotification: true,
        pushNotification: false,
        isCompleted: false,
        userId: user.id,
        category: 'Test'
      }
    });
    
    console.log(`✅ Created test reminder: ${testReminder.id}`);
    console.log(`   Title: ${testReminder.title}`);
    console.log(`   Due Date: ${testReminder.dueDate.toLocaleString()}`);
    console.log(`   Reminder Time: ${testReminder.reminderTime?.toLocaleString()}`);
    console.log(`   Notification Time: ${testReminder.notificationTime?.toLocaleString()}\n`);
    
    // 3. Test sending advance notification manually
    console.log('📧 Sending test advance notification email...');
    
    const emailResult = await sendReminderNotification({
      type: 'reminder-due-soon',
      reminderTitle: testReminder.title,
      userEmail: user.email,
      userName: user.name || undefined,
      dueDate: testReminder.dueDate,
      reminderTime: testReminder.reminderTime || testReminder.dueDate,
      description: testReminder.description || undefined,
      priority: testReminder.priority,
      hoursUntilDue: 2
    });
    
    console.log('📧 Email sending result:', emailResult);
    
    // 4. Test the worker logic
    console.log('\n🔄 Testing worker notification logic...');
    
    const timeDiff = Math.abs(notificationTime.getTime() - now.getTime());
    const shouldSend = timeDiff <= 60000; // Within 1 minute
    
    console.log(`Time difference: ${timeDiff}ms`);
    console.log(`Should send notification: ${shouldSend}`);
    
    if (!shouldSend) {
      console.log('⚠️  Notification time is not within 1 minute of current time');
      console.log('   The worker will only send emails when current time is within 1 minute of notification time');
    }
    
    console.log('\n✅ Test completed! Check your email for the advance notification.');
    console.log('\n📋 Next steps:');
    console.log('1. Wait until the notification time to test automatic sending');
    console.log('2. Or use the /test-reminders API endpoint to trigger the worker');
    console.log('3. Check server logs for detailed processing information');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdvanceEmails();
