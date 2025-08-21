import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Collaboration', 'SharedReminder', 'UserConnection')
      ORDER BY table_name;
    `;
    
    const tables = await db.$queryRawUnsafe(tablesQuery);
    console.log('📊 Found tables:', tables);
    
    // Check enum types
    const enumsQuery = `
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE '%Role%' OR t.typname LIKE '%Status%'
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    const enums = await db.$queryRawUnsafe(enumsQuery);
    console.log('🎯 Found enums:', enums);
    
    // Check Collaboration table structure
    if (tables.some(t => t.table_name === 'Collaboration')) {
      const collaborationSchema = await db.$queryRawUnsafe(`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'Collaboration' 
        ORDER BY ordinal_position;
      `);
      console.log('🤝 Collaboration table structure:', collaborationSchema);
    }
    
    // Check SharedReminder table structure
    if (tables.some(t => t.table_name === 'SharedReminder')) {
      const sharedReminderSchema = await db.$queryRawUnsafe(`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'SharedReminder' 
        ORDER BY ordinal_position;
      `);
      console.log('📤 SharedReminder table structure:', sharedReminderSchema);
    }

    // Test a simple insert to see what happens
    console.log('\n🧪 Testing enum insertion...');
    try {
      const testQuery = `
        INSERT INTO "Collaboration" (
          id, "reminderId", "senderId", "receiverId", 
          type, status, role, message, "createdAt", "updatedAt"
        ) VALUES (
          'test-id-12345',
          'test-reminder-id',
          'test-sender-id',
          'test-receiver-id',
          'SHARE',
          'PENDING',
          'VIEWER'::text,
          'Test message',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;
      await db.$executeRawUnsafe(testQuery);
      console.log('✅ Test insert successful');
      
      // Clean up test data
      await db.$executeRawUnsafe(`DELETE FROM "Collaboration" WHERE id = 'test-id-12345'`);
      console.log('🧹 Test data cleaned up');
    } catch (testError) {
      console.log('❌ Test insert failed:', testError.message);
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    await db.$disconnect();
  }
}

checkDatabaseSchema();
