import { MARCUS_PERSONALITY } from './marcus-personality';

export interface RealtimeMessage {
  id: string;
  text: string;
  speaker: 'user' | 'assistant' | 'system';
  timestamp: Date;
  audioUrl?: string;
  isPartial?: boolean;
  confidence?: number;
}

export interface RealtimeConversation {
  id: string;
  messages: RealtimeMessage[];
  isActive: boolean;
  sessionId?: string;
}

export class OpenAIRealtimeService {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private isConnected: boolean = false;
  private apiKey: string;
  private currentStream: MediaStream | null = null;
  private onStatusChange?: (status: string, type?: string) => void;
  private onMessage?: (message: RealtimeMessage) => void;
  private onAudioReceived?: (stream: MediaStream) => void;
  private onMicrophoneStream?: (stream: MediaStream | null) => void;
  private onAISpeakingStateChange?: (isSpeaking: boolean) => void;
  
  // Para manejar deltas de conversación
  private currentAssistantMessage: string = '';
  private currentUserMessage: string = '';
  private assistantMessageId: string | null = null;
  private aiSpeakingTimeout: NodeJS.Timeout | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setEventHandlers(handlers: {
    onStatusChange?: (status: string, type?: string) => void;
    onMessage?: (message: RealtimeMessage) => void;
    onAudioReceived?: (stream: MediaStream) => void;
    onMicrophoneStream?: (stream: MediaStream | null) => void;
    onAISpeakingStateChange?: (isSpeaking: boolean) => void;
  }) {
    this.onStatusChange = handlers.onStatusChange;
    this.onMessage = handlers.onMessage;
    this.onAudioReceived = handlers.onAudioReceived;
    this.onMicrophoneStream = handlers.onMicrophoneStream;
    this.onAISpeakingStateChange = handlers.onAISpeakingStateChange;
  }

  private updateStatus(message: string, type: string = 'normal') {
    this.onStatusChange?.(message, type);
  }

  private handleRealtimeEvent(data: any) {
    console.log('Realtime event:', data);
    
    switch (data.type) {
      case 'response.audio_transcript.delta':
        // Delta de transcripción de audio del asistente
        if (data.delta) {
          this.currentAssistantMessage += data.delta;
          this.updateAssistantMessage(this.currentAssistantMessage, true);
          
          // Notificar que la IA está hablando
          this.onAISpeakingStateChange?.(true);
          
          // Resetear el timeout para cuando termine de hablar
          if (this.aiSpeakingTimeout) {
            clearTimeout(this.aiSpeakingTimeout);
          }
          this.aiSpeakingTimeout = setTimeout(() => {
            this.onAISpeakingStateChange?.(false);
          }, 2000); // 2 segundos sin deltas = IA terminó de hablar
        }
        break;
        
      case 'response.audio_transcript.done':
        // Transcripción del asistente completada
        if (this.currentAssistantMessage) {
          this.updateAssistantMessage(this.currentAssistantMessage, false);
          this.currentAssistantMessage = '';
          this.assistantMessageId = null;
        }
        
        // IA terminó de hablar definitivamente
        if (this.aiSpeakingTimeout) {
          clearTimeout(this.aiSpeakingTimeout);
        }
        setTimeout(() => {
          console.log('AI terminó de hablar - enviando señal para reanudar speech recognition');
          this.onAISpeakingStateChange?.(false);
        }, 1000); // Esperar 1 segundo antes de reanudar
        break;
        
      case 'response.text.delta':
        // Delta de respuesta de texto del asistente
        if (data.delta) {
          this.currentAssistantMessage += data.delta;
          this.updateAssistantMessage(this.currentAssistantMessage, true);
        }
        break;
        
      case 'response.text.done':
        // Respuesta de texto del asistente completada
        if (this.currentAssistantMessage) {
          this.updateAssistantMessage(this.currentAssistantMessage, false);
          this.currentAssistantMessage = '';
          this.assistantMessageId = null;
        }
        break;
        
      case 'conversation.item.created':
        // Nuevo item de conversación creado
        if (data.item?.content) {
          const content = Array.isArray(data.item.content) ? data.item.content[0] : data.item.content;
          if (content?.transcript || content?.text) {
            const text = content.transcript || content.text;
            const speaker = data.item.role === 'user' ? 'user' : 'assistant';
            this.addMessage(text, speaker, false);
          }
        }
        break;
        
      case 'response.done':
        // La respuesta completa de la IA ha terminado
        console.log('Respuesta de IA completamente terminada');
        if (this.aiSpeakingTimeout) {
          clearTimeout(this.aiSpeakingTimeout);
        }
        setTimeout(() => {
          console.log('Response done - enviando señal para reanudar speech recognition');
          this.onAISpeakingStateChange?.(false);
        }, 800);
        break;
        
      default:
        console.log('Unhandled realtime event:', data.type);
        break;
    }
  }

  private updateAssistantMessage(text: string, isPartial: boolean) {
    if (!this.assistantMessageId) {
      // Crear nuevo mensaje
      this.assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const message: RealtimeMessage = {
      id: this.assistantMessageId,
      text,
      speaker: 'assistant',
      timestamp: new Date(),
      isPartial
    };
    this.onMessage?.(message);
  }

  private addMessage(text: string, speaker: 'user' | 'assistant' | 'system' = 'system', isPartial: boolean = false, confidence?: number) {
    // Filter out technical debug messages for better UX
    const isDebugMessage = text.includes('Data channel') || 
                          text.includes('voice connected') || 
                          text.includes('🔊') || 
                          text.includes('📡') ||
                          text.includes('🤖 AI assistant is ready');
    
    if (isDebugMessage) {
      console.log(`[Debug] ${text}`);
      return;
    }

    console.log(`Adding message - Speaker: ${speaker}, Text: "${text}", Partial: ${isPartial}`);

    const message: RealtimeMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      speaker,
      timestamp: new Date(),
      isPartial,
      confidence
    };
    
    console.log('Calling onMessage with:', message);
    this.onMessage?.(message);
  }

  async startConversation(): Promise<void> {
    try {
      this.updateStatus('Connecting...', 'connecting');
      
      // Create RTCPeerConnection
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Get user media (microphone)
      this.currentStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Notify about microphone stream
      this.onMicrophoneStream?.(this.currentStream);

      // Add microphone track to peer connection
      this.currentStream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.currentStream!);
      });

      // Set up audio output
      this.pc.ontrack = (event) => {
        console.log('Received audio track from OpenAI');
        this.onAudioReceived?.(event.streams[0]);
        // Removed debug message: this.addMessage('🔊 AI voice connected', 'system');
      };

      // Create data channel for text messages
      this.dc = this.pc.createDataChannel('oai-events');
      this.dc.onopen = () => {
        console.log('Data channel opened');
        // Send Marcus personality instructions via data channel once connected
        if (this.dc && this.dc.readyState === 'open') {
          const systemMessage = {
            type: 'session.update',
            session: {
              instructions: MARCUS_PERSONALITY
            }
          };
          this.dc.send(JSON.stringify(systemMessage));
          console.log('Sent Marcus personality instructions');
        }
      };

      this.dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeEvent(data);
        } catch (error) {
          // Fallback para mensajes de texto simple
          console.log('Assistant message:', event.data);
          this.addMessage(event.data, 'assistant');
        }
      };

      // Handle connection state changes
      this.pc.onconnectionstatechange = () => {
        console.log('Connection state:', this.pc!.connectionState);
        if (this.pc!.connectionState === 'connected') {
          this.isConnected = true;
          this.updateStatus('Connected - You can speak now!', 'connected');
          this.addMessage('🎤 Ready to chat! Start speaking...', 'system');
        } else if (this.pc!.connectionState === 'failed' || this.pc!.connectionState === 'disconnected') {
          this.handleConnectionError('Connection failed');
        }
      };

      // Create SDP offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Send offer to OpenAI Realtime API
      const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // Set remote description with the answer from OpenAI
      const answerSdp = await response.text();
      const answer = {

        type: 'answer' as RTCSdpType,
        sdp: answerSdp
      };

      await this.pc.setRemoteDescription(answer);
      // Removed debug message that was cluttering the UI

    } catch (error) {
      console.error('Error starting conversation:', error);
      this.handleConnectionError((error as Error).message);
    }
  }

  async stopConversation(): Promise<void> {
    try {
      this.updateStatus('Disconnecting...', 'connecting');

      // Send final feedback request before closing the connection
      if (this.dc && this.dc.readyState === 'open') {
        const finalFeedbackRequest = {
          "type": "response.create",
          "response": {
            "instructions": "Por favor genera un resumen final de la retroalimentación sobre las decisiones éticas del usuario en esta sesión. Mantén el tono profesional y conciso, resaltando fortalezas y posibles áreas de mejora."
          }
        };
        this.dc.send(JSON.stringify(finalFeedbackRequest));
        console.log('Sent final feedback request');
        
        // Wait a moment for the response before closing
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (this.dc) {
        this.dc.close();
        this.dc = null;
      }

      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }

      // Stop all media tracks
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
        // Notify about stream removal
        this.onMicrophoneStream?.(null);
      }

      this.isConnected = false;
      this.updateStatus('Disconnected', 'normal');
      this.addMessage('� Conversation ended', 'system');

    } catch (error) {
      console.error('Error stopping conversation:', error);
      this.handleConnectionError('Error disconnecting');
    }
  }

  private handleConnectionError(errorMessage: string) {
    this.updateStatus(`Error: ${errorMessage}`, 'error');
    this.addMessage(`❌ Error: ${errorMessage}`, 'system');
    this.isConnected = false;

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
      // Notify about stream removal
      this.onMicrophoneStream?.(null);
    }
  }

  // Send a text message through the data channel
  sendTextMessage(message: string) {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(message);
      this.addMessage(message, 'user');
    } else {
      console.warn('Data channel not open, cannot send message');
    }
  }

  // Get connection status
  getConnectionStatus(): string {
    if (!this.pc) return 'disconnected';
    return this.pc.connectionState;
  }

  // Check if connected
  getIsConnected(): boolean {
    return this.isConnected;
  }

  // Método para enviar transcripción del usuario
  // Cleanup method
  cleanup() {
    this.stopConversation();
  }
}

// Factory function to create the service
export const createRealtimeService = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }
  
  return new OpenAIRealtimeService(apiKey);
};

// Export a default instance
export const realtimeService = createRealtimeService();