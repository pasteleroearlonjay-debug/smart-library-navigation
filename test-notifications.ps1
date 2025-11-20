# Test Notification Endpoints Script
# Run this in PowerShell to test the email notification system

Write-Host "🧪 Testing Email Notification System" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BASE_URL = "http://localhost:3000"  # Change to your Vercel URL for production testing
# $BASE_URL = "https://your-app.vercel.app"  # Uncomment and replace for production

Write-Host "📧 Base URL: $BASE_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Due Book Reminders
Write-Host "📚 Test 1: Testing Due Book Reminders..." -ForegroundColor Green
try {
    $response1 = Invoke-RestMethod -Uri "$BASE_URL/api/notifications/send-due-reminders" -Method POST -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Message: $($response1.message)" -ForegroundColor White
    Write-Host "   Sent: $($response1.sent)" -ForegroundColor White
    Write-Host "   Failed: $($response1.failed)" -ForegroundColor White
    Write-Host "   Total: $($response1.total)" -ForegroundColor White
    
    if ($response1.results) {
        Write-Host "   Results:" -ForegroundColor Gray
        $response1.results | ForEach-Object {
            Write-Host "     - Record ID $($_.recordId): $($_.status) to $($_.email)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Wait 2 seconds between tests
Start-Sleep -Seconds 2

# Test 2: User Notifications
Write-Host "👤 Test 2: Testing User Notifications..." -ForegroundColor Green
try {
    $response2 = Invoke-RestMethod -Uri "$BASE_URL/api/notifications/send-user-notifications" -Method POST -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Message: $($response2.message)" -ForegroundColor White
    Write-Host "   Sent: $($response2.sent)" -ForegroundColor White
    Write-Host "   Failed: $($response2.failed)" -ForegroundColor White
    Write-Host "   Total: $($response2.total)" -ForegroundColor White
    
    if ($response2.results) {
        Write-Host "   Results:" -ForegroundColor Gray
        $response2.results | ForEach-Object {
            Write-Host "     - Notification ID $($_.notificationId): $($_.status) to $($_.email)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Cron Endpoint (Optional - requires CRON_SECRET)
Write-Host "⏰ Test 3: Testing Cron Endpoint (Optional)..." -ForegroundColor Green
Write-Host "   Note: This requires CRON_SECRET. Skip if not configured." -ForegroundColor Yellow

$CRON_SECRET = Read-Host "Enter CRON_SECRET (or press Enter to skip)"
if ($CRON_SECRET) {
    try {
        $headers = @{
            "x-cron-secret" = $CRON_SECRET
        }
        $response3 = Invoke-RestMethod -Uri "$BASE_URL/api/cron/send-notifications" -Method GET -Headers $headers
        
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "   Timestamp: $($response3.timestamp)" -ForegroundColor White
        Write-Host "   Duration: $($response3.duration)" -ForegroundColor White
        Write-Host "   Due Book Reminders:" -ForegroundColor Cyan
        Write-Host "     Sent: $($response3.dueBookReminders.sent), Failed: $($response3.dueBookReminders.failed)" -ForegroundColor White
        Write-Host "   User Notifications:" -ForegroundColor Cyan
        Write-Host "     Sent: $($response3.userNotifications.sent), Failed: $($response3.userNotifications.failed)" -ForegroundColor White
        Write-Host "   Summary:" -ForegroundColor Cyan
        Write-Host "     Total Sent: $($response3.summary.totalSent)" -ForegroundColor White
        Write-Host "     Total Failed: $($response3.summary.totalFailed)" -ForegroundColor White
    } catch {
        Write-Host "❌ FAILED!" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipped (no CRON_SECRET provided)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Check your email inbox for test emails" -ForegroundColor White
Write-Host "   - Check spam folder if emails don't arrive" -ForegroundColor White
Write-Host "   - Verify database records in email_notifications table" -ForegroundColor White

