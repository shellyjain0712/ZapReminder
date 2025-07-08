@echo off
echo 🔄 Regenerating Prisma Client for PostgreSQL Database...

echo Removing Prisma cache...
if exist "node_modules\.prisma" rmdir /s /q "node_modules\.prisma"

echo Generating Prisma client...
call npx prisma generate

echo Pushing database schema to Neon PostgreSQL...
call npx prisma db push

echo ✅ Prisma regeneration complete!
echo 💡 Please restart your development server and TypeScript server in VS Code.
echo    - In VS Code: Ctrl+Shift+P -^> TypeScript: Restart TS Server
echo    - Terminal: Stop dev server (Ctrl+C) and run 'npm run dev' again
