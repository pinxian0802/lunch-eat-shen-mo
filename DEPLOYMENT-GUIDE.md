# 🚀 阿嬌滷味 - Firebase 部署指南

## 📋 每次更新程式碼後的部署步驟

### 前置條件
- 已安裝 Node.js 和 npm
- 已安裝 Firebase CLI (`npm install -g firebase-tools`)
- 已登入 Firebase (`firebase login`)

---

## 🔄 標準部署流程（每次更新都執行這些步驟）

### **步驟 1: 確保所有變更已儲存**
- 按 `Ctrl + S` 儲存所有修改的檔案
- 確認所有程式碼修改都已完成

### **步驟 2: 構建生產版本**

在 PowerShell 或終端機中執行：

```powershell
cd C:\Users\Panda\Desktop\lunch\luwei-ordering-app
npm run build
```

**預期結果：**
- 成功後會看到 `✓ built in XXs` 訊息
- 專案根目錄會生成 `dist` 資料夾
- 顯示各檔案的大小資訊

**如果失敗：** 查看錯誤訊息，通常是語法錯誤或缺少依賴

### **步驟 3: 部署到 Firebase**

```powershell
firebase deploy
```

**或者只部署網站（不更新 Firestore 規則）：**

```powershell
firebase deploy --only hosting
```

**預期結果：**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/a-jiao-braised-dish/overview
Hosting URL: https://a-jiao-braised-dish.web.app
```

### **步驟 4: 驗證部署**

1. 打開瀏覽器訪問：`https://a-jiao-braised-dish.web.app`
2. 按 `Ctrl + Shift + R` 強制重新整理（清除快取）
3. 測試功能是否正常

---

## 🛠️ 常見問題與解決方案

### ❌ 問題 1: 構建失敗 - Rollup 模組錯誤

**錯誤訊息：**
```
Error: Cannot find module @rollup/rollup-win32-x64-msvc
```

**解決方法：**
```powershell
# 重新安裝依賴
npm install --force
npm run build
```

### ❌ 問題 2: 刪除 node_modules 失敗（檔案被鎖定）

**解決方法：**
1. 關閉所有終端機（特別是正在運行的 dev server）
2. 完全關閉 VS Code
3. 手動刪除 `node_modules` 資料夾
4. 重新執行：
```powershell
npm install
npm run build
```

### ❌ 問題 3: 部署後看不到更新

**解決方法：**
1. 清除瀏覽器快取：`Ctrl + Shift + R`
2. 或使用無痕模式開啟網站
3. 確認構建時間是否為最新（查看 dist 資料夾的修改時間）

### ❌ 問題 4: Tailwind CSS 樣式沒有生效

**檢查清單：**
- ✅ `tailwind.config.cjs` 存在且配置正確
- ✅ `postcss.config.cjs` 存在且配置正確
- ✅ `src/index.css` 包含 `@tailwind` 指令
- ✅ 執行過 `npm run build`

---

## 📱 快速部署命令（一鍵執行）

### 方法 A: 使用批次檔（Windows）

雙擊執行 `fix-and-build.bat` 或在終端執行：
```powershell
.\fix-and-build.bat
```

### 方法 B: 完整命令

```powershell
# 進入專案目錄
cd C:\Users\Panda\Desktop\lunch\luwei-ordering-app

# 構建並部署
npm run build && firebase deploy --only hosting
```

---

## 🔍 部署前檢查清單

- [ ] 所有檔案已儲存
- [ ] 本地測試通過（`npm run dev` 可正常運行）
- [ ] 沒有 console 錯誤
- [ ] Firebase 配置正確
- [ ] 已登入 Firebase CLI

---

## 📝 重要檔案說明

| 檔案 | 用途 |
|------|------|
| `dist/` | 構建後的生產檔案（這個資料夾會被部署） |
| `firebase.json` | Firebase 配置（hosting 指向 dist） |
| `src/` | 原始程式碼 |
| `tailwind.config.cjs` | Tailwind CSS 配置 |
| `postcss.config.cjs` | PostCSS 配置 |

---

## 🎯 完整部署流程圖

```
修改程式碼
    ↓
儲存所有檔案 (Ctrl + S)
    ↓
npm run build (構建生產版本)
    ↓
檢查 dist 資料夾是否生成
    ↓
firebase deploy --only hosting
    ↓
訪問網站驗證更新
    ↓
✅ 部署完成！
```

---

## 💡 實用技巧

### 1. 只更新網站內容（不更新資料庫規則）
```powershell
firebase deploy --only hosting
```

### 2. 預覽構建結果（不部署）
```powershell
npm run build
npm run preview
```
然後訪問顯示的本地 URL 預覽生產版本

### 3. 查看部署歷史
```powershell
firebase hosting:releases:list
```

### 4. 回滾到上一個版本
```powershell
firebase hosting:rollback
```

---

## 🆘 需要幫助？

如果遇到問題：
1. 檢查 Firebase Console: https://console.firebase.google.com/project/a-jiao-braised-dish
2. 查看終端機的完整錯誤訊息
3. 確認網路連線正常
4. 重新登入 Firebase: `firebase login --reauth`

---

## 📌 記住這個簡單流程

**每次改完程式碼後：**
1. `npm run build` - 構建
2. `firebase deploy --only hosting` - 部署
3. 訪問網站驗證 - 完成！

就這麼簡單！🎉
