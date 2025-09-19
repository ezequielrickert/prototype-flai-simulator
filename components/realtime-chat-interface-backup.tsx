'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatWindow } from "./chat-window";
import { FeedbackModal } from "./feedback-modal";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import Link from "next/link";
import {ArrowLeft, MessageCircle, Clock, Trophy} from "lucide-react";

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
    currentTranscript,
    isListening,
    speechRecognitionPaused,
    finalFeedback,
    showFeedbackModal,
    startConversation,
    stopConversation,
    restartSpeechRecognition,
    setError,
    isMicrophoneMuted,
    microphoneAudioLevel,
    toggleMicrophone,
    sendTextMessage,
    closeFeedbackModal
  } = useRealtimeChat();

  // Estado para tiempo transcurrido
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isConnected) {
      timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isConnected]);

  // Formateo de tiempo
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
      case 'thinking':
        return 'text-purple-600 bg-purple-50 border-purple-200';
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
      case 'thinking':
        return '🧠';
      default:
        return '⚪';
    }
  };

  return (
    <>
      {/* Header premium para chat */}
      <header className="header border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="badge-header-nivel flex items-center gap-2 px-4 py-2 group mr-4">
                <ArrowLeft className="w-7 h-7 icon-gold transition group-hover:scale-110 group-hover:drop-shadow-lg" />
              </Link>
              <div className="rounded-2xl p-1 flex items-center justify-center" style={{background: '#181716', boxShadow: '0 0 16px 4px rgba(212,175,55,0.25)'}}>
                <img src="/logo-integridai.png" alt="IntegridAI Logo" className="w-16 h-16 object-contain" style={{display: 'block'}} />
              </div>
              <div>
                <h1 className="header-title-dark">IntegridAI</h1>
                <p className="header-subtitle-dark">Capacitación Anti-Corrupción</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MessageCircle className="w-16 h-16 icon-gold chat-icon" />
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-2xl text-gold leading-tight">
                  Chat en Tiempo Real
                </span>
                <span className="font-semibold text-lg text-cream">Conversación de Voz con IA</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Área contextual del desafío */}
        <Card className="card-custom border-0 shadow-lg mb-6">
          <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                  <span className="font-bold text-2xl text-gold">Desafío de Hoy: Conflictos de Interés</span>
                  {/* Indicador de progreso mejorado */}
                  <div className="items-center">
                      <span className="chip border-gold text-gold">
                        {isConnected ? `En progreso · ${formatTime(elapsedSeconds)} / 5:00` : 'Pendiente'}
                      </span>
                  </div>
            </div>
            <div className="flex gap-6 mb-4">
              <span className="flex items-center gap-2 text-sm text-cream">
                <Clock className="w-5 h-5 icon-gold" />
                Duración estimada: <span className="font-bold text-gold">5 minutos</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-cream">
                <Trophy className="w-5 h-5 icon-gold" />
                XP a ganar: <span className="font-bold text-gold">+50 puntos</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-base text-cream">Practica identificar y manejar situaciones donde tus intereses personales podrían entrar en conflicto con tus responsabilidades profesionales.</p>
            <div className="mb-4">
              <span className="font-semibold text-gold">Consejos para la conversación:</span>
              <ul className="list-disc ml-6 mt-2 text-cream text-sm space-y-1">
                <li>Habla con naturalidad</li>
                <li>Describe situaciones reales que hayas vivido</li>
                <li>Pregunta si tienes dudas sobre los escenarios</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        {/* Conversación guiada y controles */}
        <Card className="card-custom border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gold">Conversación Guiada</CardTitle>
              <div className="flex items-center gap-3">
                {/* Activity Indicators mejorados */}
                {isConnected && (
                  <div className="flex items-center gap-2">
                    {isMicrophoneMuted && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-gold rounded-full animate-pulse">
                        <span className="text-xs text-black font-medium">Micrófono Muteado</span>
                      </div>
                    )}
                    {isListening && !isMicrophoneMuted && !speechRecognitionPaused && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-xs text-blue-700 font-medium">Escuchando</span>
                        </div>
                    )}
                    {speechRecognitionPaused && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <span className="text-xs text-yellow-700 font-medium">Pausado</span>
                        </div>
                    )}
                    {isUserSpeaking && !isMicrophoneMuted && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gold/20 border border-gold rounded-full animate-pulse">
                        <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                        <span className="text-xs text-gold font-medium">Hablando</span>
                      </div>
                    )}
                    {isAIThinking && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gold/10 border border-gold rounded-full animate-bounce">
                        <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                        <span className="text-xs text-gold font-medium">IA pensando</span>
                      </div>
                    )}
                    {isAISpeaking && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gold/20 border border-gold rounded-full animate-pulse">
                        <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                        <span className="text-xs text-gold font-medium">Mariana</span>
                      </div>
                    )}
                  </div>
                )}
                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border border-gold bg-beige text-gold font-bold`}>
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
                className={`button-beige flex-1 h-12 font-bold py-3 rounded-lg transition-all duration-200 ${isLoading || isConnected ? 'opacity-60 cursor-not-allowed' : ''}`}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    Conectando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Iniciar Conversación
                  </div>
                )}
              </Button>
              
              {/* Mute/Unmute Button - Only when connected */}
              {isConnected && (
                <Button
                  onClick={toggleMicrophone}
                  variant="outline"
                  className={`relative border-gold bg-beige text-gold h-12 font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:bg-gold hover:text-cream hover:scale-105 hover:shadow-lg ${
                    isMicrophoneMuted 
                      ? 'opacity-60' 
                      : ''
                  }`}
                  size="lg"
                  title={isMicrophoneMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                >
                  <div className="flex items-center gap-2 min-w-[80px] justify-center">
                    {isMicrophoneMuted ? (
                      <>
                        🔇
                        <span className="hidden sm:inline font-semibold">Mute</span>
                      </>
                    ) : (
                      <>
                        🎤
                        <span className="hidden sm:inline font-semibold">Mic</span>
                      </>
                    )}
                  </div>
                  {/* Audio level indicator when not muted */}
                  {!isMicrophoneMuted && microphoneAudioLevel > 0 && (
                    <div
                      className="absolute bottom-1 left-2 h-1 bg-gold rounded-full transition-all duration-100 animate-pulse"
                      style={{
                        width: `${Math.min(microphoneAudioLevel * 70, 60)}%`,
                        opacity: microphoneAudioLevel > 0.1 ? 0.8 : 0
                      }}
                    />
                  )}
                  {/* Muted overlay indicator */}
                  {isMicrophoneMuted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-dark bg-opacity-30 rounded-lg">
                      <div className="w-6 h-0.5 bg-gold transform rotate-45 absolute"></div>
                      <div className="w-6 h-0.5 bg-gold transform -rotate-45 absolute"></div>
                    </div>
                  )}
                </Button>
              )}
              
              {/* Microphone Restart Button - Only when disconnected and needed */}
              {isConnected && !isListening && !speechRecognitionPaused && (
                <Button
                  onClick={restartSpeechRecognition}
                  variant="outline"
                  className="relative border-gold text-gold bg-beige h-12 font-bold py-3 rounded-lg transition-all duration-200 animate-pulse"
                  size="lg"
                >
                  <div className="flex items-center gap-2">
                      🔄 Reactivar Voz
                  </div>
                </Button>
              )}
              
              <Button
                onClick={handleStopConversation}
                disabled={isLoading || !isConnected}
                className={`button-finalizar flex-1 h-12 font-bold py-3 rounded-lg transition-all duration-200 ${isLoading || !isConnected ? 'opacity-60 cursor-not-allowed' : ''}`}
                size="lg"
              >
                <div className="flex items-center gap-2">
                  🔴 Detener Conversación
                </div>
              </Button>
            </div>
            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-gold rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-gold text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-gold font-medium text-sm">Error de conexión</p>
                    <p className="text-gold text-sm mt-1">{error}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setError(null)}
                      className="mt-2 text-gold hover:text-gold px-0"
                    >
                      Ocultar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Chat Window: mostrar si hay conversación y mensajes relevantes (no solo "Conversation ended") */}
          {conversation &&
            conversation.messages.filter(m => m.speaker !== 'system' || (m.text && !m.text.toLowerCase().includes('conversation ended'))).length > 0 && (
              <ChatWindow
                conversation={conversation}
              />
          )}

        {/* Card de instrucciones: mostrar solo si no hay conversación, o está vacía, o solo tiene "Conversation ended" */}
        {(!conversation ||
          conversation.messages.length === 0 ||
          (conversation.messages.length === 1 && conversation.messages[0].text && conversation.messages[0].text.toLowerCase().includes('conversation ended'))
        ) && (
          <Card className="border-dashed border-2 border-gold">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="text-2xl">🎤</div>
                <h3 className="font-semibold text-gold">¿Listo para comenzar?</h3>
                <p className="text-sm text-gray-300 max-w-md mx-auto">
                    Haz clic en "Iniciar Chat con Mariana" para comenzar a recibir mensajes de voz de Mariana,
                    tu coach de ética empresarial. Solo necesitas tus altavoces o audífonos funcionando.
                </p>
                <div className="flex justify-center gap-6 text-xs text-gray-500 mt-4">
                    <div className="flex items-center gap-1">
                        <span>🎙️</span>
                        <span>Acceso al micrófono requerido</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>🔊</span>
                        <span>Salida de audio habilitada</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>🤖</span>
                        <span>Solo mensajes de Mariana</span>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
          {/* Feedback Modal */}
          <FeedbackModal
              isOpen={showFeedbackModal}
              feedback={finalFeedback}
              onClose={closeFeedbackModal}
          />
      </div>
    </>
  );
}