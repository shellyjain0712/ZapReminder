import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkCollaborationType() {
  try {
    console.log('🔍 Checking CollaborationType enum...');
    
    const enumsQuery = `
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'CollaborationType'
      ORDER BY e.enumsortorder;
    `;
    
    const enums = await db.$queryRawUnsafe(enumsQuery);
    console.log('🎯 CollaborationType values:', enums);
    
    // Try a proper insert with enum casting
    console.log('\n🧪 Testing proper enum insertion...');
    try {
      const testQuery = `
        INSERT INTO "Collaboration" (
          id, "reminderId", "senderId", "receiverId", 
          type, status, role, message, "createdAt", "updatedAt"
        ) VALUES (
          'test-id-67890',
          'test-reminder-id',
          'test-sender-id',
          'test-receiver-id',
          'SHARE'::"CollaborationType",
          'PENDING'::"CollaborationStatus",
          'VIEWER'::"SharedReminderRole",
          'Test message',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;
      await db.$executeRawUnsafe(testQuery);
      console.log('✅ Proper enum insert successful');
      
      // Clean up test data
      await db.$executeRawUnsafe(`DELETE FROM "Collaboration" WHERE id = 'test-id-67890'`);
      console.log('🧹 Test data cleaned up');
    } catch (testError) {
      console.log('❌ Proper enum insert failed:', testError.message);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await db.$disconnect();
  }
}

checkCollaborationType();
