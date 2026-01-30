import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, RotateCcw, Gift, MapPin, Star } from 'lucide-react';

// 刮刮樂趣味訊息
const SCRATCH_MESSAGES = [
  "🎰 刮開看看今天的命運！",
  "✨ 用力刮！好運就在裡面！",
  "🍀 命運的午餐等著你！",
  "🎁 神秘大獎即將揭曉！",
  "🔮 讓手指告訴你答案！",
];

const REVEAL_MESSAGES = [
  "🎉 恭喜中獎！",
  "✨ 命運之選！",
  "🍜 就是這家！",
  "🎊 今日幸運美食！",
  "🌟 完美選擇！",
];

export default function ScratchCard({ 
  restaurants = [], 
  onSelect, 
  getPriceColor,
  formatDistance 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [scratchMessage, setScratchMessage] = useState(SCRATCH_MESSAGES[0]);
  const [revealMessage, setRevealMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 追蹤已刮開的像素
  const scratchedRef = useRef(new Set());
  const lastPosRef = useRef({ x: 0, y: 0 });

  // 繪製刮刮層
  const drawScratchLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // 漸層背景 - 銀色金屬質感
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#c0c0c0');
    gradient.addColorStop(0.3, '#e8e8e8');
    gradient.addColorStop(0.5, '#d4d4d4');
    gradient.addColorStop(0.7, '#e8e8e8');
    gradient.addColorStop(1, '#a8a8a8');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 添加亮片效果
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 4 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.6 + 0.2})`;
      ctx.fill();
    }
  }, []);

  // 揭曉卡片
  const revealCard = useCallback(() => {
    setIsRevealed(true);
    setRevealMessage(REVEAL_MESSAGES[Math.floor(Math.random() * REVEAL_MESSAGES.length)]);
    
    // 清除 canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // 隨機選擇餐廳
  const pickRandomRestaurant = useCallback(() => {
    if (restaurants.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * restaurants.length);
    return restaurants[randomIndex];
  }, [restaurants]);

  // 初始化刮刮樂
  const initScratchCard = useCallback(() => {
    setIsGenerating(true);
    setScratchMessage(SCRATCH_MESSAGES[Math.floor(Math.random() * SCRATCH_MESSAGES.length)]);
    
    // 選擇餐廳
    const restaurant = pickRandomRestaurant();
    setSelectedRestaurant(restaurant);
    setIsRevealed(false);
    setScratchProgress(0);
    scratchedRef.current = new Set();
    
    // 等待一下再繪製，讓動畫效果更好
    setTimeout(() => {
      drawScratchLayer();
      setIsGenerating(false);
    }, 300);
  }, [pickRandomRestaurant, drawScratchLayer]);

  // 刮開效果
  const scratch = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // 計算相對位置
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    // 繪製刮痕 (使用 destination-out 來擦除)
    ctx.globalCompositeOperation = 'destination-out';
    
    // 畫一個圓形刮痕
    const radius = 25;
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 如果有上一個點，連接成線條以獲得更流暢的刮痕
    if (lastPosRef.current.x !== 0 || lastPosRef.current.y !== 0) {
      ctx.lineWidth = radius * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x * scaleX, lastPosRef.current.y * scaleY);
      ctx.lineTo(canvasX, canvasY);
      ctx.stroke();
    }
    
    lastPosRef.current = { x, y };
    
    // 計算刮開進度 (使用實際像素透明度採樣)
    const calculateProgress = () => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      const totalPixels = width * height;
      
      // 每 4 個像素採樣一次以提高效率 (alpha 通道是每 4 個位元的第 4 個)
      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] < 128) { // 透明度低於 50% 視為已刮
          transparentPixels++;
        }
      }
      
      // 調整總數來匹配採樣率
      const sampledTotal = Math.ceil(totalPixels / 4);
      return (transparentPixels / sampledTotal) * 100;
    };
    
    const progress = calculateProgress();
    setScratchProgress(progress);
    
    // 如果刮超過 50%，自動揭曉
    if (progress >= 50 && !isRevealed) {
      revealCard();
    }
  }, [isRevealed, revealCard]);

  // 確認選擇
  const handleConfirm = () => {
    if (selectedRestaurant && onSelect) {
      onSelect(selectedRestaurant);
    }
  };

  // 重新開始
  const handleReset = () => {
    setIsScratching(false);
    lastPosRef.current = { x: 0, y: 0 };
    initScratchCard();
  };

  // 滑鼠事件
  const handleMouseDown = (e) => {
    if (isRevealed) return;
    setIsScratching(true);
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPosRef.current = { x: 0, y: 0 };
    scratch(x, y);
  };

  const handleMouseMove = (e) => {
    if (!isScratching || isRevealed) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    scratch(x, y);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
    lastPosRef.current = { x: 0, y: 0 };
  };

  // 觸控事件
  const handleTouchStart = (e) => {
    if (isRevealed) return;
    e.preventDefault();
    setIsScratching(true);
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    lastPosRef.current = { x: 0, y: 0 };
    scratch(x, y);
  };

  const handleTouchMove = (e) => {
    if (!isScratching || isRevealed) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    scratch(x, y);
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
    lastPosRef.current = { x: 0, y: 0 };
  };

  // 初始化
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      initScratchCard();
    }
  }, [restaurants, selectedRestaurant, initScratchCard]);

  // Canvas 大小調整
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (!isRevealed && selectedRestaurant) {
        drawScratchLayer();
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isRevealed, selectedRestaurant, drawScratchLayer]);

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Gift className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">沒有符合條件的餐廳</p>
        <p className="text-sm">請調整篩選條件後再試</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* 標題訊息 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          刮刮樂午餐
          <Sparkles className="w-6 h-6 text-orange-500" />
        </h2>
        <p className="text-slate-500 text-sm">{scratchMessage}</p>
      </div>

      {/* 刮刮樂卡片 */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400/80"
        style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
          boxShadow: '0 25px 50px -12px rgba(251, 191, 36, 0.4), 0 0 0 1px rgba(251, 191, 36, 0.1)',
        }}
      >
        {/* 底層內容 (餐廳資訊) - 簡化版，只顯示名稱 */}
        {selectedRestaurant && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            {isRevealed && (
              <div className="animate-bounce-in">
                <div className="text-5xl mb-3">🎉</div>
              </div>
            )}
            
            <div className={`transition-all duration-500 ${isRevealed ? 'opacity-100 scale-100' : 'opacity-70 scale-95'}`}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {selectedRestaurant.name.charAt(0)}
              </div>
              
              <h3 className="text-2xl font-black text-slate-800">
                {selectedRestaurant.name}
              </h3>
              
              {isRevealed && (
                <p className="text-amber-600 font-bold text-sm mt-2">{revealMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* 刮刮層 Canvas */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {/* 載入動畫 */}
        {isGenerating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* 詳細資訊 - 顯示在卡片外面 */}
      {isRevealed && selectedRestaurant && (
        <div className="w-full max-w-sm mt-4 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-amber-200 shadow-lg animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-3">
            <span className={`font-bold text-lg ${getPriceColor?.(selectedRestaurant.price) || 'text-amber-600'}`}>
              {selectedRestaurant.price}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {formatDistance?.(selectedRestaurant.distance) || `${selectedRestaurant.distance}m`}
            </span>
          </div>
          
          <p className="text-sm text-slate-500 text-center mb-3">{selectedRestaurant.address}</p>
          
          {selectedRestaurant.tags && selectedRestaurant.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {selectedRestaurant.tags.slice(0, 4).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 進度條 */}
      {!isRevealed && scratchProgress > 0 && (
        <div className="w-full max-w-sm mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>刮開進度</span>
            <span>{Math.round(scratchProgress)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{ width: `${scratchProgress}%` }}
            />
          </div>
          {scratchProgress >= 30 && scratchProgress < 50 && (
            <p className="text-xs text-amber-600 mt-1 text-center animate-pulse">再刮一點就要揭曉了！</p>
          )}
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all border border-slate-200"
        >
          <RotateCcw className="w-4 h-4" />
          重新抽
        </button>
        
        {isRevealed && (
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Star className="w-4 h-4" />
            就決定是你了！
          </button>
        )}
      </div>

      {/* 提示文字 */}
      <p className="text-xs text-slate-400 mt-4 text-center">
        💡 刮超過 50% 會自動揭曉結果
      </p>

      {/* 動畫樣式 */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
