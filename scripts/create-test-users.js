// Create test users for sharing functionality
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('👥 Creating test users for sharing...');
  
  try {
    await prisma.$connect();
    
    // Check if our main user exists
    const mainUser = await prisma.user.findUnique({
      where: { email: 'shellyjain0045@gmail.com' }
    });
    
    if (mainUser) {
      console.log(`✅ Main user exists: ${mainUser.name ?? mainUser.email}`);
    } else {
      console.log('❌ Main user not found');
      return;
    }
    
    // Create a second test user for sharing
    const testUserEmail = 'testuser@example.com';
    
    let testUser = await prisma.user.findUnique({
      where: { email: testUserEmail }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Test User',
          emailVerified: new Date(),
        }
      });
      console.log(`✅ Created test user: ${testUser.name} (${testUser.email})`);
    } else {
      console.log(`✅ Test user already exists: ${testUser.name ?? testUser.email}`);
    }
    
    // Create another test user
    const testUser2Email = 'colleague@example.com';
    
    let testUser2 = await prisma.user.findUnique({
      where: { email: testUser2Email }
    });
    
    if (!testUser2) {
      testUser2 = await prisma.user.create({
        data: {
          email: testUser2Email,
          name: 'Colleague',
          emailVerified: new Date(),
        }
      });
      console.log(`✅ Created test user 2: ${testUser2.name} (${testUser2.email})`);
    } else {
      console.log(`✅ Test user 2 already exists: ${testUser2.name ?? testUser2.email}`);
    }
    
    // Check user count
    const userCount = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${userCount}`);
    
    console.log('\n🎯 You can now test sharing with these emails:');
    console.log(`- ${testUserEmail}`);
    console.log(`- ${testUser2Email}`);
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
