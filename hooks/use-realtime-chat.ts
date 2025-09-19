import { useState, useCallback, useEffect, useRef } from 'react';
import { OpenAIRealtimeService, RealtimeMessage, RealtimeConversation, createRealtimeService } from '@/lib/realtime-chat-service';
import { useMicrophoneControl } from './use-microphone-control';
import { SpeechRecognitionService, SpeechRecognitionResult } from '@/lib/speech-recognition-service';

export const useRealtimeChat = () => {
  const [conversation, setConversation] = useState<RealtimeConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Disconnected');
  const [statusType, setStatusType] = useState<string>('normal');
  const [isConnected, setIsConnected] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionPaused, setSpeechRecognitionPaused] = useState(false);
  
  const serviceRef = useRef<OpenAIRealtimeService | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionService | null>(null);
  const lastMessageIdRef = useRef<string>('');

  // Initialize microphone control
  const microphoneControl = useMicrophoneControl();

  // Helper functions for speech recognition management
  const pauseSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current && speechRecognitionRef.current.getIsListening()) {
      console.log('Pausando reconocimiento de voz - IA hablando');
      speechRecognitionRef.current.pause();
      setSpeechRecognitionPaused(true);
    }
  }, []);

  const resumeSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current && isConnected && !microphoneControl.isMuted) {
      console.log('Reanudando reconocimiento de voz - IA terminó de hablar');
      setTimeout(() => {
        if (speechRecognitionRef.current && isConnected && !microphoneControl.isMuted) {
          speechRecognitionRef.current.resume();
          setSpeechRecognitionPaused(false);
        }
      }, 1500); // Esperar 1.5 segundos para asegurar que la IA terminó
    }
  }, [isConnected, microphoneControl.isMuted]);

  // Initialize the services
  useEffect(() => {
    try {
      // Initialize realtime service
      serviceRef.current = createRealtimeService();
      
      // Initialize speech recognition
      speechRecognitionRef.current = new SpeechRecognitionService({
        language: 'es-ES',
        continuous: true,
        interimResults: true
      });
      
      // Set up realtime service event handlers
      serviceRef.current.setEventHandlers({
        onStatusChange: (status: string, type?: string) => {
          setStatus(status);
          setStatusType(type || 'normal');
          setIsConnected(serviceRef.current?.getIsConnected() || false);
        },
        onMicrophoneStream: (stream: MediaStream | null) => {
          // Pass the microphone stream to the microphone control hook
          microphoneControl.setMicrophoneStream(stream);
        },
        onMessage: (message: RealtimeMessage) => {
          // Track AI state based on messages
          if (message.speaker === 'assistant') {
            setIsAIThinking(false);
            const wasSpeaking = isAISpeaking;
            setIsAISpeaking(!message.isPartial);
            
            // Pause speech recognition when AI starts speaking
            if (!wasSpeaking && !message.isPartial) {
              pauseSpeechRecognition();
            }
            
            // Reset speaking state for completed messages
            if (!message.isPartial) {
              setTimeout(() => {
                setIsAISpeaking(false);
                // Resume speech recognition after AI finishes speaking
                resumeSpeechRecognition();
              }, 3000);
            }
          } else if (message.speaker === 'user') {
            setIsUserSpeaking(true);
            setTimeout(() => setIsUserSpeaking(false), 2000);
          }

          setConversation(prev => {
            if (!prev) {
              return {
                id: `conv_${Date.now()}`,
                messages: [message],
                isActive: true,
                sessionId: `session_${Date.now()}`
              };
            }
            
            // Handle message updates for partial messages
            const existingMessageIndex = prev.messages.findIndex(m => m.id === message.id);
            if (existingMessageIndex !== -1) {
              const updatedMessages = [...prev.messages];
              updatedMessages[existingMessageIndex] = message;
              return {
                ...prev,
                messages: updatedMessages
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
            
            // Pausar reconocimiento cuando empiece el audio de la IA
            pauseSpeechRecognition();
            
            audioRef.current.play().catch(console.error);
            
            // Escuchar cuando termine el audio
            audioRef.current.onended = () => {
              console.log('Audio de IA terminado');
              resumeSpeechRecognition();
            };
            
            // También pausar cuando empiece a reproducir
            audioRef.current.onplay = () => {
              console.log('Audio de IA iniciando');
              pauseSpeechRecognition();
            };
          }
        },
        onTranscriptReceived: (transcript: string, isPartial: boolean) => {
          if (isPartial) {
            setCurrentTranscript(transcript);
          } else {
            setCurrentTranscript('');
          }
        },
        onAISpeakingStateChange: (isSpeaking: boolean) => {
          console.log('AI speaking state change:', isSpeaking);
          if (isSpeaking) {
            pauseSpeechRecognition();
          } else {
            // Esperar un poco antes de reanudar para asegurar que terminó completamente
            setTimeout(() => {
              console.log('Intentando reanudar speech recognition...');
              resumeSpeechRecognition();
            }, 1000);
          }
        }
      });

      // Set up speech recognition event handlers
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.setEventHandlers({
          onResult: (result: SpeechRecognitionResult) => {
            console.log('Speech recognition result:', result);
            if (result.isFinal) {
              // Enviar transcripción final al servicio
              if (serviceRef.current && result.transcript.trim()) {
                console.log('Enviando transcripción final:', result.transcript);
                serviceRef.current.sendUserTranscription(result.transcript, false);
              }
              setCurrentTranscript('');
            } else {
              // Mostrar transcripción parcial
              console.log('Transcripción parcial:', result.transcript);
              setCurrentTranscript(result.transcript);
            }
          },
          onError: (error: string) => {
            console.log('Speech recognition error:', error);
            setError(`Error de reconocimiento de voz: ${error}`);
            setIsListening(false);
            // Auto-reintentar después de un error
            setTimeout(() => {
              if (isConnected && !microphoneControl.isMuted) {
                console.log('Reintentando iniciar speech recognition después de error...');
                speechRecognitionRef.current?.start();
              }
            }, 2000);
          },
          onStart: () => {
            console.log('Speech recognition started');
            setIsListening(true);
            setSpeechRecognitionPaused(false);
            setError(null);
          },
          onEnd: () => {
            console.log('Speech recognition ended');
            setIsListening(false);
            // Auto-reiniciar si no está pausado y aún conectado
            setTimeout(() => {
              if (!speechRecognitionPaused && isConnected && !microphoneControl.isMuted) {
                console.log('Auto-reiniciando speech recognition...');
                speechRecognitionRef.current?.start();
              }
            }, 1000);
          }
        });
      }
      
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to initialize services:', err);
    }

    return () => {
      // Cleanup on unmount
      if (serviceRef.current) {
        serviceRef.current.cleanup();
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.cleanup();
      }
    };
  }, []);

  const startConversation = useCallback(async () => {
    if (!serviceRef.current) {
      setError('Servicio no inicializado');
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
      
      // Start speech recognition when connected
      if (speechRecognitionRef.current && speechRecognitionRef.current.isSupported()) {
        speechRecognitionRef.current.start();
      } else {
        console.warn('Reconocimiento de voz no soportado en este navegador');
      }
      
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
      // Stop speech recognition
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      setCurrentTranscript('');
      
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

  const restartSpeechRecognition = useCallback(() => {
    console.log('Reiniciando manualmente speech recognition...');
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setTimeout(() => {
        if (isConnected && !microphoneControl.isMuted) {
          speechRecognitionRef.current?.start();
          setSpeechRecognitionPaused(false);
        }
      }, 500);
    }
  }, [isConnected, microphoneControl.isMuted]);

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
    isAIThinking,
    isAISpeaking,
    isUserSpeaking,
    currentTranscript,
    isListening,
    speechRecognitionPaused,
    startConversation,
    stopConversation,
    sendTextMessage,
    getConnectionStatus,
    restartSpeechRecognition,
    setError,
    // Microphone controls
    isMicrophoneMuted: microphoneControl.isMuted,
    microphoneAudioLevel: microphoneControl.audioLevel,
    toggleMicrophone: microphoneControl.toggleMute,
    muteMicrophone: microphoneControl.muteMicrophone,
    unmuteMicrophone: microphoneControl.unmuteMicrophone
  };
};