'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, RefreshCw, BookOpen, Lightbulb } from 'lucide-react';

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
    <>
      <Card className="max-w-3xl max-h-[90vh] w-full overflow-hidden shadow-xl">
        <CardHeader className="bg-white border-b border-[#D4AF37] px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">🧠</span>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-black tracking-wide">Reflexión Final de Marcus</CardTitle>
                <p className="text-base text-black mt-1 flex items-center gap-2 font-medium">
                  Tu coach de ética empresarial
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
        <CardContent className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-10">
            {!feedback ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Generando tu reflexión final...</h3>
                <p className="text-black text-center max-w-md mb-4" style={{lineHeight: '1.6'}}>
                  Marcus está preparando una reflexión personalizada basada en nuestra conversación. Esto puede tomar unos momentos.
                </p>
                <div className="mt-6 w-full max-w-xs">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>
            ) : formattedSections.length > 0 ? (
              formattedSections.map((section, index) => (
                <div key={index} className="space-y-2">
                  {section.type === 'title' ? (
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-7 h-7 bg-[#D4AF37] rounded-full flex items-center justify-center text-white text-lg">
                        {section.text.includes('bien') ? (
                          <CheckCircle className="icon-gold w-5 h-5" />
                        ) : section.text.includes('mejorar') ? (
                          <RefreshCw className="icon-gold w-5 h-5" />
                        ) : section.text.includes('aprendizaje') ? (
                          <BookOpen className="icon-gold w-5 h-5" />
                        ) : (
                          <Lightbulb className="icon-gold w-5 h-5" />
                        )}
                      </span>
                      <h3 className="text-xl font-bold" style={{color: '#D4AF37'}}>{section.text}</h3>
                    </div>
                  ) : (
                    <div className="text-black leading-relaxed" style={{lineHeight: '1.6'}}>
                      {section.text.split('\n').map((line, lineIndex) => {
                        if (line.trim().startsWith('-')) {
                          return (
                            <div key={lineIndex} className="flex items-start gap-2 mb-2">
                              <span className="text-[#D4AF37] mt-1">•</span>
                              <span>{line.trim().substring(1).trim()}</span>
                            </div>
                          );
                        }
                        return line.trim() ? (
                          <p key={lineIndex} className="mb-3" style={{maxWidth: '700px'}}>
                            {line.trim()}
                          </p>
                        ) : null;
                      })}
                    </div>
                  )}
                  {/* Separador dorado entre secciones, excepto la última */}
                  {index < formattedSections.length - 1 && (
                    <div className="w-full border-b border-[#D4AF37] opacity-60 my-4"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg border border-[#D4AF37] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#D4AF37] text-xl">🎯</span>
                    <h3 className="font-bold text-xl" style={{color: '#D4AF37'}}>Reflexión de Marcus</h3>
                  </div>
                  <p className="text-black leading-relaxed" style={{lineHeight: '1.6'}}>{feedback}</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div className="text-base text-black font-medium">
                <span className="font-bold">Marcus</span> • Coach de Ética Empresarial
              </div>
              <Button
                onClick={onClose}
                disabled={!feedback}
                className="bg-[#D4AF37] hover:bg-[#B8860B] text-white px-8 py-2 text-lg font-bold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
              >
                {feedback ? 'Continuar Desarrollo' : 'Generando...'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
