'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage } from './chat-message';
import { RealtimeConversation } from '@/lib/realtime-chat-service';

interface ChatWindowProps {
  conversation: RealtimeConversation | null;
  currentTranscript?: string;
  isListening?: boolean;
}

export function ChatWindow({ conversation, currentTranscript, isListening }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, currentTranscript]);

  if (!conversation) {
    return (
      <Card className="h-96">
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
    <Card className="h-96">
      <CardContent className="h-full p-4">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto pr-2 space-y-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {conversation.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {/* Mostrar transcripción en progreso */}
          {currentTranscript && (
            <div className="flex justify-end mb-4">
              <div className="max-w-[80%] px-4 py-2 rounded-lg bg-blue-400 text-white ml-4 opacity-60">
                <div className="text-xs text-blue-100 mb-1">
                  Tú (hablando...)
                </div>
                <div className="text-sm leading-relaxed">
                  {currentTranscript}
                  <span className="inline-block w-2 h-4 bg-white opacity-50 animate-pulse ml-1" />
                </div>
              </div>
            </div>
          )}
          
          {/* Indicador de conversación vacía */}
          {conversation.messages.length === 0 && !currentTranscript && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-2">🎙️</div>
                <p className="text-sm">Empieza a hablar para iniciar la conversación</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
