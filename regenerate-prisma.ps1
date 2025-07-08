#!/usr/bin/env pwsh
Write-Host "🔄 Regenerating Prisma Client for PostgreSQL Database..." -ForegroundColor Cyan

Write-Host "Removing Prisma cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma"
    Write-Host "✅ Prisma cache removed" -ForegroundColor Green
}

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
& npx prisma generate

Write-Host "Pushing database schema to Neon PostgreSQL..." -ForegroundColor Yellow
& npx prisma db push

Write-Host "✅ Prisma regeneration complete!" -ForegroundColor Green
Write-Host "💡 Please restart your development server and TypeScript server in VS Code." -ForegroundColor Blue
Write-Host "   - In VS Code: Ctrl+Shift+P -> TypeScript: Restart TS Server" -ForegroundColor Blue
Write-Host "   - Terminal: Stop dev server (Ctrl+C) and run 'npm run dev' again" -ForegroundColor Blue

Read-Host "Press Enter to continue..."
