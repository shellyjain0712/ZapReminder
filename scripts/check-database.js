// Check database content and try to create a test user
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database content...\n');
  
  try {
    await prisma.$connect();
    
    // Check all tables
    console.log('📊 Table Statistics:');
    const userCount = await prisma.user.count();
    const reminderCount = await prisma.reminder.count();
    
    console.log(`- Users: ${userCount}`);
    console.log(`- Reminders: ${reminderCount}`);
    
    try {
      const sharedReminderCount = await prisma.sharedReminder.count();
      console.log(`- SharedReminders: ${sharedReminderCount}`);
    } catch (e) {
      console.log('- SharedReminders: Table may not exist yet');
    }
    
    try {
      const collaborationCount = await prisma.collaboration.count();
      console.log(`- Collaborations: ${collaborationCount}`);
    } catch (e) {
      console.log('- Collaborations: Table may not exist yet');
    }
    
    // If no users, let's check if we can find any existing data
    if (userCount === 0) {
      console.log('\n🔍 No users found. Checking if there are any accounts...');
      
      const accountCount = await prisma.account.count();
      const sessionCount = await prisma.session.count();
      
      console.log(`- Accounts: ${accountCount}`);
      console.log(`- Sessions: ${sessionCount}`);
      
      // Try to create a test user manually
      console.log('\n👤 Creating test user...');
      
      const testUser = await prisma.user.create({
        data: {
          email: 'shellyjain0045@gmail.com',
          name: 'Shelly Jain',
          emailVerified: new Date(),
        }
      });
      
      console.log(`✅ Created test user: ${testUser.name} (${testUser.email})`);
      
      // Create a test reminder
      console.log('\n📝 Creating test reminder...');
      
      const testReminder = await prisma.reminder.create({
        data: {
          title: 'Test Reminder',
          description: 'This is a test reminder to verify the API works',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          priority: 'MEDIUM',
          category: 'Test',
          userId: testUser.id,
        }
      });
      
      console.log(`✅ Created test reminder: ${testReminder.title}`);
      
    } else {
      console.log('\n👥 Existing users found:');
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              reminders: true
            }
          }
        }
      });
      
      users.forEach(user => {
        console.log(`- ${user.name || 'No name'} (${user.email}) - ${user._count.reminders} reminders`);
      });
    }
    
    console.log('\n🎉 Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
