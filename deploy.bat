@echo off
chcp 65001 >nul
echo ========================================
echo   阿嬌滷味 - 快速部署腳本
echo ========================================
echo.

echo [1/3] 正在構建生產版本...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 構建失敗！請檢查錯誤訊息。
    pause
    exit /b 1
)

echo.
echo [2/3] 構建成功！正在部署到 Firebase...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ 部署失敗！請檢查錯誤訊息。
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ 部署成功！
echo ========================================
echo.
echo 🌐 網站 URL: https://a-jiao-braised-dish.web.app
echo.
echo 💡 提示: 訪問網站後按 Ctrl+Shift+R 強制重新整理
echo.
pause
