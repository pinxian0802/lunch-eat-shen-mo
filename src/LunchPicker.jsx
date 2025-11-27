import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Filter, List, MapPin, Play, Loader, ChevronUp, AlertCircle, Home, ChefHat, User, Plus, Trash2, History, Users, TrendingUp, X, Frown } from 'lucide-react';
import Toast from './components/Toast';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// 從環境變數讀取 Firebase 配置
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig, 'lunch-picker-app');
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'aj-luwei-ordering-app';

// --- 初始餐廳資料 ---
const REAL_RESTAURANTS_INITIAL = [
  // === 0-100m (青島東路核心) ===
  { id: 33, name: '蓮池蔬食自助餐', price: "$", distance: 10, address: '台北市中正區青島東路7-4號', weekdayOpen: true, timeStart: "11:00", timeEnd: "14:30", tags: ['素食', '自助餐', '實惠'] },
  { id: 38, name: 'Lemon table 地中海飲食', price: "$$", distance: 30, address: '台北市中正區青島東路4-2號', weekdayOpen: true, timeStart: "11:00", timeEnd: "20:00", tags: ['健康', '輕食', '地中海'] },
  { id: 34, name: '青島東路麵食館', price: "$", distance: 40, address: '台北市中正區青島東路7-3號', weekdayOpen: true, timeStart: "10:30", timeEnd: "20:00", tags: ['麵食', '小吃', '實惠'] },
  { id: 1, name: '一之軒', price: "$", distance: 60, address: '台北市中正區青島東路8號', weekdayOpen: true, timeStart: "07:00", timeEnd: "22:00", tags: ['麵包', '輕食', '咖啡'] },
  { id: 21, name: '青島排骨便當', price: "$$", distance: 100, address: '台北市中正區青島東路3-3號', weekdayOpen: true, timeStart: "11:00", timeEnd: "14:00", tags: ['便當', '排骨', '排隊'] },
  
  // === 100-200m (青島東路周邊/林森南路/鎮江街) ===
  { id: 35, name: '蘭鄉排骨飯', price: "$$", distance: 120, address: '台北市中正區青島東路25-2號', weekdayOpen: true, timeStart: "10:30", timeEnd: "14:00", tags: ['便當', '排骨', '外送'] },
  { id: 2, name: '七味軒日式料理', price: "$$", distance: 120, address: '台北市中正區青島東路11-2號', weekdayOpen: true, timeStart: "11:00", timeEnd: "14:00", tags: ['日式', '丼飯', '咖哩'] },
  { id: 3, name: '93番茄牛肉麵', price: "$$", distance: 130, address: '台北市中正區青島東路7號', weekdayOpen: true, timeStart: "11:00", timeEnd: "20:30", tags: ['麵食', '牛肉麵', '番茄'] },
  { id: 18, name: '忠青商行', price: "$$", distance: 140, address: '台北市中正區青島東路6-1號', weekdayOpen: true, timeStart: "11:00", timeEnd: "20:30", tags: ['蝦仁飯', '文青', '台式'] },
  { id: 39, name: '正宗台南意麵', price: "$", distance: 150, address: '台北市中正區鎮江街7-1號', weekdayOpen: true, timeStart: "11:00", timeEnd: "14:00", tags: ['麵食', '意麵', '小吃'] },
  { id: 32, name: 'Nola Kitchen 紐澳良小廚', price: "$$$", distance: 150, address: '台北市中正區林森南路2號', weekdayOpen: true, timeStart: "11:30", timeEnd: "21:30", tags: ['美式', '排餐', '高級'] },
  { id: 20, name: '華山市場 (阜杭豆漿)', price: "$", distance: 160, address: '台北市中正區忠孝東路一段108號', weekdayOpen: true, timeStart: "05:30", timeEnd: "12:30", tags: ['早餐', '中式', '排隊'] },
  { id: 40, name: '正鋒自助餐', price: "$", distance: 180, address: '台北市中正區林森南路3巷3號', weekdayOpen: true, timeStart: "11:00", timeEnd: "14:00", tags: ['自助餐', '便當', '實惠'] },
  { id: 36, name: '和園川味小吃', price: "$$", distance: 200, address: '台北市中正區紹興南街5-2號', weekdayOpen: true, timeStart: "11:30", timeEnd: "14:00", tags: ['熱炒', '合菜', '川味'] },
  { id: 41, name: '八方雲集 (善導寺店)', price: "$", distance: 200, address: '台北市中正區忠孝東路一段10號', weekdayOpen: true, timeStart: "10:30", timeEnd: "21:00", tags: ['鍋貼', '水餃', '連鎖'] },
  
  // === 200-300m (善導寺捷運/忠孝東路) ===
  { id: 13, name: '雙月食品社', price: "$$", distance: 220, address: '台北市中正區青島東路6之2號', weekdayOpen: true, timeStart: "11:00", timeEnd: "14:15", tags: ['雞湯', '養生', '米其林'] },
  { id: 52, name: '碗粿無刺虱目魚湯', price: "$", distance: 240, address: '台北市中正區紹興南街', weekdayOpen: true, timeStart: "11:00", timeEnd: "20:00", tags: ['小吃', '魚湯', '台式'] },
  { id: 352, name: '麒玲 義大利麵店', price: "$", distance: 250, address: '台北市中正區忠孝東路一段82號', weekdayOpen: true, timeStart: "10:30", timeEnd: "14:00", tags: ['義大利麵', '焗烤', '平價'] },
  { id: 4, name: 'SUBWAY (林森南路)', price: "$$", distance: 280, address: '台北市中正區林森南路10號', weekdayOpen: true, timeStart: "08:00", timeEnd: "22:00", tags: ['輕食', '潛艇堡', '速食'] },
  { id: 42, name: '鬍鬚張魯肉飯 (華山店)', price: "$$", distance: 300, address: '台北市中正區忠孝東路一段150號', weekdayOpen: true, timeStart: "10:30", timeEnd: "22:00", tags: ['魯肉飯', '台式', '連鎖'] },
  
  // === 300-500m (濟南路/杭州南路) ===
  { id: 49, name: '有煎餃子館 (忠杭館)', price: "$$", distance: 450, address: '台北市中正區杭州南路一段10-1號', weekdayOpen: true, timeStart: "11:00", timeEnd: "20:00", tags: ['煎餃', '蒸餃', '麵食'] },
  { id: 26, name: 'CoCo壹番屋 (忠孝店)', price: "$$", distance: 320, address: '台北市中正區忠孝東路一段138號', weekdayOpen: true, timeStart: "11:00", timeEnd: "22:00", tags: ['日式', '咖哩'] },
  { id: 37, name: '摩斯漢堡 (善導寺店)', price: "$", distance: 350, address: '台北市中正區忠孝東路一段178號', weekdayOpen: true, timeStart: "06:00", timeEnd: "23:00", tags: ['漢堡', '速食', '早餐'] },
  { id: 43, name: '立法院福利部餐廳', price: "$", distance: 350, address: '台北市中正區濟南路一段1號', weekdayOpen: true, timeStart: "11:00", timeEnd: "14:00", tags: ['自助餐', '合菜', '隱藏版'] },
  { id: 353, name: '順口牛肉麵', price: "$", distance: 350, address: '台北市中正區濟南路一段9號', weekdayOpen: true, timeStart: "11:00", timeEnd: "14:30", tags: ['牛肉麵', '水餃', '老店'] },
  { id: 354, name: '香好呷專業魷魚羹', price: "$", distance: 350, address: '台北市中正區濟南路一段9號之1', weekdayOpen: true, timeStart: "07:00", timeEnd: "19:00", tags: ['羹湯', '魷魚羹', '小吃'] },
  { id: 48, name: '愛香園', price: "$$", distance: 360, address: '台北市中正區濟南路', weekdayOpen: true, timeStart: "11:00", timeEnd: "20:00", tags: ['麵食', '滷味', '老店'] },
  { id: 53, name: '萃茶風健康餐 (杭州店)', price: "$$", distance: 380, address: '台北市中正區杭州南路一段9-1號', weekdayOpen: true, timeStart: "10:30", timeEnd: "19:30", tags: ['健康餐', '便當', '低GI'] },
  { id: 54, name: 'BONGOUSSE 韓米堡 (華山店)', price: "$", distance: 390, address: '台北市中正區杭州南路一段9之2號', weekdayOpen: true, timeStart: "11:00", timeEnd: "19:00", tags: ['韓式', '米漢堡', '外帶'] },
  { id: 55, name: '古北饕旗艦店', price: "$$$", distance: 390, address: '台北市中正區杭州南路一段9號', weekdayOpen: true, timeStart: "11:00", timeEnd: "21:00", tags: ['湯包', '中式', '高級'] },
  
  // === 400-500m+ ===
  { id: 56, name: '悄悄好食 (杭州南店)', price: "$$", distance: 400, address: '台北市中正區杭州南路一段11巷4號', weekdayOpen: true, timeStart: "08:30", timeEnd: "18:30", tags: ['司康', '甜點', '早午餐'] },
  { id: 44, name: '客美多咖啡 (華山杭南店)', price: "$$", distance: 400, address: '台北市中正區杭州南路一段23-1號', weekdayOpen: true, timeStart: "07:30", timeEnd: "21:00", tags: ['咖啡', '早午餐', '日式'] },
  { id: 50, name: '怡客咖啡 (忠杭店)', price: "$$", distance: 410, address: '台北市中正區杭州南路一段8-2號', weekdayOpen: true, timeStart: "07:00", timeEnd: "22:00", tags: ['咖啡', '簡餐', '讀書'] },
  { id: 300, name: '三三麵屋', price: "$$", distance: 420, address: '台北市中正區(近青島)', weekdayOpen: true, timeStart: "11:00", timeEnd: "20:00", tags: ['麵食', '拉麵'] },
  { id: 5, name: '星巴克 (善導寺門市)', price: "$$$", distance: 450, address: '台北市中正區忠孝東路一段136號', weekdayOpen: true, timeStart: "07:00", timeEnd: "22:00", tags: ['咖啡', '輕食', '安靜'] },
  { id: 45, name: '臺北商業大學餐廳', price: "$", distance: 450, address: '台北市中正區濟南路一段321號', weekdayOpen: true, timeStart: "11:00", timeEnd: "13:30", tags: ['校園', '自助餐', '實惠'] },
  { id: 51, name: '水餃姊 (手工水餃)', price: "$", distance: 480, address: '台北市南港區同德路(外送為主)', weekdayOpen: true, timeStart: "10:00", timeEnd: "19:00", tags: ['水餃', '麵食', '外送'] },
  { id: 6, name: '老牌牛肉拉麵大王', price: "$$", distance: 550, address: '台北市中正區重慶南路一段29巷3號', weekdayOpen: true, timeStart: "09:30", timeEnd: "20:00", tags: ['麵食', '牛肉麵', '老店'] },
  { id: 7, name: '永和豆漿大王 (杭州店)', price: "$", distance: 600, address: '台北市中正區杭州南路一段31號', weekdayOpen: true, timeStart: "06:00", timeEnd: "22:00", tags: ['中式', '宵夜', '實惠'] },
  { id: 9, name: '丐幫滷味', price: "$", distance: 700, address: '台北市中正區濟南路二段', weekdayOpen: true, timeStart: "11:00", timeEnd: "23:00", tags: ['滷味', '宵夜', '小吃'] },
  { id: 10, name: '王記府城肉粽', price: "$", distance: 750, address: '台北市中正區八德路一段82巷32號', weekdayOpen: true, timeStart: "10:00", timeEnd: "20:00", tags: ['肉粽', '台式', '小吃'] },
  { id: 11, name: '晶華酒店 (自助餐)', price: "$$$", distance: 800, address: '台北市中山區林森北路370號', weekdayOpen: true, timeStart: "11:30", timeEnd: "14:30", tags: ['自助餐', '高級', '飯店'] },
  { id: 12, name: '爭鮮PLUS-善導寺店', price: "$$", distance: 850, address: '台北市中正區館前路26號', weekdayOpen: true, timeStart: "11:00", timeEnd: "21:00", tags: ['日式', '壽司', '迴轉'] },
];

const COLORS = [
  "#3b82f6", "#06b6d4", "#6366f1", "#14b8a6", "#8b5cf6", "#0ea5e9", "#64748b", "#2dd4bf"
];

const FUNNY_LOADING_MESSAGES = [
  "正在計算卡路里...",
  "正在詢問媽祖...",
  "正在觀落陰...",
  "正在分析老闆心情...",
  "正在測量風水...",
  "正在與餓勢力妥協...",
  "正在尋找傳說中的廚具...",
  "正在讀取你的體重計...",
  "正在擲筊...",
  "正在通靈...",
  "正在試圖理解你的品味...",
  "正在聯絡外星人...",
  "正在計算今天會不會拉肚子...",
  "正在偷看隔壁桌吃什麼...",
  "正在思考人生...",
  "正在假裝很忙...",
  "正在等待奇蹟發生...",
  "正在與宇宙能量連結...",
  "正在下載美味參數...",
  "正在避開地雷餐廳...",
  "正在召喚食神...",
  "正在分析今日運勢...",
  "正在確認錢包餘額...",
  "正在說服自己減肥明天再說...",
  "正在掃描附近美食...",
  "正在計算走路要幾分鐘...",
  "正在評估排隊長度...",
  "正在讀取你的腦波...",
  "正在跟肚子對話...",
  "正在尋找隱藏菜單...",
  "正在計算CP值...",
  "正在預測老闆會不會請客...",
  "正在分析今日幸運色...",
  "正在躲避不想遇到的同事...",
  "正在尋找不用排隊的店...",
  "正在計算熱量消耗...",
  "正在回憶上次吃什麼...",
  "正在考慮要不要叫外送...",
  "正在分析天氣影響...",
  "正在尋找有冷氣的店...",
  "正在計算步行距離...",
  "正在評估今日食慾...",
  "正在尋找有座位的店...",
  "正在分析今日心情...",
  "正在考慮要不要吃大餐...",
  "正在尋找便宜又好吃的店...",
  "正在計算荷包深度...",
  "正在預測今日特餐...",
  "正在尋找有正妹/帥哥店員的店...",
  "正在分析今日黃曆...",
  "正在考慮要不要吃素...",
  "正在尋找有貓的店...",
  "正在計算今日步數...",
  "正在評估今日運氣...",
  "正在尋找有Wifi的店...",
  "正在分析今日星象...",
  "正在考慮要不要吃辣...",
  "正在尋找有插座的店...",
  "正在計算今日卡路里攝取量...",
  "正在評估今日心情指數...",
  "正在尋找有電視的店...",
  "正在分析今日風向...",
  "正在考慮要不要吃甜點...",
  "正在尋找有廁所的店...",
  "正在計算今日飲水量...",
  "正在評估今日疲勞度...",
  "正在尋找有報紙的店...",
  "正在分析今日氣溫...",
  "正在考慮要不要喝飲料...",
  "正在尋找有雜誌的店...",
  "正在計算今日睡眠時間...",
  "正在評估今日壓力值...",
  "正在尋找有音樂的店...",
  "正在分析今日濕度...",
  "正在考慮要不要吃宵夜...",
  "正在尋找有風景的店...",
  "正在計算今日工作量...",
  "正在評估今日快樂指數...",
  "正在尋找有沙發的店...",
  "正在分析今日空氣品質...",
  "正在考慮要不要吃早餐...",
  "正在尋找有停車位的店...",
  "正在計算今日花費...",
  "正在評估今日幸運值...",
  "正在尋找有服務費的店...",
  "正在分析今日紫外線...",
  "正在考慮要不要吃下午茶...",
  "正在尋找有包廂的店...",
  "正在計算今日加班時間...",
  "正在評估今日健康狀況...",
  "正在尋找有兒童椅的店...",
  "正在分析今日降雨機率...",
  "正在考慮要不要吃早午餐...",
  "正在尋找有吸菸區的店...",
  "正在計算今日通勤時間...",
  "正在評估今日戀愛運...",
  "正在尋找有素食的店...",
  "正在分析今日地震機率...",
  "正在考慮要不要吃吃到飽...",
  "正在尋找有海鮮的店...",
  "正在計算今日上網時間...",
  "正在評估今日財運...",
  "正在尋找有牛排的店...",
  "正在分析今日股市...",
  "正在考慮要不要吃火鍋...",
  "正在尋找有燒烤的店...",
  "正在計算今日發呆時間...",
  "正在評估今日工作效率...",
  "正在尋找有拉麵的店...",
  "正在分析今日交通狀況...",
  "正在考慮要不要吃壽司...",
  "正在尋找有漢堡的店...",
  "正在計算今日滑手機時間...",
  "正在評估今日人際關係...",
  "正在尋找有披薩的店...",
  "正在分析今日新聞...",
  "正在考慮要不要吃義大利麵...",
  "正在尋找有咖哩的店...",
  "正在計算今日追劇時間...",
  "正在評估今日學習效率...",
  "正在尋找有炸雞的店...",
  "正在分析今日流行趨勢...",
  "正在考慮要不要吃滷味...",
  "正在尋找有鹹酥雞的店...",
  "正在計算今日運動量...",
  "正在評估今日睡眠品質...",
  "正在尋找有珍珠奶茶的店...",
  "正在分析今日熱搜關鍵字...",
  "正在考慮要不要吃冰...",
  "正在尋找有豆花的店...",
  "正在計算今日喝咖啡杯數...",
  "正在評估今日精神狀態...",
  "正在尋找有蛋糕的店...",
  "正在分析今日星座運勢...",
  "正在考慮要不要吃鬆餅...",
  "正在尋找有布丁的店...",
  "正在計算今日吃零食次數...",
  "正在評估今日體重變化...",
  "正在尋找有巧克力的店...",
  "正在分析今日幸運數字...",
  "正在考慮要不要吃餅乾...",
  "正在尋找有糖果的店...",
  "正在計算今日喝茶杯數...",
  "正在評估今日皮膚狀況...",
  "正在尋找有冰淇淋的店...",
  "正在分析今日幸運方位...",
  "正在考慮要不要吃優格...",
  "正在尋找有果汁的店...",
  "正在計算今日吃水果份量...",
  "正在評估今日腸胃狀況...",
  "正在尋找有沙拉的店...",
  "正在分析今日幸運物品...",
  "正在考慮要不要吃三明治...",
  "正在尋找有麵包的店...",
  "正在計算今日吃蔬菜份量...",
  "正在評估今日營養攝取...",
  "正在尋找有湯的店...",
  "正在分析今日幸運顏色...",
  "正在考慮要不要吃粥...",
  "正在尋找有飯糰的店...",
  "正在計算今日吃肉份量...",
  "正在評估今日飲食均衡...",
  "正在尋找有水餃的店...",
  "正在分析今日幸運時間...",
  "正在考慮要不要吃鍋貼...",
  "正在尋找有小籠包的店...",
  "正在計算今日吃澱粉份量...",
  "正在評估今日飽足感...",
  "正在尋找有饅頭的店...",
  "正在分析今日幸運花朵...",
  "正在考慮要不要吃包子...",
  "正在尋找有燒餅的店...",
  "正在計算今日吃油炸物次數...",
  "正在評估今日罪惡感...",
  "正在尋找有油條的店...",
  "正在分析今日幸運動物...",
  "正在考慮要不要吃蛋餅...",
  "正在尋找有蘿蔔糕的店...",
  "正在計算今日喝含糖飲料次數...",
  "正在評估今日血糖...",
  "正在尋找有蔥抓餅的店...",
  "正在分析今日幸運水果...",
  "正在考慮要不要吃韭菜盒...",
  "正在尋找有餡餅的店...",
  "正在計算今日吃甜食次數...",
  "正在評估今日牙齒健康...",
  "正在尋找有車輪餅的店...",
  "正在分析今日幸運蔬菜...",
  "正在考慮要不要吃雞蛋糕...",
  "正在尋找有地瓜球的店...",
  "正在計算今日吃宵夜次數...",
  "正在評估今日身材...",
  "正在尋找有章魚燒的店...",
  "正在分析今日幸運飲料...",
  "正在考慮要不要吃可麗餅...",
  "正在尋找有鯛魚燒的店...",
  "正在計算今日吃大餐次數...",
  "正在評估今日荷包...",
  "正在尋找有銅鑼燒的店...",
  "正在分析今日幸運點心...",
  "正在考慮要不要吃麻糬...",
  "正在尋找有鳳梨酥的店...",
  "正在計算今日吃零食花費...",
  "正在評估今日快樂...",
  "正在尋找有牛軋糖的店...",
  "正在分析今日幸運零食...",
  "正在考慮要不要吃蛋捲...",
  "正在尋找有太陽餅的店...",
  "正在計算今日喝手搖飲花費...",
  "正在評估今日滿足感...",
  "正在尋找有老婆餅的店...",
  "正在分析今日幸運甜點...",
  "正在考慮要不要吃綠豆椪...",
  "正在尋找有月餅的店...",
  "正在計算今日吃外食次數...",
  "正在評估今日健康...",
  "正在尋找有蛋黃酥的店...",
  "正在分析今日幸運食物...",
  "正在考慮要不要吃粽子...",
  "正在尋找有潤餅的店...",
  "正在計算今日自己煮次數...",
  "正在評估今日廚藝...",
  "正在尋找有刈包的店...",
  "正在分析今日幸運料理...",
  "正在考慮要不要吃碗粿...",
  "正在尋找有米糕的店...",
  "正在計算今日叫外送次數...",
  "正在評估今日懶惰指數...",
  "正在尋找有肉圓的店...",
  "正在分析今日幸運小吃...",
  "正在考慮要不要吃蚵仔煎...",
  "正在尋找有臭豆腐的店...",
  "正在計算今日排隊時間...",
  "正在評估今日耐心...",
  "正在尋找有大腸包小腸的店...",
  "正在分析今日幸運夜市美食...",
  "正在考慮要不要吃豬血糕...",
  "正在尋找有甜不辣的店...",
  "正在計算今日逛夜市次數...",
  "正在評估今日體力...",
  "正在尋找有花枝丸的店...",
  "正在分析今日幸運路邊攤...",
  "正在考慮要不要吃烤玉米...",
  "正在尋找有烤香腸的店...",
  "正在計算今日吃路邊攤次數...",
  "正在評估今日腸胃...",
  "正在尋找有糖葫蘆的店...",
  "正在分析今日幸運古早味...",
  "正在考慮要不要吃棉花糖...",
  "正在尋找有狀元糕的店...",
  "正在計算今日吃古早味次數...",
  "正在評估今日懷舊指數...",
  "正在尋找有龍鬚糖的店...",
  "正在分析今日幸運傳統美食...",
  "正在考慮要不要吃麥芽糖...",
  "正在尋找有吹糖的店...",
  "正在計算今日吃甜食份量...",
  "正在評估今日蛀牙風險...",
  "正在尋找有畫糖的店...",
  "正在分析今日幸運民俗技藝...",
  "正在考慮要不要吃捏麵人...",
  "正在尋找有爆米香的店...",
  "正在計算今日看表演次數...",
  "正在評估今日藝文氣息...",
  "正在尋找有雞蛋冰的店...",
  "正在分析今日幸運冰品...",
  "正在考慮要不要吃枝仔冰...",
  "正在尋找有綿綿冰的店...",
  "正在計算今日吃冰次數...",
  "正在評估今日消暑指數...",
  "正在尋找有剉冰的店...",
  "正在分析今日幸運涼品...",
  "正在考慮要不要吃愛玉...",
  "正在尋找有仙草的店...",
  "正在計算今日喝涼水次數...",
  "正在評估今日解渴指數...",
  "正在尋找有粉圓的店...",
  "正在分析今日幸運配料...",
  "正在考慮要不要吃芋圓...",
  "正在尋找有地瓜圓的店...",
  "正在計算今日吃QQ食物次數...",
  "正在評估今日咀嚼肌...",
  "正在尋找有湯圓的店...",
  "正在分析今日幸運節慶美食...",
  "正在考慮要不要吃元宵...",
  "正在尋找有年糕的店...",
  "正在計算今日過節氣氛...",
  "正在評估今日團圓指數...",
  "正在尋找有發糕的店...",
  "正在分析今日幸運拜拜供品...",
  "正在考慮要不要吃紅龜粿...",
  "正在尋找有草仔粿的店...",
  "正在計算今日拜拜次數...",
  "正在評估今日虔誠指數...",
  "正在尋找有壽桃的店...",
  "正在分析今日幸運祝壽食品...",
  "正在考慮要不要吃麵線...",
  "正在尋找有豬腳的店...",
  "正在計算今日去霉運次數...",
  "正在評估今日好運...",
];

const PUNISHMENT_MESSAGES = [
  "煩不煩啊！隨便吃啦！",
  "再轉我就把你的瀏覽紀錄傳給老闆！",
  "你是天秤座的嗎？快點決定！",
  "伺服器覺得你很難搞...",
  "再轉我就報警了！",
  "你的選擇困難症已經末期了...",
  "不要再逼我了，我只是個輪盤...",
  "這家店是有多難吃？為什麼一直換？",
  "系統過熱！因為你的猶豫不決！",
  "再轉我就把你的螢幕關掉！",
  "施主，放下執念，回頭是岸...",
  "你是不是其實根本不想吃午餐？",
  "再轉下去，午休時間都要結束了！"
];

const CAT_MESSAGES = [
  "喵？你是認真的嗎？",
  "人類，你的猶豫讓本喵想睡...",
  "隨便吃啦，反正最後都是鏟屎！",
  "再轉我就把你的鍵盤推下去！",
  "本喵覺得你很難搞...",
  "快點決定！我要吃罐罐！",
  "你的選擇困難症治不好了喵...",
  "喵喵喵喵喵！（翻譯：煩死人了！）",
  "看在我的面子上，就吃這家吧？",
  "人類的腦袋真是複雜喵..."
];

const CAT_RUDE_RESPONSES = [
  "北七嗎 這麼兇幹嘛",
  "想打架是嗎?",
  "他喵的是想怎樣",
  "如果一加一等於二的話 那你一定是低能兒",
  "喵喵 喵喵喵 喵喵"
];

const TARGET_DAY_MIN = 1;
const TARGET_DAY_MAX = 5;
const LUNCH_WINDOW_START_MINUTES = 12 * 60;
const LUNCH_WINDOW_END_MINUTES = 13 * 60;

export default function LunchPicker() {
  const navigate = useNavigate();
  
  // 用戶相關
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState(null);
  
  // 餐廳資料（從 Firebase 載入）
  const [currentRestaurants, setCurrentRestaurants] = useState([]);
  const [filters, setFilters] = useState({ price: "", distance: 500 });
  
  // 輪盤相關
  const canvasRef = useRef(null);
  const [startAngle, setStartAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningRestaurant, setWinningRestaurant] = useState(null);
  
  // 惡搞功能狀態
  const [loadingMessage, setLoadingMessage] = useState("COMPUTING...");
  const [runawayBtnStyle, setRunawayBtnStyle] = useState({});
  // const [runawayPos, setRunawayPos] = useState({ x: 0, y: 0 }); // 移除這個狀態

  // 懲罰機制狀態
  const [spinCount, setSpinCount] = useState(0);
  const [isPunishing, setIsPunishing] = useState(false);
  const [punishmentMsg, setPunishmentMsg] = useState('');
  
  // 貓咪狀態
  const [catMode, setCatMode] = useState('hidden'); // 'hidden', 'asking', 'blocking', 'finishing', 'swarm-wait', 'swarm-show'
  const [catMessage, setCatMessage] = useState('');
  const [swarmData, setSwarmData] = useState([]); // 儲存5隻貓咪的資料
  const spinAnimationRef = useRef(null); // 用來控制動畫迴圈

  // 新增功能狀態
  const [currentView, setCurrentView] = useState('main'); // main, manage, history, stats
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [myHistory, setMyHistory] = useState([]);
  const [todayLunches, setTodayLunches] = useState([]);
  const [todayStats, setTodayStats] = useState({});
  
  // 漂浮視窗狀態
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false);
  
  // 地圖狀態管理
  const [openMaps, setOpenMaps] = useState({}); // { restaurantId: boolean }
  const [winnerMapOpen, setWinnerMapOpen] = useState(false);
  
  // 新增餐廳表單
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    price: '$',
    distance: 100,
    address: '',
    weekdayOpen: true,
    timeStart: '11:00',
    timeEnd: '14:00',
    tags: []
  });

  // --- Authentication & Initialization ---
  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 載入餐廳資料
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const restaurantsRef = collection(db, 'artifacts', appId, 'public', 'data', 'restaurants');
    const unsubscribe = onSnapshot(restaurantsRef, async (snapshot) => {
      if (snapshot.empty) {
        // 如果沒有資料，初始化預設餐廳
        console.log('初始化餐廳資料...');
        for (const restaurant of REAL_RESTAURANTS_INITIAL) {
          await addDoc(restaurantsRef, restaurant);
        }
      } else {
        const restaurants = snapshot.docs.map(doc => ({
          firebaseId: doc.id,
          ...doc.data()
        }));
        setCurrentRestaurants(restaurants);
      }
    });
    
    return () => unsubscribe();
  }, [isLoggedIn]);

  // 載入個人歷史紀錄
  useEffect(() => {
    if (!user || !isLoggedIn) return;
    
    const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'lunchHistory', user.uid, 'records');
    const unsubscribe = onSnapshot(historyRef, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      history.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setMyHistory(history);
    });
    
    return () => unsubscribe();
  }, [user, isLoggedIn]);

  // 監聽今日所有用戶的午餐選擇（即時更新）
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayRef = collection(db, 'artifacts', appId, 'public', 'data', 'todayLunches', today, 'selections');
    
    const unsubscribe = onSnapshot(todayRef, (snapshot) => {
      const lunches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTodayLunches(lunches);
      
      // 計算統計
      const stats = {};
      lunches.forEach(lunch => {
        const restaurantName = lunch.restaurantName;
        if (stats[restaurantName]) {
          stats[restaurantName].count++;
          stats[restaurantName].users.push(lunch.username);
        } else {
          stats[restaurantName] = {
            count: 1,
            users: [lunch.username],
            restaurant: lunch.restaurant
          };
        }
      });
      setTodayStats(stats);
    });
    
    return () => unsubscribe();
  }, [isLoggedIn]);

  // 處理登入
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !user || isLoggingIn) return;
    
    setIsLoggingIn(true);
    
    try {
      // 將用戶資料儲存到 Firebase（與滷味系統共用路徑）
      // 注意：同一瀏覽器的匿名登入會共用同一個 UID
      // 如果想要不同的用戶，請使用不同的瀏覽器或無痕模式
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await setDoc(userRef, {
        username: username.trim(),
        lastLogin: serverTimestamp(),
        userId: user.uid
      }, { merge: true });
      
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Login error:", err);
      setToast({ message: "登入失敗，請重試", type: "error" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 工具函式
  const getCurrentTimeStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentMinutes = hour * 60 + minute;
    const isWeekday = day >= TARGET_DAY_MIN && day <= TARGET_DAY_MAX;
    const isLunchTimeWindow = isWeekday && currentMinutes >= LUNCH_WINDOW_START_MINUTES && currentMinutes < LUNCH_WINDOW_END_MINUTES;
    
    return {
      isLunchTimeWindow,
      day,
      timeString: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    };
  };

  const isRestaurantOpenForLunch = (restaurant) => {
    if (!restaurant.weekdayOpen) return false;
    const [startHour, startMin] = restaurant.timeStart.split(':').map(Number);
    const [endHour, endMin] = restaurant.timeEnd.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const { day } = getCurrentTimeStatus();
    
    if (day < TARGET_DAY_MIN || day > TARGET_DAY_MAX) return false;
    return startMinutes < LUNCH_WINDOW_END_MINUTES && endMinutes > LUNCH_WINDOW_START_MINUTES;
  };

  const getPriceColor = (price) => {
    switch (price) {
      case "$": return "text-sky-600";
      case "$$": return "text-blue-600";
      case "$$$": return "text-purple-600";
      default: return "text-slate-600";
    }
  };

  const formatDistance = (distance) => {
    if (distance >= 1000) return `${(distance / 1000).toFixed(1)}km`;
    return `${distance}m`;
  };

  // 切換地圖顯示狀態
  const toggleMap = (restaurantId) => {
    setOpenMaps(prev => ({
      ...prev,
      [restaurantId]: !prev[restaurantId]
    }));
  };

  // 建立 Google Maps URL
  const getMapUrl = (restaurantName, address) => {
    const query = `${restaurantName}, ${address}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&t=m&output=embed`;
  };

  // 篩選餐廳
  const filteredRestaurants = useMemo(() => {
    const validLunchRestaurants = currentRestaurants.filter(r => isRestaurantOpenForLunch(r));
    return validLunchRestaurants.filter(restaurant => {
      const priceMatch = filters.price === "" || restaurant.price === filters.price;
      const distanceMatch = restaurant.distance <= filters.distance;
      return priceMatch && distanceMatch;
    });
  }, [currentRestaurants, filters]);

  // 輪盤繪製 - 添加 currentView 依賴，確保切換回主頁面時重繪
  useEffect(() => {
    if (currentView === 'main' && canvasRef.current) {
      drawRouletteWheel(filteredRestaurants);
    }
  }, [filteredRestaurants, startAngle, currentView]);

  const drawRouletteWheel = (options) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const size = window.innerWidth <= 640 ? 250 : 300;
    canvas.width = size;
    canvas.height = size;

    const outsideRadius = size / 2 - 5;
    const textRadius = size / 2 - 30;
    const insideRadius = size / 2 - 100;
    
    ctx.clearRect(0, 0, size, size);
    
    if (options.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("無符合條件餐廳", size/2, size/2);
      drawPointer(size, outsideRadius, ctx);
      return;
    }

    const arc = 2 * Math.PI / options.length;
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    const rotationOffset = Math.PI;

    options.forEach((restaurant, i) => {
      const angle = startAngle + i * arc + rotationOffset;
      ctx.fillStyle = COLORS[i % COLORS.length];

      ctx.beginPath();
      ctx.arc(size/2, size/2, outsideRadius, angle, angle + arc, false);
      ctx.arc(size/2, size/2, insideRadius, angle + arc, angle, true);
      ctx.stroke();
      ctx.fill();

      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 2;
      
      const textX = size/2 + Math.cos(angle + arc / 2) * textRadius;
      const textY = size/2 + Math.sin(angle + arc / 2) * textRadius;
      
      ctx.translate(textX, textY);
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(restaurant.name.charAt(0), 0, 8);
      ctx.restore();
    });

    drawPointer(size, outsideRadius, ctx);
    
    ctx.beginPath();
    ctx.arc(size/2, size/2, insideRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#94a3b8";
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(size/2, size/2, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#facc15";
    ctx.fill();
  };

  const drawPointer = (size, outsideRadius, ctx) => {
    ctx.save();
    ctx.fillStyle = "#facc15";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2 - outsideRadius - 5);
    ctx.lineTo(size / 2 + 10, size / 2 - outsideRadius + 10);
    ctx.lineTo(size / 2 - 10, size / 2 - outsideRadius + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const spinWheel = async () => {
    if (isSpinning || filteredRestaurants.length === 0 || isPunishing || catMode !== 'hidden') return;

    // 貓咪亂入檢查：第 3 次轉動時觸發
    if (spinCount === 2) {
      const randomMsg = CAT_MESSAGES[Math.floor(Math.random() * CAT_MESSAGES.length)];
      setCatMessage(randomMsg);
      setCatMode('asking');
      setIsSpinning(true);
      setWinningRestaurant(null);
      setRunawayBtnStyle({});
      setSpinCount(prev => prev + 1);
      
      // 啟動無限旋轉
      startInfiniteSpin();
      return;
    }

    // 懲罰機制檢查：連續轉超過 5 次
    if (spinCount >= 5) {
      const randomMsg = PUNISHMENT_MESSAGES[Math.floor(Math.random() * PUNISHMENT_MESSAGES.length)];
      setPunishmentMsg(randomMsg);
      setIsPunishing(true);
      setSpinCount(0); // 重置計數

      // 5秒後解除懲罰
      setTimeout(() => {
        setIsPunishing(false);
      }, 5000);
      return;
    }

    setSpinCount(prev => prev + 1);
    startNormalSpin();
  };

  // 無限旋轉（等待貓咪互動）
  const startInfiniteSpin = () => {
    let currentAngle = startAngle;
    const speed = 0.3; // 固定速度

    const animate = () => {
      currentAngle += speed;
      setStartAngle(currentAngle % (2 * Math.PI));
      spinAnimationRef.current = requestAnimationFrame(animate);
    };
    spinAnimationRef.current = requestAnimationFrame(animate);
  };

  // 正常旋轉流程
  const startNormalSpin = async () => {
    if (filteredRestaurants.length === 1) {
      const winner = filteredRestaurants[0];
      setWinningRestaurant(winner);
      await saveWinningRestaurant(winner);
      return;
    }

    setIsSpinning(true);
    setWinningRestaurant(null);
    setRunawayBtnStyle({});

    // 啟動惡搞訊息循環
    const messageInterval = setInterval(() => {
      setLoadingMessage(FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)]);
    }, 800);

    finishSpin(startAngle, messageInterval);
  };

  // 結束旋轉（減速並選出贏家）
  const finishSpin = (currentStartAngle, messageIntervalToClear = null) => {
    // 如果沒有傳入 interval，就自己開一個新的（為了保持一致性，雖然可能不需要）
    let msgInterval = messageIntervalToClear;
    if (!msgInterval) {
       msgInterval = setInterval(() => {
        setLoadingMessage(FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)]);
      }, 800);
    }

    const winningIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const arc = 2 * Math.PI / filteredRestaurants.length;
    const pointerAngle = 3 * Math.PI / 2;
    const winnerCenterAngle = winningIndex * arc + arc / 2;
    const winnerCenterDrawAngle = winnerCenterAngle + Math.PI;
    let rotationNeeded = pointerAngle - winnerCenterDrawAngle;
    rotationNeeded = (rotationNeeded % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
    
    // 確保至少轉 3 圈，並且從當前角度平滑接續
    // currentStartAngle 是目前的角度 (0 ~ 2PI)
    // 我們要轉到 targetAngle
    
    const fullRotations = 3 * 2 * Math.PI;
    // 計算目標角度：當前角度 + 至少3圈 + 補足到贏家角度的差值
    // 這裡簡化計算：直接重設動畫起點為 0 (視覺上會跳一下，但因為在轉動中可能還好)
    // 為了平滑，我們應該基於 currentStartAngle 計算
    
    // 簡單做法：直接用之前的邏輯，但是起始角度設為 currentStartAngle
    // 這樣 easeOut 會從 currentStartAngle 開始算
    // 但 easeOut 公式是 0 -> 1，所以我們要算 delta
    
    const targetDelta = fullRotations + rotationNeeded;
    const randomOffset = (Math.random() * arc / 3) - (arc / 6);
    const totalRotation = targetDelta + randomOffset;
    
    const duration = 4000;
    const startTime = Date.now();
    const initialAngle = currentStartAngle;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        if (msgInterval) clearInterval(msgInterval);
        setStartAngle(initialAngle + totalRotation);
        const winner = filteredRestaurants[winningIndex];
        setWinningRestaurant(winner);
        setIsSpinning(false);
        saveWinningRestaurant(winner);
        // 不清理貓咪狀態，讓貓咪軍團永久存在
        return;
      }
      
      const progress = elapsed / duration;
      const easeOut = ((-Math.cos(progress * Math.PI) / 2) + 0.5);
      setStartAngle(initialAngle + (easeOut * totalRotation));
      requestAnimationFrame(animate);
    };

    // 取消之前的無限迴圈
    if (spinAnimationRef.current) cancelAnimationFrame(spinAnimationRef.current);
    animate();
  };

  // 處理貓咪回應
  const handleCatResponse = React.useCallback((type) => {
    if (type === 'rude') {
      // 1. 先讓原本的貓咪滑走 (消失)
      setCatMode('finishing');
      
      // 2. 等待滑走後，準備 5 隻貓咪
      setTimeout(() => {
        // 隨機打亂罵人的話，確保每隻貓咪的話都不同
        const shuffledMsgs = [...CAT_RUDE_RESPONSES].sort(() => 0.5 - Math.random()).slice(0, 5);
        
        // 生成隨機位置和入場方向
        const newSwarm = Array(5).fill(0).map((_, i) => {
          // 隨機生成起始方向 (上下左右)
          const directions = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
          const randomDir = directions[Math.floor(Math.random() * directions.length)];
          
          return {
            id: i,
            msg: shuffledMsgs[i],
            direction: randomDir,
            visible: false, // 初始都不可見
            // 隨機最終位置 (靠近中心，但有點亂)
            offsetX: (Math.random() - 0.5) * 400, // -200px ~ 200px
            offsetY: (Math.random() - 0.5) * 300, // -150px ~ 150px
            rotation: (Math.random() - 0.5) * 30, // -15deg ~ 15deg
            scale: 1.0 + Math.random() * 0.3, // 1.0 ~ 1.3
          };
        });
        
        setSwarmData(newSwarm);
        setCatMode('swarm-wait');

        // 3. 依序讓貓咪出現 (每隻間隔 800ms)
        newSwarm.forEach((cat, index) => {
          setTimeout(() => {
            setSwarmData(prev => 
              prev.map(c => c.id === cat.id ? { ...c, visible: true } : c)
            );
          }, index * 800);
        });

        // 4. 全部出現後，讓輪盤開始減速（但不停止）
        setTimeout(() => {
          // 不清除貓咪軍團，讓它們永久存在
          // 也不調用 finishSpin，讓輪盤繼續無限旋轉
          // 但可以減慢旋轉速度
          if (spinAnimationRef.current) {
            // 可以在這裡減慢速度，但不停止
            // 由於 startInfiniteSpin 已經在跑，我們不需要做什麼
          }
        }, 5000);
      }, 1000); // 等待 1秒讓滑出動畫完成
    } else {
      // 是的喵喵大人 -> 貓咪離開，結束旋轉
      setCatMode('finishing');
      setTimeout(() => {
          finishSpin(startAngle);
          // 重置貓咪狀態，讓下次可以繼續轉
          setTimeout(() => {
            setCatMode('hidden');
          }, 500);
      }, 1000);
    }
  }, [startAngle]);

  // 惡搞：逃跑按鈕

  // 惡搞：逃跑按鈕
  const handleRunawayHover = (e) => {
    // 取得按鈕當前的 DOM 元素
    const btn = e.target.getBoundingClientRect();
    const btnWidth = btn.width;
    const btnHeight = btn.height;
    
    // 取得滑鼠位置 (相對於視窗)
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // 視窗大小
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 限制移動範圍在視窗內，並保留一些邊距
    const padding = 20;
    const minX = padding;
    const maxX = windowWidth - btnWidth - padding;
    const minY = padding;
    const maxY = windowHeight - btnHeight - padding;
    
    let newX, newY;
    let attempts = 0;
    
    // 嘗試找到一個合適的新位置
    do {
      // 隨機生成新位置 (絕對座標)
      // 這裡我們不使用 transform translate 的相對位移，而是改用 fixed positioning 的絕對位移
      // 這樣比較好控制在視窗內
      
      // 策略：有時候跑遠一點，有時候跑近一點
      const isCloseJump = Math.random() > 0.3; // 70% 機率跑近一點
      
      if (isCloseJump) {
        // 跑近一點：在目前位置附近隨機移動，但要避開滑鼠
        const jumpRange = 150; // 短距離跳躍範圍
        const currentBtnX = btn.left;
        const currentBtnY = btn.top;
        
        const offsetX = (Math.random() - 0.5) * 2 * jumpRange;
        const offsetY = (Math.random() - 0.5) * 2 * jumpRange;
        
        newX = Math.max(minX, Math.min(maxX, currentBtnX + offsetX));
        newY = Math.max(minY, Math.min(maxY, currentBtnY + offsetY));
      } else {
        // 跑遠一點：在整個視窗內隨機
        newX = Math.random() * (maxX - minX) + minX;
        newY = Math.random() * (maxY - minY) + minY;
      }
      
      // 檢查新位置是否會跟滑鼠重疊 (給予一個安全半徑)
      const safeRadius = 100; // 滑鼠周圍 100px 內不落腳
      const btnCenterX = newX + btnWidth / 2;
      const btnCenterY = newY + btnHeight / 2;
      const distToMouse = Math.sqrt(Math.pow(btnCenterX - mouseX, 2) + Math.pow(btnCenterY - mouseY, 2));
      
      if (distToMouse > safeRadius) break;
      
      attempts++;
    } while (attempts < 10); // 嘗試 10 次，如果都失敗就用最後一次的結果
    
    // 如果嘗試多次都失敗（極端情況），強制移動到滑鼠對角線位置
    if (attempts >= 10) {
        newX = mouseX < windowWidth / 2 ? windowWidth - btnWidth - padding : padding;
        newY = mouseY < windowHeight / 2 ? windowHeight - btnHeight - padding : padding;
    }

    setRunawayBtnStyle({
      position: 'fixed', // 改用 fixed 定位以確保在視窗內
      left: `${newX}px`,
      top: `${newY}px`,
      transition: 'all 0.2s ease-out', // 平滑移動
      zIndex: 9999, // 確保在最上層
      transform: 'none' // 清除之前的 transform
    });
  };

  // 儲存中獎餐廳到 Firebase
  const saveWinningRestaurant = async (restaurant) => {
    if (!user || !username) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 儲存到個人歷史
      const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'lunchHistory', user.uid, 'records');
      await addDoc(historyRef, {
        restaurantName: restaurant.name,
        restaurant: restaurant,
        timestamp: serverTimestamp(),
        date: today,
        userId: user.uid,
        username: username
      });
      
      // 儲存到今日選擇（供其他人查看）
      const todayRef = doc(db, 'artifacts', appId, 'public', 'data', 'todayLunches', today, 'selections', user.uid);
      await setDoc(todayRef, {
        restaurantName: restaurant.name,
        restaurant: restaurant,
        timestamp: serverTimestamp(),
        userId: user.uid,
        username: username
      });
      
      setToast({ message: `🎉 恭喜！今天吃 ${restaurant.name}！`, type: 'success' });
    } catch (err) {
      console.error('儲存失敗:', err);
      setToast({ message: '儲存失敗，請重試', type: 'error' });
    }
  };

  // 新增餐廳
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    
    if (!newRestaurant.name.trim()) {
      setToast({ message: '請輸入餐廳名稱', type: 'error' });
      return;
    }
    
    try {
      const restaurantsRef = collection(db, 'artifacts', appId, 'public', 'data', 'restaurants');
      await addDoc(restaurantsRef, {
        ...newRestaurant,
        id: Date.now(), // 臨時 ID
        createdAt: serverTimestamp(),
        createdBy: username
      });
      
      setToast({ message: '✅ 餐廳新增成功！', type: 'success' });
      setShowAddRestaurant(false);
      setNewRestaurant({
        name: '',
        price: '$',
        distance: 100,
        address: '',
        weekdayOpen: true,
        timeStart: '11:00',
        timeEnd: '14:00',
        tags: []
      });
    } catch (err) {
      console.error('新增失敗:', err);
      setToast({ message: '新增失敗，請重試', type: 'error' });
    }
  };

  // 刪除餐廳
  const handleDeleteRestaurant = async (firebaseId) => {
    if (!window.confirm('確定要刪除這間餐廳嗎？')) return;
    
    try {
      const restaurantRef = doc(db, 'artifacts', appId, 'public', 'data', 'restaurants', firebaseId);
      await deleteDoc(restaurantRef);
      setToast({ message: '✅ 餐廳已刪除', type: 'success' });
    } catch (err) {
      console.error('刪除失敗:', err);
      setToast({ message: '刪除失敗，請重試', type: 'error' });
    }
  };

  const { isLunchTimeWindow, day, timeString } = getCurrentTimeStatus();
  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

  // --- 登入畫面 ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border-t-4 border-blue-600">
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            返回首頁
          </button>
          
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-blue-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">午餐吃什麼</h1>
            <p className="text-gray-500 mt-2">選擇困難症的救星！</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">請問怎麼稱呼？</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="輸入姓名 (例: 王小明)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                * 與阿嬌滷味共用帳號，同一瀏覽器會共用同一個帳號<br/>
                * 若要使用不同帳號，請使用無痕模式或其他瀏覽器
              </p>
            </div>
            <button
              type="submit"
              disabled={!user || isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? '登入中...' : (user ? '開始選擇' : '載入中...')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-8 ${isPunishing ? 'shake-screen overflow-hidden' : ''}`}>
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .shake-screen {
          animation: shake 0.5s;
          animation-iteration-count: infinite;
        }
        @keyframes slideInCat {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        @keyframes slideOutCat {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .cat-enter {
          animation: slideInCat 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .cat-exit {
          animation: slideOutCat 0.5s ease-in forwards;
        }
        .cat-optimized {
          will-change: transform, opacity;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }
      `}</style>

      {/* 貓咪亂入 Overlay */}
      {catMode !== 'hidden' && (
        <>
          {/* 單隻貓咪 (Asking / Finishing) */}
          {['asking', 'finishing', 'blocking'].includes(catMode) && (
            <div className={`fixed z-[10000] transition-all duration-1000 ease-in-out ${
                catMode === 'blocking' 
                ? 'left-1/2 bottom-1/2 -translate-x-1/2 translate-y-1/2'
                : catMode === 'finishing' 
                    ? '-left-[600px] -bottom-[600px]' 
                    : 'left-0 bottom-0 cat-enter'
            }`}>
                <div className="relative flex flex-col items-center">
                {/* 對話框 */}
                <div className={`absolute -top-32 left-1/2 -translate-x-1/2 p-6 rounded-2xl shadow-xl border-2 w-72 z-20 transition-all duration-300 ${
                    catMode === 'blocking' ? 'bg-white border-red-500' : 'bg-white border-slate-200'
                }`}>
                    <p className={`font-bold text-lg text-center leading-relaxed ${
                        catMode === 'blocking' ? 'text-red-600' : 'text-slate-700'
                    }`}>{catMessage}</p>
                    {/* 對話框箭頭 */}
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 border-b-2 border-r-2 transform rotate-45 translate-y-2.5 bg-white ${
                        catMode === 'blocking' ? 'border-red-500' : 'border-slate-200'
                    }`}></div>
                </div>
                
                {/* 貓咪 GIF */}
                <img 
                    src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzk0bzNmcHp3MzYycGZzMThuMnl3MnQ2YXlsemJoNTk4b29zODFyOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/tR1ZZeJXR9RUDvaFVP/giphy.gif" 
                    alt="Judging Cat" 
                    className={`relative z-10 h-auto drop-shadow-2xl transition-all duration-300 w-[400px] sm:w-[450px]`}
                />
                </div>
            </div>
          )}

          {/* 貓咪軍團 (Swarm) */}
          {catMode === 'swarm-wait' && (
            <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden">
                {swarmData.map((cat) => {
                    // 根據方向決定起始位置
                    let startPos = '';
                    switch(cat.direction) {
                        case 'top':
                            startPos = 'left-1/2 -top-[600px] -translate-x-1/2';
                            break;
                        case 'bottom':
                            startPos = 'left-1/2 -bottom-[600px] -translate-x-1/2';
                            break;
                        case 'left':
                            startPos = '-left-[600px] top-1/2 -translate-y-1/2';
                            break;
                        case 'right':
                            startPos = '-right-[600px] top-1/2 -translate-y-1/2';
                            break;
                        case 'top-left':
                            startPos = '-left-[600px] -top-[600px]';
                            break;
                        case 'top-right':
                            startPos = '-right-[600px] -top-[600px]';
                            break;
                        case 'bottom-left':
                            startPos = '-left-[600px] -bottom-[600px]';
                            break;
                        case 'bottom-right':
                            startPos = '-right-[600px] -bottom-[600px]';
                            break;
                        default:
                            startPos = 'left-1/2 -top-[600px]';
                    }
                    
                    // 最終位置：靠近中心但有隨機偏移
                    const finalStyle = cat.visible ? {
                        left: `calc(50% + ${cat.offsetX}px)`,
                        top: `calc(50% + ${cat.offsetY}px)`,
                        transform: `translate(-50%, -50%) rotate(${cat.rotation}deg) scale(${cat.scale})`,
                        opacity: 1,
                    } : {};

                    return (
                        <div 
                            key={cat.id}
                            className={`absolute transition-all duration-1000 ease-out opacity-0 cat-optimized ${
                                !cat.visible ? startPos : ''
                            }`}
                            style={finalStyle}
                        >
                            <div className="relative flex flex-col items-center">
                                {/* 對話框 */}
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 p-3 rounded-xl shadow-lg border-2 border-red-500 bg-white w-44 z-20">
                                    <p className="font-bold text-xs text-center text-red-600 leading-tight">{cat.msg}</p>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 border-b-2 border-r-2 border-red-500 bg-white transform rotate-45 translate-y-2"></div>
                                </div>
                                
                                {/* 貓咪 GIF */}
                                <img 
                                    src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzk0bzNmcHp3MzYycGZzMThuMnl3MnQ2YXlsemJoNTk4b29zODFyOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/tR1ZZeJXR9RUDvaFVP/giphy.gif" 
                                    alt="Judging Cat" 
                                    className="relative z-10 h-auto w-[300px]"
                                    loading="eager"
                                    decoding="async"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
          )}

          {/* 回覆區域 (只在詢問模式顯示) */}
          {catMode === 'asking' && (
            <div className="fixed bottom-0 left-0 right-0 bg-gray-700/90 p-6 z-[9999] flex flex-col items-center justify-center animate-bounce-in">
              <p className="text-white mb-4 font-bold text-lg">貓咪嫌你轉太多次了</p>
              <div className="flex gap-4 w-full max-w-md">
                <button 
                  onClick={() => handleCatResponse('rude')}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
                >
                  關你屁事
                </button>
                <button 
                  onClick={() => handleCatResponse('polite')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
                >
                  好的貓咪 我會趕快決定的
                </button>
              </div>
            </div>
          )}
          
          {/* 遮罩 (Blocking 模式用) - 已移除背景色 */}
          {catMode === 'blocking' && (
            <div className="fixed inset-0 z-[9997]"></div>
          )}
        </>
      )}

      {/* 懲罰機制 Overlay */}
      {isPunishing && (
        <div className="fixed inset-0 z-[9999] bg-red-600/95 flex flex-col items-center justify-center text-white animate-pulse cursor-not-allowed">
            <AlertCircle className="w-32 h-32 mb-8 animate-bounce" />
            <h1 className="text-5xl font-black mb-6 text-center tracking-widest drop-shadow-lg">警告！</h1>
            <p className="text-3xl font-bold text-center px-4 mb-8 drop-shadow-md">{punishmentMsg}</p>
            <div className="w-64 h-2 bg-red-800 rounded-full overflow-hidden">
              <div className="h-full bg-white animate-[width_5s_linear_forwards]" style={{width: '0%'}}></div>
            </div>
            <p className="mt-4 text-xl opacity-75 font-mono">SYSTEM_LOCKDOWN: 5s</p>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* 新增餐廳 Modal */}
      {showAddRestaurant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">新增餐廳</h3>
              <button onClick={() => setShowAddRestaurant(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddRestaurant} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">餐廳名稱 *</label>
                  <input
                    type="text"
                    value={newRestaurant.name}
                    onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">價格區間</label>
                  <select
                    value={newRestaurant.price}
                    onChange={(e) => setNewRestaurant({...newRestaurant, price: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="$">$ (實惠)</option>
                    <option value="$$">$$ (中等)</option>
                    <option value="$$$">$$$ (高級)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">距離 (公尺)</label>
                  <input
                    type="number"
                    value={newRestaurant.distance}
                    onChange={(e) => setNewRestaurant({...newRestaurant, distance: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工作日營業</label>
                  <select
                    value={newRestaurant.weekdayOpen}
                    onChange={(e) => setNewRestaurant({...newRestaurant, weekdayOpen: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">是</option>
                    <option value="false">否</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">營業開始</label>
                  <input
                    type="time"
                    value={newRestaurant.timeStart}
                    onChange={(e) => setNewRestaurant({...newRestaurant, timeStart: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">營業結束</label>
                  <input
                    type="time"
                    value={newRestaurant.timeEnd}
                    onChange={(e) => setNewRestaurant({...newRestaurant, timeEnd: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input
                  type="text"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-bold"
                >
                  新增餐廳
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRestaurant(false)}
                  className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-bold"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-10 border border-slate-200">
        {/* 頂部導覽 */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            返回首頁
          </button>
          
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-600" />
            <span className="text-slate-600">Hi, <span className="font-bold text-blue-600">{username}</span></span>
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setUsername('');
              }}
              className="ml-2 text-xs text-slate-500 hover:text-slate-700 underline"
            >
              登出
            </button>
          </div>
        </div>
        
        {/* 功能按鈕列 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCurrentView('main')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              currentView === 'main' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            輪盤
          </button>
          
          <button
            onClick={() => setCurrentView('manage')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              currentView === 'manage' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
            管理餐廳
          </button>
          
          <button
            onClick={() => setCurrentView('history')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              currentView === 'history' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <History className="w-4 h-4" />
            我的紀錄
            {myHistory.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {myHistory.length}
              </span>
            )}
          </button>
        </div>
        
        {/* 漂浮統計按鈕 - 固定在左上角 */}
        {!isFloatingMinimized ? (
          <div className="fixed top-4 left-4 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 w-80 max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center sticky top-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-bold">今日即時統計</h3>
              </div>
              <button
                onClick={() => setIsFloatingMinimized(true)}
                className="hover:bg-white/20 p-1 rounded transition"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 max-h-[calc(80vh-60px)] overflow-y-auto">
              {/* 今日動態 */}
              <div className="mb-6">
                <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  今日動態 ({todayLunches.length})
                </h4>
                {todayLunches.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">還沒有人轉過輪盤</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {todayLunches.slice(0, 5).map(lunch => (
                      <div key={lunch.id} className="bg-slate-50 p-2 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {lunch.username}
                              {lunch.userId === user?.uid && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">我</span>}
                            </p>
                            <p className="text-slate-600 truncate">{lunch.restaurantName}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {todayLunches.length > 5 && (
                      <p className="text-xs text-slate-400 text-center py-1">還有 {todayLunches.length - 5} 筆...</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* 今日統計 */}
              <div>
                <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  餐廳排行
                </h4>
                {Object.keys(todayStats).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">還沒有統計數據</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(todayStats)
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 5)
                      .map(([restaurantName, data], index) => (
                        <div key={restaurantName} className="bg-slate-50 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-slate-800 truncate">{restaurantName}</p>
                              <p className="text-xs text-slate-500">{data.count} 人選擇</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsFloatingMinimized(false)}
            className="fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-110"
            title="查看今日統計"
          >
            <TrendingUp className="w-6 h-6" />
            {todayLunches.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {todayLunches.length}
              </span>
            )}
          </button>
        )}
        
        {/* 標題 */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 pb-1 border-b-2 border-blue-500 inline-block">
          午餐吃什麼(･ω´･ )
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 mt-2">
          <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600">CLOUD_SYNC</span> 雲端同步 / 青島東路七號附近
        </p>

        {/* 狀態訊息 */}
        <div className={`mb-6 p-4 rounded-lg text-sm transition-all duration-300 border-l-4 shadow-sm ${
          isLunchTimeWindow ? 'bg-green-50 border-green-400 text-green-700' :
          (day >= TARGET_DAY_MIN && day <= TARGET_DAY_MAX) ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
          'bg-indigo-50 border-indigo-400 text-indigo-700'
        }`}>
          {isLunchTimeWindow ? (
            <span className="font-bold">【現在是午餐決策時間！】現在時間是 {timeString}，趕快來決定要吃什麼吧！</span>
          ) : (day >= TARGET_DAY_MIN && day <= TARGET_DAY_MAX) ? (
            <span className="font-bold">今日工作日 (週{dayNames[day]})。現在時間是 {timeString}，午餐決策時間在 12:00 ~ 13:00。</span>
          ) : (
            <span className="font-bold">今日是週末 (週{dayNames[day]})。現在時間是 {timeString}，系統假設午餐時間在 12:00 ~ 13:00。</span>
          )}
        </div>

        {/* === 主要輪盤視圖 === */}
        {currentView === 'main' && (
          <>
        {/* 篩選器 */}
        <div className="space-y-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center">
            <Filter className="w-4 h-4 mr-2" /> 篩選參數設定
          </h2>

          {/* 價格 */}
          <div>
            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">價格預算</label>
            <div className="flex flex-wrap gap-3">
              {['', '$', '$$', '$$$'].map(price => (
                <button
                  key={price || 'all'}
                  onClick={() => setFilters(f => ({ ...f, price }))}
                  className={`py-2 px-4 rounded transition-all duration-200 border ${
                    filters.price === price
                      ? 'bg-blue-600 text-white shadow-md border-blue-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {price || '不限'} {price && `(${price === '$' ? '實惠' : price === '$$' ? '中等' : '高級'})`}
                </button>
              ))}
            </div>
          </div>

          {/* 距離 */}
          <div>
            <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">距離半徑</label>
            <div className="flex flex-wrap gap-3">
              {[100, 300, 700, 1000, 2000].map(distance => (
                <button
                  key={distance}
                  onClick={() => setFilters(f => ({ ...f, distance }))}
                  className={`py-2 px-4 rounded transition-all duration-200 border ${
                    filters.distance === distance
                      ? 'bg-blue-600 text-white shadow-md border-blue-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {distance === 2000 ? '不限' : distance >= 1000 ? `${distance/1000}km` : `${distance}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 輪盤 */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>

          <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center justify-center border-b border-slate-200 pb-4">
            <Compass className="w-5 h-5 mr-2 text-blue-500" /> 隨機決策引擎 (Randomizer)
          </h2>
          
          <div className="flex flex-col items-center space-y-6">
            <canvas 
              ref={canvasRef}
              width="300" 
              height="300" 
              className="rounded-full shadow-2xl border-4 border-slate-300 bg-white"
            />
            
            <button 
              onClick={spinWheel}
              disabled={isSpinning || filteredRestaurants.length === 0}
              className="bg-cyan-500 text-slate-900 font-bold py-3 px-10 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] transition duration-150 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Play className="w-4 h-4 mr-2 fill-current" /> 啟動抽籤
            </button>
            
            <div className="min-h-[6rem] flex flex-col items-center justify-center bg-slate-50 p-4 rounded-lg border border-cyan-300 w-full max-w-sm text-center shadow-inner">
              {isSpinning ? (
                <>
                  <p className="text-lg font-bold text-slate-500 uppercase tracking-wider animate-pulse">{loadingMessage}</p>
                  <Loader className="w-8 h-8 text-blue-500 mt-2 animate-spin" />
                </>
              ) : winningRestaurant ? (
                <>
                  <p className="text-lg font-bold text-slate-500 uppercase tracking-wider">Decision Made</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 animate-pulse mt-1">{winningRestaurant.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{winningRestaurant.address}</p>
                  
                  <div className="flex gap-2 mt-4">
                    {/* 地圖按鈕 */}
                    <button
                      onClick={() => setWinnerMapOpen(!winnerMapOpen)}
                      className="flex items-center justify-center text-white bg-blue-600 border border-blue-700 hover:bg-blue-700 py-2 px-5 rounded-lg transition duration-150 shadow-md text-sm font-bold"
                    >
                      <span className="mr-1">{winnerMapOpen ? '隱藏地圖' : '查看地圖'}</span>
                      <MapPin className="w-4 h-4" />
                    </button>

                    {/* 惡搞：逃跑按鈕 */}
                    <button
                      onMouseEnter={handleRunawayHover}
                      style={runawayBtnStyle}
                      className="flex items-center justify-center text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 py-2 px-5 rounded-lg transition duration-150 shadow-md text-sm font-bold"
                    >
                      <span className="mr-1">點擊領取優惠券</span>
                    </button>
                  </div>
                  
                  {/* 地圖容器 */}
                  {winnerMapOpen && (
                    <div className="w-full mt-4 rounded-lg overflow-hidden border border-slate-300" style={{ height: '200px' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={getMapUrl(winningRestaurant.name, winningRestaurant.address)}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-400 uppercase tracking-wider">Ready for Execution</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-slate-600 mt-1">---</p>
                  <p className="text-sm text-slate-500 mt-1">請選擇篩選條件</p>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6 text-center font-mono">
            * SYSTEM: 輪盤項目基於上方篩選結果自動同步。
          </p>
        </div>

        {/* 結果列表 */}
        <div className="mt-10">
          <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <List className="w-5 h-5 mr-2 text-slate-400" /> 搜尋結果
            </h2>
            <span className="text-sm text-slate-500 font-mono">
              Count: <span className="font-bold text-blue-600">{filteredRestaurants.length}</span> / {currentRestaurants.filter(r => isRestaurantOpenForLunch(r)).length}
            </span>
          </div>
          
          <div className="space-y-4">
            {filteredRestaurants.length === 0 ? (
              <div className="p-6 bg-white border border-red-200 text-red-600 rounded-lg text-center font-bold shadow-sm">
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                無符合條件結果。
              </div>
            ) : (
              filteredRestaurants.map(restaurant => (
                <div key={restaurant.id} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm transition duration-200 hover:shadow-md hover:border-blue-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 font-bold flex items-center justify-center mr-3 text-sm">
                          {restaurant.name.charAt(0)}
                        </div>
                        <p className="text-lg font-bold text-slate-800">{restaurant.name}</p>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 ml-11">{restaurant.address}</p>
                      <p className="text-xs text-slate-400 mt-2 ml-11 flex items-center space-x-2">
                        <span>{restaurant.timeStart.substring(0, 5)} - {restaurant.timeEnd.substring(0, 5)}</span>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 py-1 px-2 rounded border border-blue-100">OPEN 12-13</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-md font-bold ${getPriceColor(restaurant.price)}`}>{restaurant.price}</span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 py-1 px-2 rounded">
                          {formatDistance(restaurant.distance)}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleMap(restaurant.id)}
                        className="flex items-center justify-center text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 py-1.5 px-3 rounded-md transition duration-150 shadow-sm group"
                      >
                        <span className="text-xs font-bold mr-1">{openMaps[restaurant.id] ? 'HIDE' : 'MAP'}</span>
                        <MapPin className="w-3 h-3 text-blue-600 group-hover:text-blue-700" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 地圖容器 */}
                  {openMaps[restaurant.id] && (
                    <div className="w-full mt-4 rounded-lg overflow-hidden border border-slate-300" style={{ height: '200px' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={getMapUrl(restaurant.name, restaurant.address)}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        </>
        )}

        {/* === 餐廳管理視圖 === */}
        {currentView === 'manage' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">餐廳管理</h2>
              <button
                onClick={() => setShowAddRestaurant(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold"
              >
                <Plus className="w-4 h-4" />
                新增餐廳
              </button>
            </div>
            
            <div className="space-y-3">
              {currentRestaurants.map(restaurant => (
                <div key={restaurant.firebaseId} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-slate-800">{restaurant.name}</p>
                      <p className="text-sm text-slate-500">{restaurant.address}</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{restaurant.price}</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{formatDistance(restaurant.distance)}</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{restaurant.timeStart} - {restaurant.timeEnd}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMap(restaurant.firebaseId)}
                        className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition"
                        title="查看地圖"
                      >
                        <MapPin className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRestaurant(restaurant.firebaseId)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                        title="刪除餐廳"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 地圖容器 */}
                  {openMaps[restaurant.firebaseId] && (
                    <div className="w-full mt-4 rounded-lg overflow-hidden border border-slate-300" style={{ height: '250px' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={getMapUrl(restaurant.name, restaurant.address)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === 我的紀錄視圖 === */}
        {currentView === 'history' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">我的午餐紀錄</h2>
            
            {myHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>還沒有紀錄喔，快去轉輪盤吧！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myHistory.map(record => (
                  <div key={record.id} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-blue-600">{record.restaurantName}</p>
                        <p className="text-sm text-slate-500">{record.restaurant?.address}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {record.timestamp?.toDate ? new Date(record.timestamp.toDate()).toLocaleString('zh-TW') : record.date}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm font-bold text-slate-600">{record.restaurant?.price}</span>
                        {record.restaurant?.address && (
                          <button
                            onClick={() => toggleMap(record.id)}
                            className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition"
                            title="查看地圖"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* 地圖容器 */}
                    {openMaps[record.id] && record.restaurant?.address && (
                      <div className="w-full mt-4 rounded-lg overflow-hidden border border-slate-300" style={{ height: '200px' }}>
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={getMapUrl(record.restaurantName, record.restaurant.address)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
