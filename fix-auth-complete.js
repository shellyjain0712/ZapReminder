#!/usr/bin/env node

// Comprehensive authentication test script
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runAuthenticationFix() {
  console.log('🔧 Fixing Authentication & Database Issues...\n');

  try {
    // Step 1: Stop all Node processes
    console.log('1. Stopping all Node.js processes...');
    try {
      await execPromise('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"');
      console.log('✅ Node processes stopped');
    } catch {
      console.log('ℹ️ No Node processes to stop');
    }

    // Step 2: Clear Prisma cache
    console.log('\n2. Clearing Prisma cache...');
    try {
      await execPromise('powershell -Command "if (Test-Path node_modules\\.prisma) { Remove-Item -Recurse -Force node_modules\\.prisma }"');
      console.log('✅ Prisma cache cleared');
    } catch {
      console.log('ℹ️ No Prisma cache to clear');
    }

    // Step 3: Generate Prisma client
    console.log('\n3. Generating Prisma client...');
    const { stdout: generateOutput } = await execPromise('npx prisma generate');
    console.log('✅ Prisma client generated');
    if (generateOutput.includes('Generated Prisma Client')) {
      console.log('✅ Client generation successful');
    }

    // Step 4: Push database schema
    console.log('\n4. Pushing database schema...');
    const { stdout: pushOutput } = await execPromise('npx prisma db push');
    console.log('✅ Database schema pushed');
    if (pushOutput.includes('Database sync')) {
      console.log('✅ Database sync successful');
    }

    console.log('\n🎉 All fixes applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start development server: npm run dev');
    console.log('2. Test signup: http://localhost:3000/signup');
    console.log('3. Test login: http://localhost:3000/login');
    console.log('4. Check console logs for any issues');
    console.log('\n✅ Authentication should now work with proper dashboard redirect!');

  } catch (error) {
    console.error('❌ Error during fix:', error instanceof Error ? error.message : 'Unknown error');
    console.log('\n📝 Manual fallback:');
    console.log('1. Close all terminals and VS Code');
    console.log('2. Delete node_modules\\.prisma folder');
    console.log('3. Run: npx prisma generate');
    console.log('4. Run: npx prisma db push');
    console.log('5. Start: npm run dev');
  }
}

runAuthenticationFix();
