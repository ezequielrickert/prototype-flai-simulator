'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, RefreshCw, BookOpen, Lightbulb, Target, Brain } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  feedback: string | null;
  partialFeedback?: string;
  onClose: () => void;
}

interface FormattedSection {
  type: 'title' | 'content';
  text: string;
}

export function FeedbackModal({ isOpen, feedback, partialFeedback, onClose }: FeedbackModalProps) {
  if (!isOpen) {
    return null;
  }

  // Usar partialFeedback si está disponible y no hay feedback final todavía
  const displayFeedback = partialFeedback || feedback;
  const isPartialDisplay = !!partialFeedback && !feedback;

  // Parse the feedback to format it better
  const formatFeedback = (text: string): FormattedSection[] => {
    // Split by double line breaks or sections
    const sections = text.split(/\*\*([^*]+)\*\*/g);
    const formattedSections: FormattedSection[] = [];

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

  const formattedSections = displayFeedback ? formatFeedback(displayFeedback) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <Card className="card-custom max-w-3xl max-h-[90vh] w-full overflow-hidden shadow-xl">
        <CardHeader>
          <CardTitle className="card-title-gold flex items-center gap-2">
            <Brain className="w-6 h-6 icon-gold" />
            Reflexión Final de Marcus
          </CardTitle>
          <div className="separator" />
        </CardHeader>
        <CardContent className="px-8 overflow-y-auto max-h-[calc(90vh-140px)] text-[var(--cream)]">
          <div>
            {!displayFeedback ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold text-[var(--cream)] mb-2">Generando tu reflexión final...</h3>
                <p className="text-[var(--cream)] text-center max-w-md mb-4" style={{lineHeight: '1.6'}}>
                  Marcus está preparando una reflexión personalizada basada en nuestra conversación. Esto puede tomar unos momentos.
                </p>
                <div className="mt-6 w-full max-w-xs">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>
            ) : formattedSections.length > 0 ? (
              <div>
                {formattedSections.map((section, index) => (
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
                        <h3 className="text-xl font-bold text-[var(--cream)]" style={{color: '#D4AF37'}}>{section.text}</h3>
                      </div>
                    ) : (
                      <div className="text-[var(--cream)] leading-relaxed" style={{lineHeight: '1.6'}}>
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
                ))}
                {/* Indicador de escritura cuando es parcial */}
                {isPartialDisplay && (
                  <div className="flex items-center gap-2 mt-4 text-[var(--cream)] opacity-70">
                    <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></span>
                    <span className="text-sm">Marcus está escribiendo...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[var(--gray-dark)] p-6 rounded-lg border border-[#D4AF37] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="icon-gold">
                      <Target className="w-6 h-6" />
                    </span>
                    <h3 className="font-bold text-xl text-[var(--cream)]" style={{color: '#D4AF37'}}>Reflexión de Marcus</h3>
                  </div>
                  <div className="text-[var(--cream)] leading-relaxed" style={{lineHeight: '1.6'}}>
                    {displayFeedback}
                    {/* Indicador de escritura cuando es parcial */}
                    {isPartialDisplay && (
                      <span className="inline-block w-2 h-4 bg-[#D4AF37] opacity-70 animate-pulse ml-1" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div className="text-base text-[var(--cream)] font-medium">
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
    </div>
  );
}
