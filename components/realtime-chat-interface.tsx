'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";

export function RealtimeChatInterface() {
  const {
    conversation,
    isLoading,
    error,
    status,
    statusType,
    isConnected,
    startConversation,
    stopConversation,
    sendTextMessage,
    setError
  } = useRealtimeChat();

  const handleStartConversation = async () => {
    await startConversation();
  };

  const handleStopConversation = async () => {
    await stopConversation();
  };

  const getStatusClassName = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'connected':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>OpenAI Real-time Voice Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className={`text-sm font-medium ${getStatusClassName(statusType)}`}>
              Status: {status}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleStartConversation}
              disabled={isLoading || isConnected}
              className="flex-1"
            >
              {isLoading ? 'Connecting...' : 'Start Conversation'}
            </Button>
            <Button
              onClick={handleStopConversation}
              disabled={isLoading || !isConnected}
              variant="outline"
              className="flex-1"
            >
              Stop Conversation
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                ❌ Error: {error}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Messages Display */}
          {conversation && conversation.messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.speaker === 'user'
                          ? 'bg-blue-50 border-l-4 border-blue-400'
                          : message.speaker === 'assistant'
                          ? 'bg-green-50 border-l-4 border-green-400'
                          : 'bg-gray-50 border-l-4 border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-700 flex-1">
                          {message.text}
                        </p>
                        <span className="text-xs text-gray-500 ml-2">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          message.speaker === 'user'
                            ? 'bg-blue-100 text-blue-700'
                            : message.speaker === 'assistant'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {message.speaker === 'user' ? 'You' : 
                           message.speaker === 'assistant' ? 'AI' : 'System'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>📝 <strong>Setup:</strong> Make sure you have the OpenAI API key configured</p>
            <p>🎤 <strong>Microphone:</strong> Allow microphone access when prompted</p>
            <p>🔊 <strong>Audio:</strong> Ensure speakers/headphones are working</p>
            <p>💬 <strong>Usage:</strong> Click "Start Conversation" and begin speaking!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}