import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  const bgColor = type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`${bgColor} border-l-4 rounded-lg shadow-xl p-6 max-w-md w-full animate-in zoom-in-95 duration-300`}>
        <div className="flex items-start gap-4">
          <Icon className={`w-6 h-6 ${textColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`${textColor} font-medium text-lg whitespace-pre-line`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`${textColor} hover:opacity-70 transition flex-shrink-0`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onClose}
          className={`mt-4 w-full py-2 rounded-lg font-bold ${
            type === 'success' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          } transition`}
        >
          確定
        </button>
      </div>
    </div>
  );
}
