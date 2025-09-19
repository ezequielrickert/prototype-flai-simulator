'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeedbackModalProps {
  isOpen: boolean;
  feedback: string | null;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, feedback, onClose }: FeedbackModalProps) {
  if (!isOpen) {
    return null;
  }

  // Parse the feedback to format it better
  const formatFeedback = (text: string) => {
    // Split by double line breaks or sections
    const sections = text.split(/\*\*([^*]+)\*\*/g);
    const formattedSections = [];
    
    for (let i = 0; i < sections.length; i += 2) {
      const content = sections[i]?.trim();
      const title = sections[i + 1]?.trim();
      
      if (content) {
        formattedSections.push({ type: 'content', text: content });
      }
      if (title) {
        formattedSections.push({ type: 'title', text: title });
      }
    }
    
    return formattedSections;
  };

  const formattedSections = feedback ? formatFeedback(feedback) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-3xl max-h-[90vh] w-full overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">🧠</span>
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Reflexión Final de Mariana
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  Tu coach de ética empresarial
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                    🔇 Micrófono desactivado
                  </span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {!feedback ? (
              // Loading state while waiting for feedback
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Generando tu reflexión final...
                </h3>
                <p className="text-gray-600 text-center max-w-md">
                  Mariana está preparando una reflexión personalizada basada en nuestra conversación. 
                  Esto puede tomar unos momentos.
                </p>
                <div className="mt-6 w-full max-w-xs">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>
            ) : formattedSections.length > 0 ? (
              formattedSections.map((section, index) => (
                <div key={index}>
                  {section.type === 'title' ? (
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">
                        {section.text.includes('bien') ? '✅' : 
                         section.text.includes('mejorar') ? '🔄' : 
                         section.text.includes('aprendizaje') ? '📚' : '💡'}
                      </span>
                      {section.text}
                    </h3>
                  ) : (
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {section.text.split('\n').map((line, lineIndex) => {
                        if (line.trim().startsWith('-')) {
                          return (
                            <div key={lineIndex} className="flex items-start gap-2 mb-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{line.trim().substring(1).trim()}</span>
                            </div>
                          );
                        }
                        return line.trim() ? (
                          <p key={lineIndex} className="mb-3">
                            {line.trim()}
                          </p>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">🎯</span>
                    Reflexión de Mariana
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Mariana</span> • Coach de Ética Empresarial
              </div>
              <Button
                onClick={onClose}
                disabled={!feedback}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {feedback ? 'Continuar Desarrollo' : 'Generando...'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
