import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOpenAIChat } from '@/hooks/use-openai-chat';
import { EthicalDilemma } from '@/lib/professor-agent-service';
import { ConversationFeedbackDisplay } from '@/components/conversation-feedback';
import { Mic, MicOff, Send, Volume2, MessageCircle, GraduationCap, ChevronDown } from 'lucide-react';

interface OpenAIChatbotProps {
  dilemma?: EthicalDilemma;
  className?: string;
}

export const OpenAIChatbot: React.FC<OpenAIChatbotProps> = ({ 
  dilemma, 
  className = '' 
}) => {
  const {
    conversation,
    isLoading,
    error,
    currentDilemma,
    sendMessage,
    startNewSession,
    setDilemma,
    getAvailableDilemmas,
    playAudio,
  } = useOpenAIChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [availableDilemmas, setAvailableDilemmas] = useState<EthicalDilemma[]>([]);
  const [showDilemmas, setShowDilemmas] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [useWhisper, setUseWhisper] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load available dilemmas
  useEffect(() => {
    const loadDilemmas = async () => {
      const dilemmas = await getAvailableDilemmas();
      setAvailableDilemmas(dilemmas);
    };
    loadDilemmas();
  }, [getAvailableDilemmas]);

  // Set initial dilemma
  useEffect(() => {
    if (dilemma && !currentDilemma) {
      setDilemma(dilemma);
    }
  }, [dilemma, currentDilemma, setDilemma]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'es-419'; // Latin American Spanish

      recognitionInstance.onresult = (event: any) => {
        console.log('[Speech Recognition] Result received:', event);
        const transcript = event.results[0][0].transcript;
        console.log('[Speech Recognition] Transcript:', transcript);
        setInputMessage(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('[Speech Recognition] Error:', event.error);
        setIsRecording(false);
        
        let errorMessage = 'Error en reconocimiento de voz';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No se detectó voz. Intenta hablar más alto.';
            break;
          case 'audio-capture':
            errorMessage = 'Error en el micrófono. Verifica los permisos.';
            break;
          case 'not-allowed':
            errorMessage = 'Permisos de micrófono denegados. Habilita el micrófono en tu navegador.';
            break;
          case 'network':
            errorMessage = 'Error de red. Verifica tu conexión a internet.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Servicio de reconocimiento de voz no disponible.';
            break;
        }
        
        setSpeechError(errorMessage);
        setTimeout(() => setSpeechError(null), 5000);
      };

      recognitionInstance.onstart = () => {
        console.log('[Speech Recognition] Started');
        setSpeechError(null);
      };

      recognitionInstance.onend = () => {
        console.log('[Speech Recognition] Ended');
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('[Speech Recognition] webkitSpeechRecognition not available');
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    try {
      const aiMessage = await sendMessage(inputMessage);
      setInputMessage('');
      
      // Auto-play AI response if audio is available
      if (aiMessage.audioUrl) {
        playAudio(aiMessage.text);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = async () => {
    if (useWhisper) {
      await toggleWhisperRecording();
    } else {
      await toggleBrowserRecording();
    }
  };

  const toggleBrowserRecording = async () => {
    if (!recognition) {
      setSpeechError('Speech recognition is not supported in this browser. Try switching to OpenAI Whisper mode.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    if (isRecording) {
      console.log('[Speech Recognition] Stopping...');
      try {
        recognition.stop();
        setIsRecording(false);
      } catch (error) {
        console.error('[Speech Recognition] Error stopping:', error);
        setIsRecording(false);
      }
    } else {
      console.log('[Speech Recognition] Starting...');
      setSpeechError(null);
      try {
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error('[Speech Recognition] Error starting:', error);
        setSpeechError('Error al iniciar reconocimiento de voz. Verifica los permisos del micrófono.');
        setTimeout(() => setSpeechError(null), 5000);
        setIsRecording(false);
      }
    }
  };

  const toggleWhisperRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setSpeechError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const audioChunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        recorder.onstop = async () => {
          console.log('[Whisper Recording] Processing audio...');
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          
          try {
            // Convert to a format OpenAI can handle
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            const response = await fetch('/api/speech-to-text', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
              setInputMessage(result.transcript);
              console.log('[Whisper] Transcript:', result.transcript);
            } else {
              setSpeechError(result.error || 'Error transcribing audio');
              setTimeout(() => setSpeechError(null), 5000);
            }
          } catch (error) {
            console.error('[Whisper] Error:', error);
            setSpeechError('Error processing audio. Please try again.');
            setTimeout(() => setSpeechError(null), 5000);
          }
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
        };
        
        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);
        console.log('[Whisper Recording] Started');
        
      } catch (error) {
        console.error('[Whisper Recording] Error accessing microphone:', error);
        setSpeechError('Error accessing microphone. Please check permissions.');
        setTimeout(() => setSpeechError(null), 5000);
      }
    }
  };

  const handlePlayAudio = (text: string) => {
    playAudio(text);
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">OpenAI Assistant</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {currentDilemma ? `Marcus - Coach de Ética: ${currentDilemma.title}` : 'Chat with Marcus - Coach de Ética Empresarial'}
            </p>
          </div>
          <div className="flex gap-2">
                        {currentDilemma && (
              <Badge variant="secondary" className="ml-2">
                {currentDilemma.category}
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDilemmas(!showDilemmas)}
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Select Agent
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => startNewSession()}
            >
              New Chat
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Scenario Selection */}
        {showDilemmas && (
          <div className="p-4 border-b bg-muted/30">
            <h3 className="text-sm font-medium mb-3">Selecciona un Agente Especializado:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {availableDilemmas.map((d) => (
                <Button
                  key={d.id}
                  variant={currentDilemma?.id === d.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDilemma(d);
                    setShowDilemmas(false);
                  }}
                  className="justify-start text-left h-auto p-3"
                >
                  <div>
                    <div className="font-medium text-sm">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.scenario}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {conversation?.messages && conversation.messages.length > 0 ? (
            conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.speaker === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.speaker === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayAudio(message.text)}
                        className="h-6 w-6 p-0"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start a conversation with the AI assistant</p>
                <p className="text-sm">Ask questions about ethics and anti-corruption</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Speech Recognition Error Display */}
        {speechError && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-2">
            <p className="text-sm text-orange-700">{speechError}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or use voice input..."
              className="w-full p-3 border rounded-lg resize-none min-h-[50px] max-h-32"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRecording}
              disabled={isLoading}
              className={isRecording ? 'bg-red-100 text-red-600' : ''}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Speech Recognition Mode Toggle */}
        <div className="flex justify-center items-center gap-2 p-2 text-xs text-muted-foreground">
          <span>Speech Mode:</span>
          <Button
            variant={useWhisper ? "outline" : "secondary"}
            size="sm"
            onClick={() => setUseWhisper(false)}
            className="h-6 px-2 text-xs"
          >
            Browser
          </Button>
          <Button
            variant={useWhisper ? "secondary" : "outline"}
            size="sm"
            onClick={() => setUseWhisper(true)}
            className="h-6 px-2 text-xs"
          >
            OpenAI Whisper
          </Button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Thinking...
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Conversation Feedback */}
      {conversation && conversation.messages && conversation.messages.length > 2 && (
        <div className="p-4 border-t">
          <ConversationFeedbackDisplay 
            conversationId={conversation.id}
            autoTriggerSeconds={30}
            className="w-full"
          />
        </div>
      )}
    </Card>
  );
};
