'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage } from './chat-message';
import { RealtimeConversation } from '@/lib/realtime-chat-service';

interface ChatWindowProps {
  conversation: RealtimeConversation | null;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <Card className="h-120">
        <CardContent className="h-full flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>Inicia una conversación para ver los mensajes aquí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-120">
      <CardContent className="h-full p-4">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto pr-2 space-y-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {conversation.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {/* Indicador de conversación vacía */}
          {conversation.messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-2">�</div>
                <p className="text-sm">Esperando que Marcus comience a hablar...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
