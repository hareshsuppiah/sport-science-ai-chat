import React from 'react';
import type { Message } from '../types';
import { LoadingDots } from './LoadingDots';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
  const isUser = message.role === 'user';
  const uniqueSources = message.sources ? [...new Set(message.sources)] : [];

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
        isUser 
          ? 'bg-black text-white' 
          : 'bg-gray-50 border border-gray-100'
      }`}>
        <div className={`text-sm ${isUser ? 'text-gray-200' : 'text-gray-500'} mb-1`}>
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className={`${isUser ? 'text-white' : 'text-gray-900'}`}>
          {message.content}
        </div>
        {!isUser && uniqueSources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            Sources: {uniqueSources.join(', ')}
          </div>
        )}
      </div>
      {!isUser && isLoading && (
        <div className="ml-2">
          <LoadingDots />
        </div>
      )}
    </div>
  );
};