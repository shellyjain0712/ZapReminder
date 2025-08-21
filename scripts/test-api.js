import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function testApiEndpoint() {
  try {
    console.log('🧪 Testing sharing API endpoint...');
    
    // Get a real reminder first
    const reminders = await db.reminder.findMany({
      take: 1,
      where: {
        userId: 'cmcwqmu1d0001gg8l3vy5t5ys' // Your user ID
      }
    });
    
    if (reminders.length === 0) {
      console.log('❌ No reminders found to test with');
      return;
    }
    
    const testReminder = reminders[0];
    console.log('📝 Found reminder to test:', testReminder.title);
    
    // Test the API call manually
    const response = await fetch('http://localhost:3000/api/reminders/collaborative/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=your-session-token' // This won't work without proper auth
      },
      body: JSON.stringify({
        reminderId: testReminder.id,
        recipientEmail: 'testuser@example.com',
        role: 'VIEWER',
        message: 'Test sharing'
      })
    });
    
    const result = await response.text();
    console.log('📊 API Response:', response.status, result);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testApiEndpoint();
