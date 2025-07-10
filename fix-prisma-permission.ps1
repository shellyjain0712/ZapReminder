#!/usr/bin/env pwsh
Write-Host "🔧 Fixing Prisma Permission Error..." -ForegroundColor Cyan

# Step 1: Stop all Node processes
Write-Host "1. Stopping all Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Node processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No Node processes to stop" -ForegroundColor Blue
}

# Step 2: Wait a moment for file handles to release
Write-Host "2. Waiting for file handles to release..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 3: Remove .prisma cache
Write-Host "3. Removing Prisma cache..." -ForegroundColor Yellow
try {
    if (Test-Path "node_modules\.prisma") {
        Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Prisma cache removed" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No Prisma cache to remove" -ForegroundColor Blue
    }
} catch {
    Write-Host "⚠️ Could not remove cache, but continuing..." -ForegroundColor DarkYellow
}

# Step 4: Generate Prisma client
Write-Host "4. Generating Prisma client..." -ForegroundColor Yellow
try {
    & npx prisma generate
    Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client. Manual intervention needed." -ForegroundColor Red
    Write-Host "Try running the commands manually:" -ForegroundColor Yellow
    Write-Host "  1. Close VS Code and all terminals" -ForegroundColor Yellow
    Write-Host "  2. Delete node_modules\.prisma folder manually" -ForegroundColor Yellow
    Write-Host "  3. Run: npx prisma generate" -ForegroundColor Yellow
    exit 1
}

# Step 5: Push database schema
Write-Host "5. Pushing database schema..." -ForegroundColor Yellow
try {
    & npx prisma db push
    Write-Host "✅ Database schema pushed successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Schema push had issues, but client should work" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "🎉 Prisma setup complete!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Blue
Write-Host "  1. Restart VS Code TypeScript server: Ctrl+Shift+P -> TypeScript: Restart TS Server" -ForegroundColor Blue
Write-Host "  2. Start development server: npm run dev" -ForegroundColor Blue
Write-Host "  3. Test signup at http://localhost:3000/signup" -ForegroundColor Blue
Write-Host ""

Read-Host "Press Enter to continue..."
