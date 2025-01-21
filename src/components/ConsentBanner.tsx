import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "relative mb-6 animate-in fade-in slide-in-from-top-4 duration-500",
      "rounded-lg border border-black/10 dark:border-white/10",
      "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm",
      "p-4 pr-12"
    )}>
      <div className="flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600 dark:text-gray-300">
          By using this chatbot, you agree to our <a href="#" className="text-blue-500 dark:text-blue-400 hover:underline">consent form</a>. Your interactions will be logged for research purposes.
        </div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className={cn(
          "absolute right-3 top-3 p-1 rounded-lg transition-colors duration-200",
          "hover:bg-black/5 dark:hover:bg-white/5",
          "text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        )}
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}