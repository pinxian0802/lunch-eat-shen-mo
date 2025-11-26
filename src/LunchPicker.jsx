import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Filter, List, MapPin, Play, Loader, ChevronUp, AlertCircle, Home, ChefHat, User, Plus, Trash2, History, Users, TrendingUp, X } from 'lucide-react';
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
  getDoc,
  deleteDoc,
  addDoc,
  query,
  where,
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // 輪盤相關
  const canvasRef = useRef(null);
  const [startAngle, setStartAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningRestaurant, setWinningRestaurant] = useState(null);
  
  // 新增功能狀態
  const [currentView, setCurrentView] = useState('main'); // main, manage, history, stats
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [myHistory, setMyHistory] = useState([]);
  const [todayLunches, setTodayLunches] = useState([]);
  const [todayStats, setTodayStats] = useState({});
  
  // 漂浮視窗狀態
  const [showFloatingStats, setShowFloatingStats] = useState(false);
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false);
  
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
    if (isSpinning || filteredRestaurants.length === 0) return;
    if (filteredRestaurants.length === 1) {
      const winner = filteredRestaurants[0];
      setWinningRestaurant(winner);
      await saveWinningRestaurant(winner);
      return;
    }

    setIsSpinning(true);
    setWinningRestaurant(null);

    const winningIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const arc = 2 * Math.PI / filteredRestaurants.length;
    const pointerAngle = 3 * Math.PI / 2;
    const winnerCenterAngle = winningIndex * arc + arc / 2;
    const winnerCenterDrawAngle = winnerCenterAngle + Math.PI;
    let rotationNeeded = pointerAngle - winnerCenterDrawAngle;
    rotationNeeded = (rotationNeeded % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
    const fullRotations = 5 * 2 * Math.PI;
    const randomOffset = (Math.random() * arc / 3) - (arc / 6);
    const finalAngle = fullRotations + rotationNeeded + randomOffset;

    const duration = 5000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        setStartAngle(finalAngle);
        const winner = filteredRestaurants[winningIndex];
        setWinningRestaurant(winner);
        setIsSpinning(false);
        saveWinningRestaurant(winner);
        return;
      }
      
      const progress = elapsed / duration;
      const easeOut = ((-Math.cos(progress * Math.PI) / 2) + 0.5);
      setStartAngle(easeOut * finalAngle);
      requestAnimationFrame(animate);
    };

    animate();
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
    <div className="min-h-screen bg-slate-50 p-3 sm:p-8">
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
                  <p className="text-lg font-bold text-slate-500 uppercase tracking-wider">COMPUTING...</p>
                  <Loader className="w-8 h-8 text-blue-500 mt-2 animate-spin" />
                </>
              ) : winningRestaurant ? (
                <>
                  <p className="text-lg font-bold text-slate-500 uppercase tracking-wider">Decision Made</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 animate-pulse mt-1">{winningRestaurant.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{winningRestaurant.address}</p>
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
                    </div>
                  </div>
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
                <div key={restaurant.firebaseId} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg text-slate-800">{restaurant.name}</p>
                    <p className="text-sm text-slate-500">{restaurant.address}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{restaurant.price}</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{formatDistance(restaurant.distance)}</span>
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{restaurant.timeStart} - {restaurant.timeEnd}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRestaurant(restaurant.firebaseId)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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
                      <div>
                        <p className="font-bold text-lg text-blue-600">{record.restaurantName}</p>
                        <p className="text-sm text-slate-500">{record.restaurant?.address}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {record.timestamp?.toDate ? new Date(record.timestamp.toDate()).toLocaleString('zh-TW') : record.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-600">{record.restaurant?.price}</span>
                      </div>
                    </div>
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
