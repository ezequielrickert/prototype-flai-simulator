import { useState, useCallback } from 'react';
import { EthicalDilemma, CoachingSession } from '@/lib/professor-agent-service';

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
  dilemma?: EthicalDilemma;
  sessionId?: string;
}

export const useOpenAIChat = () => {
  const [conversation, setConversation] = useState<OpenAIConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDilemma, setCurrentDilemma] = useState<EthicalDilemma | null>(null);
  const [currentSession, setCurrentSession] = useState<CoachingSession | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Make sure we have an active session
      if (!currentSession) {
        throw new Error('No active coaching session. Please start a new session first.');
      }

      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: currentSession.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update conversation with new messages
      const userMessage: OpenAIMessage = {
        id: `user-${Date.now()}`,
        text: message,
        speaker: 'user',
        timestamp: new Date(),
      };

      const assistantMessage: OpenAIMessage = {
        id: `assistant-${Date.now()}`,
        text: data.response,
        speaker: 'assistant',
        timestamp: new Date(),
        audioUrl: data.audioUrl,
      };

      setConversation(prev => {
        if (!prev) {
          return {
            id: currentSession.id,
            messages: [userMessage, assistantMessage],
            isActive: true,
            dilemma: currentSession.dilemma,
            sessionId: currentSession.id,
          };
        }
        return {
          ...prev,
          messages: [...prev.messages, userMessage, assistantMessage],
        };
      });

      return assistantMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const startNewSession = useCallback(async (dilemma?: EthicalDilemma) => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionId = `session-${Date.now()}`;
      
      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start-session',
          sessionId,
          dilemma,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start session');
      }

      // Set the current session and dilemma
      setCurrentSession(data.session);
      setCurrentDilemma(data.session.dilemma);

      // Create initial conversation with Marcus's opening
      const initialMessage: OpenAIMessage = {
        id: `assistant-${Date.now()}`,
        text: data.session.messages[0]?.content || 'Hola, soy Marcus. Comencemos con nuestra sesión de coaching ético de hoy.',
        speaker: 'assistant',
        timestamp: new Date(),
      };

      setConversation({
        id: sessionId,
        messages: [initialMessage],
        isActive: true,
        dilemma: data.session.dilemma,
        sessionId,
      });

      return data.session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDilemma = useCallback((dilemma: EthicalDilemma) => {
    setCurrentDilemma(dilemma);
  }, []);

  const getAvailableDilemmas = useCallback(async (): Promise<EthicalDilemma[]> => {
    try {
      const response = await fetch('/api/scenarios');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dilemmas');
      }
      
      return data.dilemmas || [];
    } catch (err) {
      console.error('Error fetching dilemmas:', err);
      return [];
    }
  }, []);

  const playAudio = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      }
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  }, []);

  const clearConversation = useCallback(() => {
    setConversation(null);
    setCurrentSession(null);
    setCurrentDilemma(null);
    setError(null);
  }, []);

  const getConversation = useCallback(async (conversationId: string) => {
    try {
      // This would typically fetch conversation history from the server
      // For now, return the current conversation if IDs match
      if (conversation?.id === conversationId) {
        return conversation;
      }
      return null;
    } catch (err) {
      console.error('Error fetching conversation:', err);
      return null;
    }
  }, [conversation]);

  const endSession = useCallback(() => {
    if (currentSession) {
      // End the session on the server
      fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end-session',
          sessionId: currentSession.id,
        }),
      }).catch(console.error);
    }
    
    clearConversation();
  }, [currentSession, clearConversation]);

  return {
    conversation,
    isLoading,
    error,
    currentDilemma,
    currentSession,
    sendMessage,
    startNewSession,
    setDilemma,
    getAvailableDilemmas,
    playAudio,
    clearConversation,
    getConversation,
    endSession,
  };
};
