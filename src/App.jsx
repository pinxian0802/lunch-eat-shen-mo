import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  Utensils, 
  ShoppingCart, 
  History, 
  Shuffle, 
  CheckCircle, 
  ChefHat, 
  DollarSign, 
  ListRestart,
  Loader2,
  X,
  Soup,
  MapPin
} from 'lucide-react';
import LunchPicker from './LunchPicker';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// 設定一個固定的 App ID，用於 Firestore 路徑
const appId = 'aj-luwei-ordering-app'; 

// --- Constants ---
const FREE_NOODLE_THRESHOLD = 70;
const ADMIN_PREFIX = "阿嬌滷味";
const FREE_NOODLE_CHOICES = [
  { name: '烏龍麵', id: 'noodle-udon' },
  { name: '粄條', id: 'noodle-bantiao' },
  { name: '白油麵', id: 'noodle-oil' },
  { name: '麵疙瘩', id: 'noodle-geda' },
];
const CHILI_LEVELS = ['大', '中', '小', '微', '不加'];
const MENU_CATEGORIES = [
  { id: 'Tofu', name: '豆腐/豆類' },
  { id: 'Egg', name: '蛋類' },
  { id: 'Veggie', name: '蔬菜' },
  { id: 'Balls', name: '丸類/特色' },
  { id: 'Meat', name: '肉類/內臟' },
];

// --- Default Menu Data ---
const DEFAULT_MENU = [
  // 豆腐/豆類 (Tofu)
  { id: '1', name: '豆干', price: 10, category: 'Tofu' },
  { id: '2', name: '生豆皮', price: 20, category: 'Tofu' },
  { id: '3', name: '豆皮', price: 20, category: 'Tofu' },
  { id: '6', name: '素雞', price: 15, category: 'Tofu' },
  { id: '7', name: '大豆干', price: 20, category: 'Tofu' },
  { id: '8', name: '花干', price: 20, category: 'Tofu' },
  { id: '13', name: '百頁豆腐', price: 20, category: 'Tofu' },
  { id: '15', name: '麵腸', price: 20, category: 'Tofu' },
  { id: '17', name: '百頁結', price: 10, category: 'Tofu' },
  { id: '20', name: '素肚', price: 25, category: 'Tofu' },
  { id: '38', name: '素腰花', price: 5, category: 'Tofu' },
  
  // 蛋類 (Egg)
  { id: '4', name: '滷蛋', price: 15, category: 'Egg' },
  { id: '16', name: '小鳥蛋', price: 10, category: 'Egg' },

  // 蔬菜 (Veggie)
  { id: '5', name: '海帶', price: 15, category: 'Veggie' },
  { id: '37', name: '杏鮑菇', price: 20, category: 'Veggie' },
  { id: '39', name: '蔬菜請自選', price: 30, category: 'Veggie' },

  // 丸類/特色 (Balls)
  { id: '9', name: '黑輪', price: 10, category: 'Balls' },
  { id: '10', name: '甜不辣', price: 10, category: 'Balls' },
  { id: '11', name: '豬血糕', price: 15, category: 'Balls' },
  { id: '12', name: '花枝丸', price: 10, category: 'Balls' },
  { id: '14', name: '水晶餃', price: 5, category: 'Balls' },
  { id: '18', name: '貢丸', price: 10, category: 'Balls' },
  { id: '19', name: '芋頭糕', price: 20, category: 'Balls' },
  { id: '21', name: '福州丸', price: 15, category: 'Balls' },

  // 肉類/內臟 (Meat)
  { id: '22', name: '雞肝', price: 10, category: 'Meat' },
  { id: '23', name: '雞心', price: 10, category: 'Meat' },
  { id: '24', name: '豬皮', price: 15, category: 'Meat' },
  { id: '25', name: '豬腱子肉', price: 30, category: 'Meat' },
  { id: '26', name: '豬耳朵', price: 30, category: 'Meat' },
  { id: '27', name: '豬頭皮', price: 25, category: 'Meat' },
  { id: '28', name: '豬肝連', price: 30, category: 'Meat' },
  { id: '29', name: '嘴邊肉', price: 30, category: 'Meat' },
  { id: '30', name: '豬舌', price: 30, category: 'Meat' },
  { id: '31', name: '鴨翅', price: 30, category: 'Meat' },
  { id: '32', name: '雞翅', price: 40, category: 'Meat' },
  { id: '33', name: '大雞腳', price: 30, category: 'Meat' },
  { id: '34', name: '小雞腳', price: 15, category: 'Meat' },
  { id: '35', name: '雞腿', price: 90, category: 'Meat' },
  { id: '36', name: '鴨胗', price: 35, category: 'Meat' },
];

// --- Main Component ---
export default function LuweiApp() {
  // Auth & User State
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // App State
  const [view, setView] = useState('login'); // login, menu, history, admin, lunch
  const [menu, setMenu] = useState(DEFAULT_MENU);
  const [cart, setCart] = useState({}); // { itemId: quantity }
  const [budget, setBudget] = useState('');
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomMessage, setRandomMessage] = useState('');

  // UI/Modal State
  const [selectedCategory, setSelectedCategory] = useState(MENU_CATEGORIES[0].id);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [condimentOptions, setCondimentOptions] = useState({
    蔥: true,
    蒜: true,
    酸菜: true,
    辣椒: '微', 
  });
  const [selectedFreeNoodle, setSelectedFreeNoodle] = useState(null); 
  
  // Data State
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);

  // --- 1. Authentication & Initialization (已修改為匿名登入) ---
  useEffect(() => {
    const initAuth = async () => {
      // 在部署環境中，我們直接使用匿名登入
      await signInAnonymously(auth);
    };
    initAuth();
    // 監聽登入狀態的變化，並設置使用者資訊
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 2. Data Listeners ---
  
  // Admin: Listen to ALL orders
  useEffect(() => {
    if (!user || !isAdmin) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by timestamp desc client-side
      loadedOrders.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setOrders(loadedOrders);
    }, (error) => {
      console.error("Error fetching admin orders:", error);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // User: Listen to MY history
  useEffect(() => {
    if (!user || !isLoggedIn || isAdmin) return;
    
    // 雖然是 public/data/orders，但我們透過 userName 來過濾歷史訂單
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'orders');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter for current username
      const myOrders = allOrders.filter(o => o.userName === username);
      myOrders.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setHistoryOrders(myOrders);
    }, (error) => {
      console.error("Error fetching history:", error);
    });

    return () => unsubscribe();
  }, [user, isLoggedIn, isAdmin, username]);


  // --- Logic Functions ---

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    if (username.startsWith(ADMIN_PREFIX)) {
      setIsAdmin(true);
      setView('admin');
    } else {
      setIsAdmin(false);
      setView('menu');
    }
    setIsLoggedIn(true);
  };

  const addToCart = (itemId) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const calculateTotal = (currentCart) => {
    let total = 0;
    Object.entries(currentCart).forEach(([id, qty]) => {
      const item = menu.find(i => i.id === id);
      if (item) total += item.price * qty;
    });
    return total;
  };

  const currentTotal = useMemo(() => calculateTotal(cart), [cart, menu]);
  const isFreeNoodleEligible = currentTotal >= FREE_NOODLE_THRESHOLD;

  const handleShowModal = () => {
    if (currentTotal === 0) return;
    // Reset selected noodle if eligibility changes, or if it was the old one
    if (isFreeNoodleEligible && !selectedFreeNoodle) {
        setSelectedFreeNoodle(FREE_NOODLE_CHOICES[0].id);
    }
    setShowSubmitModal(true);
  };


  const handleFinalSubmit = async () => {
    if (isFreeNoodleEligible && !selectedFreeNoodle) {
        // This should not happen if default is set, but as a safeguard
        alert("請選擇贈送的麵類！");
        return;
    }
    if (!user) return;
    
    // 1. Prepare Order Items
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const item = menu.find(i => i.id === id);
      return { 
        name: item.name, 
        price: item.price, 
        count: qty,
        id: id
      };
    });

    // 2. Add Free Noodle if eligible
    if (isFreeNoodleEligible && selectedFreeNoodle) {
      const freeNoodle = FREE_NOODLE_CHOICES.find(n => n.id === selectedFreeNoodle);
      orderItems.push({
        name: `🎁 贈送: ${freeNoodle?.name || '主食麵'}`,
        price: 0,
        count: 1,
        id: selectedFreeNoodle
      });
    }

    // 3. Prepare Order Data
    const orderData = {
      userName: username,
      items: orderItems,
      total: currentTotal,
      isPaid: false,
      timestamp: serverTimestamp(),
      userId: user.uid,
      condiments: {
        ...condimentOptions,
        蔥: condimentOptions['蔥'] ? '加' : '不加',
        蒜: condimentOptions['蒜'] ? '加' : '不加',
        酸菜: condimentOptions['酸菜'] ? '加' : '不加',
        辣椒: condimentOptions['辣椒'], // e.g., '大', '微', '不加'
      }
    };

    try {
      // 寫入公用訂單集合
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      
      // Reset states
      setCart({});
      setShowSubmitModal(false);
      setSelectedFreeNoodle(null);
      setCondimentOptions({ 蔥: true, 蒜: true, 酸菜: true, 辣椒: '微' });

      alert("✅ 點餐成功！老闆娘收到囉！");
      setView('history');
    } catch (err) {
      console.error(err);
      alert("❌ 點餐失敗，請重試");
    }
  };

  const togglePaymentStatus = async (orderId, currentStatus) => {
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      await updateDoc(ref, { isPaid: !currentStatus });
    } catch (err) {
      console.error("Error updating payment:", err);
    }
  };

  const reOrder = (oldItems) => {
    const newCart = {};
    oldItems.forEach(item => {
      // Re-order logic should ignore gifted items and condiments
      if (!item.name.includes('贈送') && item.price !== 0) { 
        newCart[item.id] = item.count;
      }
    });
    setCart(newCart);
    setView('menu');
  };

  const handleRandomize = useCallback(() => {
    const budgetNum = parseInt(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert("請輸入有效的金額！");
      return;
    }

    setIsRandomizing(true);
    setRandomMessage("老闆娘正在精算中...");
    
    setTimeout(() => {
      setRandomMessage("正在偷看廚房剩什麼...");
    }, 800);

    setTimeout(() => {
      generateRandomCombo(budgetNum);
      setIsRandomizing(false);
      setBudget('');
    }, 1800);
  }, [budget, menu]);

  const generateRandomCombo = (maxBudget) => {
    let currentSpent = 0;
    let tempCart = {};
    let attempts = 0;
    const maxAttempts = 100; 
    
    // All items in the menu are purchasable now
    const purchasableItems = menu.filter(i => i.price > 0);

    let availableItems = purchasableItems.filter(i => i.price <= maxBudget);
    
    while (currentSpent < maxBudget && attempts < maxAttempts) {
      const candidate = availableItems[Math.floor(Math.random() * availableItems.length)];
      
      if (!candidate) break;

      if (currentSpent + candidate.price <= maxBudget) {
        tempCart[candidate.id] = (tempCart[candidate.id] || 0) + 1;
        currentSpent += candidate.price;
        // Re-filter available items to respect remaining budget
        availableItems = purchasableItems.filter(i => i.price <= maxBudget - currentSpent);
        attempts = 0; 
      } else {
        attempts++;
      }
    }
    
    setCart(tempCart);
    setRandomMessage("推薦組合已加入購物車！");
  };

  const filteredMenu = useMemo(() => {
    return menu.filter(item => item.category === selectedCategory);
  }, [menu, selectedCategory]);

  // --- Components for Views ---

  // Admin View Helper
  const AdminOrderCard = ({ order }) => (
    <div key={order.id} className={`border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${order.isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg text-gray-800">{order.userName}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {order.timestamp?.toDate ? new Date(order.timestamp.toDate()).toLocaleTimeString() : '剛剛'}
                </span>
                {order.isPaid && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">已付款</span>}
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-2">
                <p className="font-semibold text-gray-700">🛒 點購項目:</p>
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between max-w-xs">
                        <span>{item.name} x{item.count}</span>
                        <span>{item.price === 0 ? '贈送' : `$${item.price * item.count}`}</span>
                    </div>
                ))}
            </div>
            {order.condiments && (
                <div className="text-sm text-gray-600 border-t pt-2 mt-2">
                    <p className="font-semibold text-gray-700">🌶️ 備註:</p>
                    <p>蔥: {order.condiments.蔥}, 蒜: {order.condiments.蒜}, 酸菜: {order.condiments.酸菜}, 辣椒: {order.condiments.辣椒}</p>
                </div>
            )}
            <div className="mt-3 font-bold text-red-600">
                總金額：${order.total}
            </div>
        </div>
        
        <button
            onClick={() => togglePaymentStatus(order.id, order.isPaid)}
            className={`px-6 py-3 rounded-lg font-bold shadow-sm transition w-full md:w-auto ${
                order.isPaid 
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                    : 'bg-green-600 text-white hover:bg-green-700'
            }`}
        >
            {order.isPaid ? '設為未付' : '確認收款'}
        </button>
    </div>
  );

  // Submit Modal Helper
  const SubmitModal = () => {
    const freeNoodle = FREE_NOODLE_CHOICES.find(n => n.id === selectedFreeNoodle);
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Soup className="w-6 h-6 text-amber-600" />
                訂單選項與確認
            </h3>
            <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Condiment Section */}
            <div>
              <h4 className="font-bold text-lg text-amber-700 mb-3 border-b pb-1">調味/配料選項</h4>
              
              {/* Toppings (蔥蒜酸菜) */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">是否添加以下配料？</p>
                <div className="flex flex-wrap gap-3">
                  {['蔥', '蒜', '酸菜'].map(topping => (
                    <button
                      key={topping}
                      onClick={() => setCondimentOptions(p => ({ ...p, [topping]: !p[topping] }))}
                      className={`px-4 py-2 rounded-full font-bold transition flex items-center gap-2 ${
                        condimentOptions[topping] 
                          ? 'bg-green-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {topping} {condimentOptions[topping] ? '✅' : '❌'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Chili (辣椒) */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">辣椒等級：</p>
                <div className="flex flex-wrap gap-2">
                  {CHILI_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => setCondimentOptions(p => ({ ...p, 辣椒: level }))}
                      className={`px-4 py-2 rounded-lg font-bold transition ${
                        condimentOptions.辣椒 === level 
                          ? 'bg-red-600 text-white shadow-md' 
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Free Noodle Section */}
            {isFreeNoodleEligible && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-bold text-lg text-yellow-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    恭喜！滿 ${FREE_NOODLE_THRESHOLD}，請選擇贈送的主食：
                </h4>
                <div className="flex flex-wrap gap-3">
                  {FREE_NOODLE_CHOICES.map(noodle => (
                    <button
                      key={noodle.id}
                      onClick={() => setSelectedFreeNoodle(noodle.id)}
                      className={`px-4 py-2 rounded-lg font-bold transition ${
                        selectedFreeNoodle === noodle.id 
                          ? 'bg-amber-600 text-white shadow-md' 
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {noodle.name}
                    </button>
                  ))}
                </div>
                {!selectedFreeNoodle && <p className="text-red-500 text-sm mt-2">請務必選擇一種麵類！</p>}
              </div>
            )}
            
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-lg mb-2">訂單總結</h4>
                <div className="space-y-1 text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {Object.entries(cart).map(([id, qty]) => {
                        const item = menu.find(i => i.id === id);
                        return item ? (
                            <div key={id} className="flex justify-between">
                                <span>{item.name} x{qty}</span>
                                <span>${item.price * qty}</span>
                            </div>
                        ) : null;
                    })}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xl font-bold">總金額:</span>
                    <span className="text-2xl font-bold text-red-600">${currentTotal}</span>
                </div>
            </div>
          </div>

          <div className="p-6 border-t">
            <button
              onClick={handleFinalSubmit}
              disabled={isFreeNoodleEligible && !selectedFreeNoodle}
              className={`w-full py-3 rounded-lg font-bold text-xl transition shadow-lg ${
                (isFreeNoodleEligible && !selectedFreeNoodle) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
              }`}
            >
              確認送出訂單
            </button>
          </div>
        </div>
      </div>
    );
  };


  // --- Main Views (Login, Admin, User) ---

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border-t-4 border-amber-600">
          <div className="text-center mb-8">
            <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-amber-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">阿嬌滷味</h1>
            <p className="text-gray-500 mt-2">記憶中的好味道，越滷越香</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">請問怎麼稱呼？</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="輸入姓名 (例: 王小明)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg shadow-md transition transform active:scale-95"
            >
              開始點餐
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin View
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans">
        <header className="bg-slate-800 text-white p-4 sticky top-0 z-10 shadow-md">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold flex items-center gap-2">
               <ChefHat className="w-6 h-6" /> 後台管理 ({username})
            </h1>
            <button onClick={() => window.location.reload()} className="text-xs bg-slate-700 px-3 py-1 rounded">登出</button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ListRestart className="w-5 h-5 text-blue-600" />
              即時訂單列表
            </h2>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">目前還沒有訂單喔，快去攬客！</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => <AdminOrderCard key={order.id} order={order} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // User View Wrapper
  return (
    <div className="min-h-screen bg-amber-50 font-sans pb-24">
      {showSubmitModal && <SubmitModal />}
      
      {/* Header */}
      <header className="bg-amber-700 text-white p-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('menu')}>
            <div className="bg-white p-1 rounded-full">
              <ChefHat className="w-5 h-5 text-amber-700" />
            </div>
            <h1 className="font-bold text-lg">阿嬌滷味</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-90 hidden sm:inline">Hi, {username}</span>
            <button 
              onClick={() => setView('lunch')}
              className="p-2 hover:bg-amber-600 rounded-full transition"
              title="午餐選擇器"
            >
              <MapPin className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setView(view === 'history' ? 'menu' : 'history')}
              className="p-2 hover:bg-amber-600 rounded-full transition relative"
            >
              {view === 'history' ? <Utensils className="w-6 h-6" /> : <History className="w-6 h-6" />}
              {view !== 'history' && historyOrders.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4">
        
        {/* 午餐選擇器頁面 */}
        {view === 'lunch' && <LunchPicker />}

        {/* Randomizer Animation Overlay */}
        {isRandomizing && (
          <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <Loader2 className="w-16 h-16 animate-spin text-amber-500 mb-4" />
            <h3 className="text-2xl font-bold animate-pulse">{randomMessage}</h3>
            <div className="mt-8 grid grid-cols-3 gap-2 opacity-50">
              <div className="w-12 h-12 bg-gray-700 rounded animate-bounce delay-75"></div>
              <div className="w-12 h-12 bg-gray-700 rounded animate-bounce delay-150"></div>
              <div className="w-12 h-12 bg-gray-700 rounded animate-bounce delay-300"></div>
            </div>
          </div>
        )}

        {view === 'lunch' ? null : view === 'history' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <History className="w-6 h-6 text-amber-600" />
              點餐紀錄
            </h2>
            
            {historyOrders.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500">還沒有紀錄喔，快去點第一餐吧！</p>
                <button onClick={() => setView('menu')} className="mt-4 text-amber-600 font-bold hover:underline">去點餐</button>
              </div>
            ) : (
              historyOrders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-amber-100 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                    <div>
                      <span className="text-xs text-gray-400 block">
                        {order.timestamp?.toDate ? new Date(order.timestamp.toDate()).toLocaleString() : 'Loading...'}
                      </span>
                      <span className="font-bold text-lg text-gray-800">總計 ${order.total}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.isPaid ? '已付款' : '未付款'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-600">
                        <span>{item.name} x{item.count}</span>
                        <span>{item.price === 0 ? '贈品' : `$${item.price * item.count}`}</span>
                      </div>
                    ))}
                    {order.condiments && (
                        <div className="pt-2 text-xs text-gray-500 italic">
                            備註: 蔥: {order.condiments.蔥}, 蒜: {order.condiments.蒜}, 酸菜: {order.condiments.酸菜}, 辣椒: {order.condiments.辣椒}
                        </div>
                    )}
                  </div>

                  <button 
                    onClick={() => reOrder(order.items)}
                    className="w-full bg-amber-50 text-amber-700 py-2 rounded-lg font-bold border border-amber-200 hover:bg-amber-100 transition flex items-center justify-center gap-2"
                  >
                    <ListRestart className="w-4 h-4" />
                    再來一模一樣的
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Randomizer Section */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-4 text-white shadow-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Shuffle className="w-5 h-5" />
                <h3 className="font-bold">不知道吃什麼？</h3>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="輸入預算 (例: 100)" 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg text-gray-800 focus:ring-2 focus:ring-white outline-none"
                  />
                </div>
                <button 
                  onClick={handleRandomize}
                  className="bg-white text-orange-600 font-bold px-4 py-2 rounded-lg hover:bg-orange-50 active:scale-95 transition"
                >
                  幫我選
                </button>
              </div>
              <p className="text-xs text-orange-100 mt-2 opacity-80">* 系統會自動幫您湊到接近金額，滿 ${FREE_NOODLE_THRESHOLD} 可選贈送主食！</p>
            </div>

            {/* Category Tabs */}
            <div className="flex space-x-2 overflow-x-auto whitespace-nowrap pb-3 -mx-4 px-4 sticky top-[72px] bg-amber-50 z-10 border-b border-amber-200">
              {MENU_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition shrink-0 ${
                    selectedCategory === category.id
                      ? 'bg-amber-700 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-amber-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 pb-20">
              {filteredMenu.map(item => (
                <div key={item.id} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center transition ${cart[item.id] ? 'ring-2 ring-amber-500 bg-amber-50' : ''}`}>
                  <div>
                    <span className="text-xs text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full mb-1 inline-block">
                      {MENU_CATEGORIES.find(c => c.id === item.category)?.name || item.category}
                    </span>
                    <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                    <p className="text-gray-500 font-medium">${item.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    {cart[item.id] > 0 && (
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-full bg-white text-gray-600 border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition font-bold text-lg"
                      >
                        -
                      </button>
                    )}
                    
                    <span className={`w-6 text-center font-bold ${cart[item.id] > 0 ? 'text-amber-700' : 'text-gray-300'}`}>
                      {cart[item.id] || 0}
                    </span>

                    <button 
                      onClick={() => addToCart(item.id)}
                      className="w-8 h-8 rounded-full bg-amber-500 text-white shadow-sm flex items-center justify-center hover:bg-amber-600 active:scale-90 transition font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Cart Summary Bar (Only in Menu view) */}
      {view === 'menu' && view !== 'lunch' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-20 border-t border-gray-100">
          <div className="max-w-2xl mx-auto">
            {/* Free Gift Progress */}
            <div className="mb-3 text-center">
              {isFreeNoodleEligible ? (
                <div className="inline-flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full animate-pulse">
                  <CheckCircle className="w-4 h-4" />
                  金額達標！可選擇贈送主食！
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  再買 <span className="text-red-500 font-bold">${Math.max(0, FREE_NOODLE_THRESHOLD - currentTotal)}</span> 元，就可選贈送主食囉！
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-4">
              <div>
                <p className="text-gray-500 text-xs">目前總計</p>
                <p className="text-2xl font-bold text-gray-900">${currentTotal}</p>
              </div>
              
              <button
                onClick={handleShowModal}
                disabled={currentTotal === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg transition shadow-lg ${
                  currentTotal > 0 
                    ? 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {currentTotal > 0 ? '送出訂單與選項' : '請先點餐'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}