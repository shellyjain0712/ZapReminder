// Regenerate Prisma Client Script
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 Regenerating Prisma Client for PostgreSQL Database...');

// Remove existing .prisma folder if it exists
const prismaPath = path.join(__dirname, 'node_modules', '.prisma');
if (fs.existsSync(prismaPath)) {
    console.log('Removing Prisma cache...');
    fs.rmSync(prismaPath, { recursive: true, force: true });
    console.log('✅ Prisma cache removed');
}

// Generate Prisma client
console.log('Generating Prisma client...');
exec('npx prisma generate', (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Error generating Prisma client:', error);
        return;
    }
    console.log('✅ Prisma client generated');
    console.log(stdout);
    if (stderr) console.error(stderr);

    // Push database schema
    console.log('Pushing database schema to Neon PostgreSQL...');
    exec('npx prisma db push', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Error pushing database schema:', error);
            return;
        }
        console.log('✅ Database schema pushed');
        console.log(stdout);
        if (stderr) console.error(stderr);

        console.log('\n🎉 Prisma regeneration complete!');
        console.log('💡 Please restart your development server and TypeScript server in VS Code.');
        console.log('   - In VS Code: Ctrl+Shift+P -> TypeScript: Restart TS Server');
        console.log('   - Terminal: Stop dev server (Ctrl+C) and run \'npm run dev\' again');
    });
});
