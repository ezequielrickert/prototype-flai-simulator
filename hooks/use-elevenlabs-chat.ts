import { useState, useCallback } from 'react';

export interface ElevenLabsMessage {
  id: string;
  text: string;
  speaker: 'user' | 'agent';
  timestamp: Date;
  audioUrl?: string;
}

export interface ElevenLabsConversation {
  id: string;
  messages: ElevenLabsMessage[];
  isActive: boolean;
}

export const useElevenLabsChat = () => {
  const [conversation, setConversation] = useState<ElevenLabsConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, scenario?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/elevenlabs-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: conversation?.id,
          scenario,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      const userMessage: ElevenLabsMessage = {
        id: `user-${Date.now()}`,
        text: message,
        speaker: 'user',
        timestamp: new Date(),
      };

      const agentMessage: ElevenLabsMessage = {
        id: `agent-${Date.now()}`,
        text: data.agentResponse?.text || data.response?.text || 'No response received',
        speaker: 'agent',
        timestamp: new Date(),
        audioUrl: data.agentResponse?.audio_url,
      };

      setConversation(prev => {
        const newConversation: ElevenLabsConversation = {
          id: data.conversationId || prev?.id || `conv-${Date.now()}`,
          messages: [...(prev?.messages || []), userMessage, agentMessage],
          isActive: true,
        };
        return newConversation;
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversation?.id]);

  const getConversationHistory = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/elevenlabs-chat?conversationId=${conversationId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to retrieve conversation');
      }

      return data.conversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setConversation(null);
    setError(null);
  }, []);

  const playAudio = useCallback(async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      console.error('Failed to play audio:', err);
      setError('Failed to play audio');
    }
  }, []);

  return {
    conversation,
    isLoading,
    error,
    sendMessage,
    getConversationHistory,
    startNewConversation,
    playAudio,
  };
};
