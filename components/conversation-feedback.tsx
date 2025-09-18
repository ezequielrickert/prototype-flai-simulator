"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConversationFeedback } from '@/hooks/use-conversation-feedback';
import { ConversationFeedback } from '@/lib/realtime-agent-service';
import { 
  MessageSquare, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  Clock,
  BarChart3,
  Loader2
} from 'lucide-react';

interface ConversationFeedbackDisplayProps {
  conversationId: string;
  autoTriggerSeconds?: number;
  className?: string;
}

export function ConversationFeedbackDisplay({ 
  conversationId, 
  autoTriggerSeconds,
  className 
}: ConversationFeedbackDisplayProps) {
  const { 
    feedback, 
    allFeedback, 
    isGenerating, 
    error, 
    generateFeedback, 
    getFeedbackHistory,
    clearError 
  } = useConversationFeedback();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleGenerateFeedback = () => {
    generateFeedback(conversationId, autoTriggerSeconds || 30);
  };

  const handleShowHistory = () => {
    getFeedbackHistory(conversationId);
    setIsExpanded(true);
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComprehensionColor = (level: string) => {
    switch (level) {
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-purple-100 text-purple-800';
      case 'basic': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feedback de Conversación
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateFeedback}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Generar Feedback
                </>
              )}
            </Button>
            <Button 
              onClick={handleShowHistory}
              size="sm"
              variant="ghost"
            >
              <Clock className="h-4 w-4 mr-2" />
              Historial
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button onClick={clearError} size="sm" variant="ghost" className="ml-auto">
                  ×
                </Button>
              </div>
            </div>
          )}

          {feedback && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getEngagementColor(feedback.feedback.engagementLevel)}>
                    Participación: {feedback.feedback.engagementLevel}
                  </Badge>
                  <Badge className={getComprehensionColor(feedback.feedback.comprehensionLevel)}>
                    Comprensión: {feedback.feedback.comprehensionLevel}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(feedback.analysisTimestamp)} 
                  ({feedback.messagesAnalyzed} mensajes analizados)
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Resumen</h4>
                  <p className="text-sm text-gray-700">{feedback.feedback.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-1">
                      {feedback.feedback.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      Áreas de Mejora
                    </h4>
                    <ul className="space-y-1">
                      {feedback.feedback.areasForImprovement.map((area, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-600 mt-0.5">•</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    Sugerencias
                  </h4>
                  <ul className="space-y-1">
                    {feedback.feedback.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isExpanded && allFeedback.length > 1 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium text-sm mb-3">Historial de Feedback</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {allFeedback
                  .sort((a, b) => new Date(b.analysisTimestamp).getTime() - new Date(a.analysisTimestamp).getTime())
                  .map((fb, index) => (
                    <div key={fb.id} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-2">
                          <Badge className={getEngagementColor(fb.feedback.engagementLevel)}>
                            {fb.feedback.engagementLevel}
                          </Badge>
                          <Badge className={getComprehensionColor(fb.feedback.comprehensionLevel)}>
                            {fb.feedback.comprehensionLevel}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(fb.analysisTimestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{fb.feedback.summary}</p>
                    </div>
                  ))}
              </div>
              <Button 
                onClick={() => setIsExpanded(false)}
                size="sm"
                variant="ghost"
                className="mt-2"
              >
                Ocultar Historial
              </Button>
            </div>
          )}

          {!feedback && !isGenerating && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Haz clic en "Generar Feedback" para analizar los últimos {autoTriggerSeconds || 30} segundos de conversación
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ConversationFeedbackDisplay;
