import React from 'react';

export const LoadingDots: React.FC = () => {
  return (
    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[bounce_0.8s_infinite_0ms]"></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[bounce_0.8s_infinite_150ms]"></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[bounce_0.8s_infinite_300ms]"></div>
      </div>
    </div>
  );
}; 