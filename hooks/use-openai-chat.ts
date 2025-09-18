import { useState, useCallback } from 'react';

export interface OpenAIMessage {
  id: string;
  text: string;
  speaker: 'user' | 'assistant';
  timestamp: Date;
  audioUrl?: string;
}

export interface OpenAIConversation {
  id: string;
  messages: OpenAIMessage[];
  isActive: boolean;
}

export const useOpenAIChat = () => {
  const [conversation, setConversation] = useState<OpenAIConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, scenario?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/openai-chat', {
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

      const userMessage: OpenAIMessage = {
        id: `msg_${Date.now()}_user`,
        text: message,
        speaker: 'user',
        timestamp: new Date(),
      };

      const aiMessage: OpenAIMessage = {
        id: `msg_${Date.now()}_ai`,
        text: data.agentResponse.text,
        speaker: 'assistant',
        timestamp: new Date(),
        audioUrl: data.agentResponse.audio_url,
      };

      setConversation(prev => {
        if (prev && prev.id === data.conversationId) {
          return {
            ...prev,
            messages: [...prev.messages, userMessage, aiMessage],
          };
        } else {
          // Create new conversation
          return {
            id: data.conversationId,
            messages: [userMessage, aiMessage],
            isActive: true,
          };
        }
      });

      return aiMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversation?.id]);

  const startNewConversation = useCallback(() => {
    setConversation(null);
    setError(null);
  }, []);

  const playAudio = useCallback(async (text: string, voice?: string) => {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      const data = await response.json();

      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        await audio.play();
        return true;
      } else {
        console.warn('Failed to generate audio:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      return false;
    }
  }, []);

  const getConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/openai-chat?conversationId=${conversationId}`);
      const data = await response.json();

      if (data.success) {
        setConversation({
          id: data.conversation.id,
          messages: data.conversation.messages || [],
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError('Failed to load conversation');
    }
  }, []);

  return {
    conversation,
    isLoading,
    error,
    sendMessage,
    startNewConversation,
    playAudio,
    getConversation,
  };
};
