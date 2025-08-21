#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function fixSignupIssue() {
  console.log('🔧 Fixing signup redirect issue...\n');

  try {
    console.log('1. Generating Prisma client...');
    const { stdout: generateOutput, stderr: generateError } = await execPromise('npx prisma generate');
    console.log('✅ Prisma client generated');
    if (generateOutput) console.log(generateOutput);
    if (generateError) console.log('Warnings:', generateError);

    console.log('\n2. Pushing database schema...');
    const { stdout: pushOutput, stderr: pushError } = await execPromise('npx prisma db push');
    console.log('✅ Database schema pushed');
    if (pushOutput) console.log(pushOutput);
    if (pushError) console.log('Warnings:', pushError);

    console.log('\n🎉 Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server (Ctrl+C then npm run dev)');
    console.log('2. Test signup at http://localhost:3000/signup');
    console.log('3. Check console logs for any remaining issues');
    console.log('\n✅ Manual signup should now redirect to dashboard properly!');

  } catch (error) {
    console.error('❌ Error fixing signup issue:', error);
    console.log('\n📝 Manual steps to fix:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: npx prisma db push');
    console.log('3. Restart development server');
  }
}

fixSignupIssue();
