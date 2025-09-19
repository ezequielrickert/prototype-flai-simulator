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

  // Microphone control
  const microphoneControl = useMicrophoneControl();

  // Helper functions for speech recognition management
  const pauseSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current && speechRecognitionRef.current.getIsListening()) {
      speechRecognitionRef.current.pause();
      setSpeechRecognitionPaused(true);
    }
  }, []);

  const resumeSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current && isConnected && !microphoneControl.isMuted) {
      setTimeout(() => {
        if (speechRecognitionRef.current && isConnected && !microphoneControl.isMuted) {
          speechRecognitionRef.current.resume();
          setSpeechRecognitionPaused(false);
        }
      }, 1500);
    }
  }, [isConnected, microphoneControl.isMuted]);

  useEffect(() => {
    try {
      serviceRef.current = createRealtimeService();
      speechRecognitionRef.current = new SpeechRecognitionService({
        language: 'es-ES',
        continuous: true,
        interimResults: true
      });
      serviceRef.current.setEventHandlers({
        onStatusChange: (status: string, type?: string) => {
          setStatus(status);
          setStatusType(type || 'normal');
          setIsConnected(serviceRef.current?.getIsConnected() || false);
        },
        onMessage: (message: RealtimeMessage) => {
          if (message.speaker === 'assistant') {
            setIsAIThinking(false);
            const wasSpeaking = isAISpeaking;
            setIsAISpeaking(!message.isPartial);
            if (!wasSpeaking && !message.isPartial) {
              pauseSpeechRecognition();
            }
            if (!message.isPartial) {
              setTimeout(() => {
                setIsAISpeaking(false);
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
            pauseSpeechRecognition();
            audioRef.current.play().catch(console.error);
            audioRef.current.onended = () => {
              resumeSpeechRecognition();
            };
            audioRef.current.onplay = () => {
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
          if (isSpeaking) {
            pauseSpeechRecognition();
          } else {
            setTimeout(() => {
              resumeSpeechRecognition();
            }, 1000);
          }
        }
      });
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.setEventHandlers({
          onResult: (result: SpeechRecognitionResult) => {
            if (result.isFinal) {
              if (serviceRef.current && result.transcript.trim()) {
                serviceRef.current.sendUserTranscription(result.transcript, false);
              }
              setCurrentTranscript('');
            } else {
              setCurrentTranscript(result.transcript);
            }
          },
          onError: (error: string) => {
            setError(`Error de reconocimiento de voz: ${error}`);
            setIsListening(false);
            setTimeout(() => {
              if (isConnected && !microphoneControl.isMuted) {
                speechRecognitionRef.current?.start();
              }
            }, 2000);
          },
          onStart: () => {
            setIsListening(true);
            setSpeechRecognitionPaused(false);
            setError(null);
          },
          onEnd: () => {
            setIsListening(false);
            setTimeout(() => {
              if (!speechRecognitionPaused && isConnected && !microphoneControl.isMuted) {
                speechRecognitionRef.current?.start();
              }
            }, 1000);
          }
        });
      }
    } catch (err) {
      setError((err as Error).message);
    }
    return () => {
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
      setConversation({
        id: `conv_${Date.now()}`,
        messages: [],
        isActive: true,
        sessionId: `session_${Date.now()}`
      });
      await serviceRef.current.startConversation();
      if (speechRecognitionRef.current && speechRecognitionRef.current.isSupported()) {
        speechRecognitionRef.current.start();
      }
    } catch (err) {
      setError((err as Error).message);
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
    }
  }, []);

  const getConnectionStatus = useCallback(() => {
    return serviceRef.current?.getConnectionStatus() || 'disconnected';
  }, []);

  const restartSpeechRecognition = useCallback(() => {
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

  useEffect(() => {
    createAudioElement();
    return () => {
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
    isMicrophoneMuted: microphoneControl.isMuted,
    microphoneAudioLevel: microphoneControl.audioLevel,
    toggleMicrophone: microphoneControl,
    muteMicrophone: microphoneControl,
    unmuteMicrophone: microphoneControl
  };
};