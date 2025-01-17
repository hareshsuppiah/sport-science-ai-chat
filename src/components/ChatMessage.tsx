import React from 'react';
import type { Message } from '../types';
import { LoadingDots } from './LoadingDots';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
        isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'
      }`}>
        {message.content}
        {!isUser && message.sources && (
          <div className="mt-2 text-xs text-gray-500">
            Source: {message.sources.join(', ')}
          </div>
        )}
      </div>
      {!isUser && isLoading && (
        <div className="mb-2">
          <LoadingDots />
        </div>
      )}
    </div>
  );
};