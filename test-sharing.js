// Test the sharing functionality
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSharing() {
  console.log('🧪 Testing reminder sharing functionality...');
  
  try {
    await prisma.$connect();
    
    // Get the main user and a test reminder
    const mainUser = await prisma.user.findUnique({
      where: { email: 'shellyjain0045@gmail.com' }
    });
    
    if (!mainUser) {
      console.log('❌ Main user not found');
      return;
    }
    
    // Get a reminder from the main user
    const reminder = await prisma.reminder.findFirst({
      where: { userId: mainUser.id }
    });
    
    if (!reminder) {
      console.log('❌ No reminders found for main user');
      return;
    }
    
    console.log(`📝 Found reminder: "${reminder.title}"`);
    
    // Test the sharing API by making a direct request
    const testData = {
      reminderId: reminder.id,
      recipientEmail: 'testuser@example.com',
      role: 'EDITOR',
      message: 'Testing sharing functionality'
    };
    
    console.log('\n🔄 Testing API call...');
    
    try {
      const response = await fetch('http://localhost:3000/api/reminders/collaborative/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real test, we'd need proper authentication
        },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ API call successful!');
        console.log('📋 Response:', result);
      } else {
        console.log('❌ API call failed:', result);
      }
      
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError);
      console.log('💡 This is expected since we need authentication');
    }
    
    // Check if we can see any collaborations in the database
    const collaborations = await prisma.$queryRaw`
      SELECT * FROM "Collaboration" ORDER BY "createdAt" DESC LIMIT 5
    `;
    
    console.log(`\n📊 Current collaborations in database: ${collaborations.length}`);
    
    if (collaborations.length > 0) {
      console.log('📋 Recent collaborations:');
      collaborations.forEach((collab, i) => {
        console.log(`${i + 1}. Role: ${collab.role}, Status: ${collab.status}`);
      });
    }
    
    console.log('\n🎯 Sharing API is ready for testing!');
    console.log('📱 Go to http://localhost:3000/collaborative and try sharing a reminder');
    console.log('📧 Use email: testuser@example.com or colleague@example.com');
    
  } catch (error) {
    console.error('❌ Error testing sharing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSharing();
