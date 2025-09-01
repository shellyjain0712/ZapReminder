# Test advance email notification
Write-Host "🧪 Testing Advance Email Notification System..." -ForegroundColor Yellow

try {
    # Test basic email first
    Write-Host "📧 Testing basic email..." -ForegroundColor Cyan
    $basicResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/test-email' -Method Post -ContentType 'application/json' -Body '{"email": "shellyjain0045@gmail.com", "type": "basic"}'
    Write-Host "✅ Basic email test: $($basicResponse.message)" -ForegroundColor Green

    # Test advance notification email
    Write-Host "📧 Testing advance notification email..." -ForegroundColor Cyan
    $advanceResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/test-email' -Method Post -ContentType 'application/json' -Body '{"email": "shellyjain0045@gmail.com", "type": "advance-notification"}'
    Write-Host "✅ Advance email test: $($advanceResponse.message)" -ForegroundColor Green

    Write-Host "🎉 All email tests passed! Check your inbox for the test emails." -ForegroundColor Green
}
catch {
    Write-Host "❌ Email test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error: $($_.Exception)" -ForegroundColor Red
}
