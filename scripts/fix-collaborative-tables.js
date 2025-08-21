// @ts-nocheck
// Test if collaborative tables exist and create them if needed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCollaborativeTables() {
  console.log('🔍 Checking collaborative tables...\n');
  
  try {
    await prisma.$connect();
    
    // Test if tables exist by trying to query them
    console.log('Testing table existence:');
    
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "SharedReminder" LIMIT 1`;
      console.log('✅ SharedReminder table exists');
    } catch (error) {
      console.log('❌ SharedReminder table missing:', error.message);
      
      // Try to create the table
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "SharedReminder" (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "reminderId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            role TEXT DEFAULT 'VIEWER',
            "canEdit" BOOLEAN DEFAULT false,
            "canComplete" BOOLEAN DEFAULT false,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY ("reminderId") REFERENCES "Reminder"(id) ON DELETE CASCADE,
            FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
          )
        `;
        console.log('✅ Created SharedReminder table');
      } catch (createError) {
        console.log('❌ Failed to create SharedReminder table:', createError);
      }
    }
    
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Collaboration" LIMIT 1`;
      console.log('✅ Collaboration table exists');
    } catch (error: any) {
      console.log('❌ Collaboration table missing:', error.message);
      
      // Try to create the table
      try {
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
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY ("reminderId") REFERENCES "Reminder"(id) ON DELETE CASCADE,
            FOREIGN KEY ("senderId") REFERENCES "User"(id) ON DELETE CASCADE,
            FOREIGN KEY ("receiverId") REFERENCES "User"(id) ON DELETE CASCADE
          )
        `;
        console.log('✅ Created Collaboration table');
      } catch (createError) {
        console.log('❌ Failed to create Collaboration table:', createError);
      }
    }
    
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "UserConnection" LIMIT 1`;
      console.log('✅ UserConnection table exists');
    } catch (error: any) {
      console.log('❌ UserConnection table missing:', error.message);
      
      // Try to create the table
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "UserConnection" (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "senderId" TEXT NOT NULL,
            "receiverId" TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY ("senderId") REFERENCES "User"(id) ON DELETE CASCADE,
            FOREIGN KEY ("receiverId") REFERENCES "User"(id) ON DELETE CASCADE,
            UNIQUE("senderId", "receiverId")
          )
        `;
        console.log('✅ Created UserConnection table');
      } catch (createError) {
        console.log('❌ Failed to create UserConnection table:', createError);
      }
    }
    
    // Try to add isShared column to Reminder table if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Reminder" 
        ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN DEFAULT false
      `;
      console.log('✅ Added isShared column to Reminder table');
    } catch (error) {
      console.log('❌ Failed to add isShared column:', error.message);
    }
    
    console.log('\n🎉 Collaborative tables check completed!');
    
  } catch (error) {
    console.error('❌ Error checking collaborative tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollaborativeTables();
