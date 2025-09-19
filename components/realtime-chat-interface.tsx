'use client';
// TO BE DELETED
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
    isAIThinking,
    isAISpeaking,
    isUserSpeaking,
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
        return 'text-red-600 bg-red-50 border-red-200';
      case 'connecting':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'connecting':
        return '🔄';
      case 'connected':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header with Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">AI Voice Chat</CardTitle>
            <div className="flex items-center gap-3">
              {/* Activity Indicators */}
              {isConnected && (
                <div className="flex items-center gap-2">
                  {isUserSpeaking && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-xs text-blue-700 font-medium">You</span>
                    </div>
                  )}
                  {isAIThinking && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded-full">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                      <span className="text-xs text-orange-700 font-medium">Thinking</span>
                    </div>
                  )}
                  {isAISpeaking && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded-full">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-xs text-purple-700 font-medium">AI</span>
                    </div>
                  )}
                </div>
              )}
              {/* Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusClassName(statusType)}`}>
                <span className="text-sm">{getStatusIcon(statusType)}</span>
                <span className="text-xs font-medium">{status}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleStartConversation}
              disabled={isLoading || isConnected}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  🎙️ Start Conversation
                </div>
              )}
            </Button>
            <Button
              onClick={handleStopConversation}
              disabled={isLoading || !isConnected}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              size="lg"
            >
              <div className="flex items-center gap-2">
                🔴 Stop Conversation
              </div>
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-800 font-medium text-sm">Connection Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="mt-2 text-red-600 hover:text-red-800 px-0"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {!isConnected && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-2xl">🎤</div>
              <h3 className="font-semibold text-gray-900">Ready to start?</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Click "Start Conversation" to begin a real-time voice chat with AI. 
                Make sure your microphone is enabled and speakers are working.
              </p>
              <div className="flex justify-center gap-6 text-xs text-gray-500 mt-4">
                <div className="flex items-center gap-1">
                  <span>🎙️</span>
                  <span>Microphone access required</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🔊</span>
                  <span>Audio output enabled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}