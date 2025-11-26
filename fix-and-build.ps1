# 修復 Rollup 依賴問題並構建專案

Write-Host "步驟 1: 刪除 node_modules 和 package-lock.json..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "步驟 2: 重新安裝依賴..." -ForegroundColor Yellow
npm install

Write-Host "步驟 3: 構建生產版本..." -ForegroundColor Yellow
npm run build

Write-Host "完成！如果成功，接下來請執行: firebase deploy" -ForegroundColor Green
