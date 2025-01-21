import React from 'react';

export const ComingSoon: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
      <p className="text-gray-600">
        This feature is currently under development. Check back later!
      </p>
    </div>
  );
}; 