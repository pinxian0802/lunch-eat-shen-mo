# 🍜 午餐吃什麼 - 阿嬌滷味點餐系統

> 集合阿嬌滷味線上點餐與午餐決策工具的 Web 應用程式

[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-orange)](https://a-jiao-braised-dish.web.app)
[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-cyan)](https://tailwindcss.com/)

## 🌟 專案介紹

這是一個整合兩大功能的現代化 Web 應用：

### 1️⃣ **阿嬌滷味點餐系統**
- 🛒 線上點餐功能
- 📜 歷史訂單查詢
- 🎁 滿額贈送主食
- ☁️ Firebase 雲端同步
- 💰 即時金額計算

### 2️⃣ **午餐決策引擎（Randomizer）**
- 🎡 智慧輪盤抽籤系統
- 🔍 價格/距離雙重篩選
- 📍 60+ 間青島東路周邊餐廳資料
- 📊 今日統計與排行
- 📝 個人午餐歷史紀錄
- 👥 多用戶即時動態

## 🚀 線上體驗

**正式網站：** [https://a-jiao-braised-dish.web.app](https://a-jiao-braised-dish.web.app)

## 🛠️ 技術棧

### 前端框架
- **React 19.2.0** - 使用最新的 React Hooks
- **Vite 7.2.4** - 極速開發與構建
- **React Router DOM 7.9.6** - 客戶端路由

### UI 與樣式
- **Tailwind CSS 3.4.17** - Utility-first CSS 框架
- **Lucide React 0.554.0** - 現代化圖標庫
- **Canvas API** - 輪盤動畫繪製

### 後端與資料庫
- **Firebase 12.6.0**
  - Firebase Authentication（匿名登入）
  - Cloud Firestore（即時資料庫）
  - Firebase Hosting（靜態網站託管）

### 開發工具
- **ESLint** - 程式碼品質檢查
- **PostCSS** - CSS 處理
- **Autoprefixer** - 自動添加 CSS 前綴

## 📦 專案結構

```
luwei-ordering-app/
├── src/
│   ├── components/
│   │   └── Toast.jsx           # 通知元件
│   ├── assets/
│   │   └── ajiao.png           # 阿嬌照片
│   ├── HomePage.jsx            # 首頁（導航頁）
│   ├── LuWeiOrderingApp.jsx    # 滷味點餐系統
│   ├── LunchPicker.jsx         # 午餐決策引擎
│   ├── main.jsx                # 應用程式進入點
│   ├── App.jsx                 # 路由配置
│   ├── index.css               # 全域樣式
│   └── App.css
├── public/
│   └── index.html
├── .env                        # Firebase 環境變數（不提交）
├── .env.example                # 環境變數範例
├── firebase.json               # Firebase 配置
├── firestore.rules             # Firestore 安全規則
├── firestore.indexes.json      # Firestore 索引配置
├── tailwind.config.cjs         # Tailwind 配置
├── postcss.config.cjs          # PostCSS 配置
├── vite.config.js              # Vite 配置
├── DEPLOYMENT-GUIDE.md         # 部署指南
└── package.json
```

## 🏁 快速開始

### 前置需求
- Node.js 18+ 
- npm 或 yarn
- Firebase CLI（用於部署）

### 安裝步驟

1. **複製專案**
```bash
git clone https://github.com/pinxian0802/lunch-eat-shen-mo.git
cd luwei-ordering-app
```

2. **安裝依賴**
```bash
npm install
```

3. **設定環境變數**
```bash
# 複製範例檔案
copy .env.example .env

# 編輯 .env 並填入你的 Firebase 配置
```

`.env` 內容範例：
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. **啟動開發伺服器**
```bash
npm run dev
```

開啟瀏覽器訪問 `http://localhost:5173`

## 📜 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器（HMR） |
| `npm run build` | 構建生產版本到 `dist/` |
| `npm run preview` | 預覽生產版本 |
| `npm run lint` | 執行 ESLint 檢查 |

## 🚢 部署

### 使用 Firebase Hosting

1. **安裝 Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **登入 Firebase**
```bash
firebase login
```

3. **構建並部署**
```bash
npm run build
firebase deploy --only hosting
```

或使用快速部署腳本：
```bash
# Windows
.\deploy.bat

# PowerShell
.\deploy.ps1
```

詳細部署說明請參考：[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)

## 🗂️ Firebase 資料結構

```
artifacts/
└── aj-luwei-ordering-app/
    └── public/
        └── data/
            ├── users/                      # 用戶資料
            │   └── {userId}
            ├── orders/                     # 滷味訂單
            │   └── {orderId}
            ├── restaurants/                # 餐廳資料
            │   └── {restaurantId}
            ├── lunchHistory/               # 午餐歷史
            │   └── {userId}/
            │       └── records/{recordId}
            └── todayLunches/               # 今日選擇
                └── {date}/
                    └── selections/{userId}
```

## 🔒 環境變數

所有 Firebase 配置都透過環境變數管理：

- ✅ **安全**：敏感資訊不提交到 Git
- ✅ **靈活**：不同環境使用不同配置
- ✅ **簡單**：使用 Vite 的 `import.meta.env`

## 🎨 功能亮點

### 阿嬌滷味系統
- 多類別商品管理（蔬菜、肉類、豆製品等）
- 購物車即時更新
- 訂單歷史查詢
- 匿名用戶登入（同瀏覽器共用帳號）

### 午餐決策系統
- 輪盤動畫效果（Canvas 繪製）
- 價格區間篩選（$, $$, $$$）
- 距離半徑篩選（100m - 不限）
- 即時統計排行
- 個人歷史紀錄
- 漂浮式統計面板

## 🔧 開發注意事項

### Tailwind CSS
確保已正確配置 `tailwind.config.cjs` 和 `postcss.config.cjs`

### Firebase Rules
修改 `firestore.rules` 後需重新部署：
```bash
firebase deploy --only firestore:rules
```

### 匿名認證
- 同一瀏覽器共用一個匿名帳號
- 需使用無痕模式測試多帳號功能

## 🐛 常見問題

**Q: 構建失敗 - Rollup 模組錯誤？**
```bash
npm install --force
npm run build
```

**Q: 部署後看不到更新？**
- 清除瀏覽器快取：`Ctrl + Shift + R`
- 或使用無痕模式

**Q: Tailwind 樣式沒有生效？**
- 確認 `postcss.config.cjs` 存在
- 確認 `src/index.css` 包含 `@tailwind` 指令
- 重新構建專案

詳細疑難排解請參考：[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)

## 📝 授權

此專案僅供個人學習與使用

## 👨‍💻 作者

- GitHub: [@pinxian0802](https://github.com/pinxian0802)
- Repository: [lunch-eat-shen-mo](https://github.com/pinxian0802/lunch-eat-shen-mo)

## 🙏 致謝

- 阿嬌滷味老闆娘提供美味的滷味
- 所有使用者的寶貴建議與回饋

---

**享受你的午餐！🍜✨**
