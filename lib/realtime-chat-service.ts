export interface RealtimeMessage {
  id: string;
  text: string;
  speaker: 'user' | 'assistant' | 'system';
  timestamp: Date;
  audioUrl?: string;
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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setEventHandlers(handlers: {
    onStatusChange?: (status: string, type?: string) => void;
    onMessage?: (message: RealtimeMessage) => void;
    onAudioReceived?: (stream: MediaStream) => void;
  }) {
    this.onStatusChange = handlers.onStatusChange;
    this.onMessage = handlers.onMessage;
    this.onAudioReceived = handlers.onAudioReceived;
  }

  private updateStatus(message: string, type: string = 'normal') {
    this.onStatusChange?.(message, type);
  }

  private addMessage(text: string, speaker: 'user' | 'assistant' | 'system' = 'system') {
    const message: RealtimeMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      speaker,
      timestamp: new Date()
    };
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

      // Add microphone track to peer connection
      this.currentStream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.currentStream!);
      });

      // Set up audio output
      this.pc.ontrack = (event) => {
        console.log('Received audio track from OpenAI');
        this.onAudioReceived?.(event.streams[0]);
        this.addMessage('🔊 AI voice connected', 'system');
      };

      // Create data channel for text messages
      this.dc = this.pc.createDataChannel('oai-events');
      this.dc.onopen = () => {
        console.log('Data channel opened');
        this.addMessage('📡 Data channel connected', 'system');
      };

      this.dc.onmessage = (event) => {
        console.log('Assistant message:', event.data);
        this.addMessage(event.data, 'assistant');
      };

      // Handle connection state changes
      this.pc.onconnectionstatechange = () => {
        console.log('Connection state:', this.pc!.connectionState);
        if (this.pc!.connectionState === 'connected') {
          this.isConnected = true;
          this.updateStatus('Connected - You can speak now!', 'connected');
          this.addMessage('🎤 Microphone active - start speaking!', 'system');
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
      this.addMessage('🤖 AI assistant is ready to chat!', 'system');

    } catch (error) {
      console.error('Error starting conversation:', error);
      this.handleConnectionError((error as Error).message);
    }
  }

  async stopConversation(): Promise<void> {
    try {
      this.updateStatus('Disconnecting...', 'connecting');

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
      }

      this.isConnected = false;
      this.updateStatus('Disconnected', 'normal');
      this.addMessage('🔌 Conversation ended', 'system');

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