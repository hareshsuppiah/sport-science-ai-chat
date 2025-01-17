import React from 'react';

export const LoadingDots: React.FC = () => {
  return (
    <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-16">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_0.8s_infinite_0ms]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_0.8s_infinite_150ms]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_0.8s_infinite_300ms]"></div>
      </div>
    </div>
  );
}; 