import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ajiaoImage from './assets/pic/ajiao.png';
import ajiaochefImage from './assets/pic/ajiaochef.png';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* 主標題 */}
        <div className="text-center mb-12">
          {/* <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-xl mb-6 animate-bounce">
            <Utensils className="w-12 h-12 text-amber-600" />
          </div> */}
          <h1 className="text-3xl sm:text-6xl font-extrabold text-gray-800 mb-4">
            吃什麼好呢？
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            讓我們幫你決定今天的美食 🍜
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 阿嬌滷味卡片 */}
          <button
            onClick={() => navigate('/luwei')}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-amber-500 transform hover:scale-105"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4">
              <div className="bg-brand-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md shadow-brand-500/30">
                點餐系統
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center">
              {/* 阿嬌照片 */}
              <div className="w-32 h-32 mb-4 rounded-full overflow-hidden shadow-lg ring-4 ring-brand-100 group-hover:ring-brand-200 transition-all duration-300">
                <img 
                  src={ajiaoImage} 
                  alt="阿嬌滷味老闆娘" 
                  className="w-full h-full object-cover object-top hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-brand-600 transition-colors">
                阿嬌滷味
              </h2>
              
              <p className="text-gray-600 mb-4 font-medium">
                記憶中的好味道，越滷越香
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  線上點餐
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  歷史訂單查詢
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  滿額贈送主食
                </div>
              </div>

              <div className="mt-6 inline-flex items-center text-brand-600 font-bold group-hover:text-brand-700">
                開始點餐
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* 午餐選擇器卡片 */}
          <button
            onClick={() => navigate('/lunch-picker')}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-blue-500 transform hover:scale-105"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4">
              <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                決策工具
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 mb-4 rounded-full overflow-hidden shadow-lg ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all">
                <img
                  src={ajiaochefImage}
                  alt="阿嬌廚師"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                午餐吃什麼
              </h2>
              
              <p className="text-gray-600 mb-4">
                選擇困難症的救星！
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  智慧輪盤抽籤
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  價格/距離篩選
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  60+ 間餐廳資料
                </div>
              </div>

              <div className="mt-6 inline-flex items-center text-blue-600 font-bold group-hover:text-blue-700">
                開始選擇
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* 粒子系統卡片 */}
          <button
            onClick={() => navigate('/particle-shaper')}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-purple-500 transform hover:scale-105"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4">
              <div className="bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                互動體驗
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center">
              {/* 粒子圖示 */}
              <div className="w-32 h-32 mb-4 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-blue-500 shadow-lg ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white animate-pulse" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                粒子魔法
              </h2>
              
              <p className="text-gray-600 mb-4">
                用手勢控制 3D 粒子，創造專屬視覺
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  AI 手勢追蹤
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  15000+ 粒子特效
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  6 種造型切換
                </div>
              </div>

              <div className="mt-6 inline-flex items-center text-purple-600 font-bold group-hover:text-purple-700">
                開始體驗
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
