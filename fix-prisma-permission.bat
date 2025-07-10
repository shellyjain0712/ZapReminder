@echo off
echo 🔧 Fixing Prisma Permission Error...
echo.

echo 1. Stopping Node processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Node processes stopped
) else (
    echo ℹ️ No Node processes to stop
)

echo.
echo 2. Waiting for file handles to release...
timeout /t 3 /nobreak >nul

echo.
echo 3. Removing Prisma cache...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma"
    echo ✅ Prisma cache removed
) else (
    echo ℹ️ No Prisma cache to remove
)

echo.
echo 4. Generating Prisma client...
call npx prisma generate
if %errorlevel% == 0 (
    echo ✅ Prisma client generated successfully!
) else (
    echo ❌ Failed to generate Prisma client
    echo Please try the following manually:
    echo   1. Close all terminals and VS Code
    echo   2. Delete node_modules\.prisma folder
    echo   3. Run: npx prisma generate
    pause
    exit /b 1
)

echo.
echo 5. Pushing database schema...
call npx prisma db push
if %errorlevel% == 0 (
    echo ✅ Database schema pushed successfully!
) else (
    echo ⚠️ Schema push had issues, but client should work
)

echo.
echo 🎉 Prisma setup complete!
echo 📋 Next steps:
echo   1. Restart VS Code TypeScript server: Ctrl+Shift+P -^> TypeScript: Restart TS Server
echo   2. Start development server: npm run dev
echo   3. Test signup at http://localhost:3000/signup
echo.

pause
