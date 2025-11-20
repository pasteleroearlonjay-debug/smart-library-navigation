# Production Test Script for Email Notifications
# Replace YOUR_VERCEL_URL with your actual deployment URL

$PROD_URL = "https://smart-library-navigation.vercel.app"  # ⚠️ CHANGE THIS TO YOUR URL
$CRON_SECRET = "01b3a712a25673e9e527ab7b7f8c6d7f62d57361a289b4da16145945ffef2de5"

Write-Host ""
Write-Host "🧪 Testing Production Email Notifications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production URL: $PROD_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Due Book Reminders
Write-Host "📚 Test 1: Due Book Reminders" -ForegroundColor Green
Write-Host "   Calling: $PROD_URL/api/notifications/send-due-reminders" -ForegroundColor Gray
try {
    $response1 = Invoke-RestMethod -Uri "$PROD_URL/api/notifications/send-due-reminders" `
        -Method POST `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "   ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Message: $($response1.message)" -ForegroundColor White
    Write-Host "   Sent: $($response1.sent)" -ForegroundColor Cyan
    Write-Host "   Failed: $($response1.failed)" -ForegroundColor $(if ($response1.failed -gt 0) { "Red" } else { "Green" })
    Write-Host "   Total: $($response1.total)" -ForegroundColor White
    
    if ($response1.results -and $response1.results.Count -gt 0) {
        Write-Host "   Results:" -ForegroundColor Gray
        $response1.results | ForEach-Object {
            $color = if ($_.status -eq 'sent') { "Green" } else { "Red" }
            Write-Host "     • $($_.status.ToUpper()) to $($_.email)" -ForegroundColor $color
        }
    }
} catch {
    Write-Host "   ❌ FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Wait 2 seconds
Start-Sleep -Seconds 2

# Test 2: User Notifications
Write-Host "👤 Test 2: User Notifications" -ForegroundColor Green
Write-Host "   Calling: $PROD_URL/api/notifications/send-user-notifications" -ForegroundColor Gray
try {
    $response2 = Invoke-RestMethod -Uri "$PROD_URL/api/notifications/send-user-notifications" `
        -Method POST `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "   ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Message: $($response2.message)" -ForegroundColor White
    Write-Host "   Sent: $($response2.sent)" -ForegroundColor Cyan
    Write-Host "   Failed: $($response2.failed)" -ForegroundColor $(if ($response2.failed -gt 0) { "Red" } else { "Green" })
    Write-Host "   Total: $($response2.total)" -ForegroundColor White
    
    if ($response2.results -and $response2.results.Count -gt 0) {
        Write-Host "   Results:" -ForegroundColor Gray
        $response2.results | ForEach-Object {
            $color = if ($_.status -eq 'sent') { "Green" } else { "Red" }
            Write-Host "     • $($_.status.ToUpper()) to $($_.email)" -ForegroundColor $color
        }
    }
} catch {
    Write-Host "   ❌ FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Cron Endpoint (Optional)
Write-Host "⏰ Test 3: Cron Endpoint (Combined)" -ForegroundColor Green
Write-Host "   Calling: $PROD_URL/api/cron/send-notifications" -ForegroundColor Gray
Write-Host "   Note: This runs both due reminders AND user notifications" -ForegroundColor Yellow

try {
    $headers = @{
        "x-cron-secret" = $CRON_SECRET
    }
    $response3 = Invoke-RestMethod -Uri "$PROD_URL/api/cron/send-notifications" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Timestamp: $($response3.timestamp)" -ForegroundColor White
    Write-Host "   Duration: $($response3.duration)" -ForegroundColor White
    Write-Host ""
    Write-Host "   Due Book Reminders:" -ForegroundColor Cyan
    Write-Host "     Sent: $($response3.dueBookReminders.sent), Failed: $($response3.dueBookReminders.failed)" -ForegroundColor White
    Write-Host "   User Notifications:" -ForegroundColor Cyan
    Write-Host "     Sent: $($response3.userNotifications.sent), Failed: $($response3.userNotifications.failed)" -ForegroundColor White
    Write-Host "   Summary:" -ForegroundColor Cyan
    Write-Host "     Total Sent: $($response3.summary.totalSent)" -ForegroundColor Green
    Write-Host "     Total Failed: $($response3.summary.totalFailed)" -ForegroundColor $(if ($response3.summary.totalFailed -gt 0) { "Red" } else { "Green" })
} catch {
    Write-Host "   ❌ FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Note: Make sure CRON_SECRET is set correctly in Vercel" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📧 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Check your email inbox: pasteleroearlonjay@gmail.com" -ForegroundColor White
Write-Host "   2. Check spam folder if emails don't arrive" -ForegroundColor White
Write-Host "   3. Check Vercel function logs for details" -ForegroundColor White
Write-Host "   4. Verify database records in email_notifications table" -ForegroundColor White
Write-Host ""

