import { useState, useCallback, useEffect, useRef } from 'react';
import { OpenAIRealtimeService, RealtimeMessage, RealtimeConversation, createRealtimeService } from '@/lib/realtime-chat-service';

export const useRealtimeChat = () => {
  const [conversation, setConversation] = useState<RealtimeConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Disconnected');
  const [statusType, setStatusType] = useState<string>('normal');
  const [isConnected, setIsConnected] = useState(false);
  
  const serviceRef = useRef<OpenAIRealtimeService | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize the service
  useEffect(() => {
    try {
      serviceRef.current = createRealtimeService();
      
      // Set up event handlers
      serviceRef.current.setEventHandlers({
        onStatusChange: (status: string, type?: string) => {
          setStatus(status);
          setStatusType(type || 'normal');
          setIsConnected(serviceRef.current?.getIsConnected() || false);
        },
        onMessage: (message: RealtimeMessage) => {
          setConversation(prev => {
            if (!prev) {
              return {
                id: `conv_${Date.now()}`,
                messages: [message],
                isActive: true,
                sessionId: `session_${Date.now()}`
              };
            }
            return {
              ...prev,
              messages: [...prev.messages, message]
            };
          });
        },
        onAudioReceived: (stream: MediaStream) => {
          if (audioRef.current) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(console.error);
          }
        }
      });
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to initialize realtime service:', err);
    }

    return () => {
      // Cleanup on unmount
      if (serviceRef.current) {
        serviceRef.current.cleanup();
      }
    };
  }, []);

  const startConversation = useCallback(async () => {
    if (!serviceRef.current) {
      setError('Service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize conversation state
      setConversation({
        id: `conv_${Date.now()}`,
        messages: [],
        isActive: true,
        sessionId: `session_${Date.now()}`
      });

      await serviceRef.current.startConversation();
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to start conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopConversation = useCallback(async () => {
    if (!serviceRef.current) {
      return;
    }

    setIsLoading(true);

    try {
      await serviceRef.current.stopConversation();
      setConversation(prev => prev ? { ...prev, isActive: false } : null);
      setIsConnected(false);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to stop conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendTextMessage = useCallback((message: string) => {
    if (!serviceRef.current) {
      setError('Service not initialized');
      return;
    }

    try {
      serviceRef.current.sendTextMessage(message);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to send message:', err);
    }
  }, []);

  const getConnectionStatus = useCallback(() => {
    return serviceRef.current?.getConnectionStatus() || 'disconnected';
  }, []);

  const createAudioElement = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = document.createElement('audio');
      audioRef.current.autoplay = true;
      audioRef.current.style.display = 'none';
      document.body.appendChild(audioRef.current);
    }
    return audioRef.current;
  }, []);

  // Initialize audio element on mount
  useEffect(() => {
    createAudioElement();
    
    return () => {
      // Cleanup audio element on unmount
      if (audioRef.current && document.body.contains(audioRef.current)) {
        document.body.removeChild(audioRef.current);
      }
    };
  }, [createAudioElement]);

  return {
    conversation,
    isLoading,
    error,
    status,
    statusType,
    isConnected,
    startConversation,
    stopConversation,
    sendTextMessage,
    getConnectionStatus,
    setError
  };
};