import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useElevenLabsChat } from '@/hooks/use-elevenlabs-chat';
import { Mic, MicOff, Send, Volume2, VolumeX, MessageCircle } from 'lucide-react';

interface ElevenLabsChatbotProps {
  scenario?: {
    title: string;
    description: string;
  };
  className?: string;
}

export const ElevenLabsChatbot: React.FC<ElevenLabsChatbotProps> = ({ 
  scenario, 
  className = '' 
}) => {
  const {
    conversation,
    isLoading,
    error,
    sendMessage,
    startNewConversation,
    playAudio,
  } = useElevenLabsChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'es-AR'; // Argentine Spanish

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = () => {
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    try {
      await sendMessage(inputMessage, scenario);
      setInputMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handlePlayAudio = async (audioUrl: string) => {
    if (audioUrl) {
      await playAudio(audioUrl);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            ElevenLabs AI Assistant
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={conversation?.isActive ? "default" : "secondary"}>
              {conversation?.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={startNewConversation}
            >
              New Chat
            </Button>
          </div>
        </div>
        {scenario && (
          <div className="text-sm text-muted-foreground">
            <strong>Scenario:</strong> {scenario.title}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {conversation?.messages.length ? (
            conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.speaker === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm">{message.text}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                    {message.speaker === 'agent' && message.audioUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayAudio(message.audioUrl!)}
                        className="h-6 w-6 p-0"
                      >
                        <Volume2 className="w-3 h-3" />
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
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
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
              className="w-full p-3 border rounded-lg resize-none min-h-[50px] max-h-[120px] pr-12"
              disabled={isLoading}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceInput}
              className={`absolute right-2 top-2 h-8 w-8 p-0 ${
                isRecording ? 'text-red-500' : ''
              }`}
              disabled={isLoading}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="h-[50px] px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              AI is thinking...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
