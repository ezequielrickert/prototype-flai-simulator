'use client';

import React from 'react';
import { RealtimeMessage } from '@/lib/realtime-chat-service';

interface ChatMessageProps {
  message: RealtimeMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.speaker === 'user';
  const isSystem = message.speaker === 'system';
  const isPartial = message.isPartial;

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[80%] px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white ml-4' 
            : 'bg-gray-100 text-gray-900 mr-4'
        } ${isPartial ? 'opacity-70' : ''}`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className={`text-sm ${isUser ? 'text-blue-100' : 'text-gray-500'} mb-1`}>
              {isUser ? 'Tú' : 'Mariana'}
              {isPartial && <span className="ml-1 text-xs">(escribiendo...)</span>}
            </div>
            <div className={`text-sm leading-relaxed ${isPartial ? 'animate-pulse' : ''}`}>
              {message.text}
              {isPartial && (
                <span className="inline-block w-2 h-4 bg-current opacity-50 animate-pulse ml-1" />
              )}
            </div>
          </div>
        </div>
        <div className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
          {message.timestamp.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
          {message.confidence && message.confidence < 0.8 && (
            <span className="ml-2 opacity-60">
              (confianza: {Math.round(message.confidence * 100)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
