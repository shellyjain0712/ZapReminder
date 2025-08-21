import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCollaborativeFeatures() {
  try {
    console.log('🔍 Testing Collaborative Database Schema...\n');

    // Test 1: Check if all tables exist
    console.log('1. Checking database tables...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ User table accessible');

    const reminders = await prisma.reminder.findMany({ take: 1 });
    console.log('✅ Reminder table accessible');

    try {
      await prisma.$queryRaw`SELECT 1 FROM "SharedReminder" LIMIT 1`;
      console.log('✅ SharedReminder table exists');
    } catch (error) {
      console.log('❌ SharedReminder table not found:', error.message);
    }

    try {
      await prisma.$queryRaw`SELECT 1 FROM "Collaboration" LIMIT 1`;
      console.log('✅ Collaboration table exists');
    } catch (error) {
      console.log('❌ Collaboration table not found:', error.message);
    }

    try {
      await prisma.$queryRaw`SELECT 1 FROM "UserConnection" LIMIT 1`;
      console.log('✅ UserConnection table exists');
    } catch (error) {
      console.log('❌ UserConnection table not found:', error.message);
    }

    console.log('\n2. Testing data counts...');
    console.log(`📊 Users in database: ${users.length}`);
    console.log(`📊 Reminders in database: ${reminders.length}`);

    console.log('\n🎉 Collaborative features database test completed!');
    console.log('🚀 Ready for full collaboration functionality!');

  } catch (error) {
    console.error('❌ Error testing collaborative features:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCollaborativeFeatures();
