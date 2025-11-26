# 阿嬌滷味 - 快速部署腳本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   阿嬌滷味 - 快速部署腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 正在構建生產版本..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 構建失敗！請檢查錯誤訊息。" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}

Write-Host ""
Write-Host "[2/3] 構建成功！正在部署到 Firebase..." -ForegroundColor Yellow
firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 部署失敗！請檢查錯誤訊息。" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ 部署成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 網站 URL: " -NoNewline
Write-Host "https://a-jiao-braised-dish.web.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示: 訪問網站後按 Ctrl+Shift+R 強制重新整理" -ForegroundColor Yellow
Write-Host ""
Read-Host "按 Enter 鍵退出"
