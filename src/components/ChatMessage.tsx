import React from 'react';
import { MessageCircle, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
        {isUser ? <MessageCircle size={20} /> : <Bot size={20} />}
      </div>
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'
          }`}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Sources: {message.sources.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}