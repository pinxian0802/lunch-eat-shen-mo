@echo off
echo 正在關閉可能占用檔案的程序...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM Code.exe 2>nul
timeout /t 2 /nobreak >nul

echo 正在刪除 node_modules...
rmdir /s /q node_modules 2>nul

echo 正在刪除 package-lock.json...
del /f /q package-lock.json 2>nul

echo 正在重新安裝依賴...
call npm install

echo.
echo 正在構建專案...
call npm run build

echo.
echo 完成！如果構建成功，請執行: firebase deploy
pause
