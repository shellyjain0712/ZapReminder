// Simple check for collaborative tables
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTables() {
  console.log('🔍 Checking collaborative tables...');
  
  try {
    await prisma.$connect();
    
    // Check and create tables if needed
    console.log('Creating tables with raw SQL...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Collaboration" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "reminderId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "receiverId" TEXT NOT NULL,
        type TEXT DEFAULT 'SHARE',
        status TEXT DEFAULT 'PENDING',
        role TEXT DEFAULT 'VIEWER',
        message TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('✅ Collaboration table ready');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SharedReminder" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "reminderId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        role TEXT DEFAULT 'VIEWER',
        "canEdit" BOOLEAN DEFAULT false,
        "canComplete" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('✅ SharedReminder table ready');
    
    await prisma.$executeRaw`
      ALTER TABLE "Reminder" 
      ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN DEFAULT false
    `;
    
    console.log('✅ isShared column added to Reminder table');
    
    // Test the tables
    const collabCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Collaboration"`;
    const sharedCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "SharedReminder"`;
    
    console.log(`📊 Collaboration records: ${collabCount[0].count}`);
    console.log(`📊 SharedReminder records: ${sharedCount[0].count}`);
    
    console.log('\n🎉 All tables ready for sharing!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTables();
