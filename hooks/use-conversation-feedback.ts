import { useState, useCallback } from 'react';
import { ConversationFeedback } from '@/lib/realtime-agent-service';

interface UseConversationFeedbackReturn {
  feedback: ConversationFeedback | null;
  allFeedback: ConversationFeedback[];
  isGenerating: boolean;
  error: string | null;
  generateFeedback: (conversationId: string, timeWindowSeconds?: number) => Promise<void>;
  getFeedbackHistory: (conversationId: string) => Promise<void>;
  clearError: () => void;
}

export function useConversationFeedback(): UseConversationFeedbackReturn {
  const [feedback, setFeedback] = useState<ConversationFeedback | null>(null);
  const [allFeedback, setAllFeedback] = useState<ConversationFeedback[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFeedback = useCallback(async (conversationId: string, timeWindowSeconds: number = 30) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/conversation-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          timeWindowSeconds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate feedback');
      }

      if (data.success && data.feedback) {
        setFeedback(data.feedback);
        // Update all feedback list
        setAllFeedback(prev => [...prev, data.feedback]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error generating feedback:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getFeedbackHistory = useCallback(async (conversationId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/conversation-feedback?conversationId=${encodeURIComponent(conversationId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve feedback');
      }

      if (data.success) {
        setAllFeedback(data.allFeedback || []);
        setFeedback(data.latestFeedback || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error retrieving feedback:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    feedback,
    allFeedback,
    isGenerating,
    error,
    generateFeedback,
    getFeedbackHistory,
    clearError,
  };
}
