export interface RealtimeMessage {
  id: string;
  text: string;
  speaker: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isComplete?: boolean;
  audioUrl?: string;
  messageType?: 'text' | 'audio' | 'status';
  status?: string;
  error?: string;
  sessionId?: string;
}

export interface RealtimeConversation {
  id: string;
  messages: RealtimeMessage[];
  createdAt: Date;
  lastMessageAt: Date;
  sessionId?: string;
  status: 'active' | 'ended' | 'error';
}

export class OpenAIRealtimeService {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private isConnected: boolean = false;
  private currentStream: MediaStream | null = null;
  private apiKey: string;
  
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
      id: Date.now().toString(),
      text,
      speaker,
      timestamp: new Date(),
      messageType: 'text'
    };
    this.onMessage?.(message);
  }

  async connect(): Promise<void> {
    try {
      this.updateStatus('Connecting to OpenAI Realtime API...', 'connecting');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      this.currentStream = stream;

      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      stream.getTracks().forEach(track => {
        this.pc?.addTrack(track, stream);
      });

      this.pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        this.onAudioReceived?.(remoteStream);
      };

      this.dc = this.pc.createDataChannel('chat', { ordered: true });
      this.dc.onopen = () => {
        this.isConnected = true;
        this.updateStatus('Connected! Ready to chat.', 'connected');
        this.addMessage('Connection established. You can start speaking now.', 'system');
      };

      this.dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'response' && data.text) {
            this.addMessage(data.text, 'assistant');
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const response = await fetch('/api/openai-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          offer: offer,
          model: 'gpt-4o-realtime-preview'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { answer } = await response.json();
      await this.pc.setRemoteDescription(answer);

      this.updateStatus('Establishing connection...', 'connecting');

    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus(`Connection failed: ${errorMessage}`, 'error');
      this.addMessage(`Connection error: ${errorMessage}`, 'system');
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.dc) {
        this.dc.close();
        this.dc = null;
      }
      
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }

      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }

      this.isConnected = false;
      this.updateStatus('Disconnected', 'disconnected');
      this.addMessage('Disconnected from OpenAI Realtime API.', 'system');
    } catch (error) {
      console.error('Disconnect error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus(`Disconnect error: ${errorMessage}`, 'error');
    }
  }

  sendMessage(text: string): void {
    if (!this.isConnected || !this.dc) {
      this.updateStatus('Not connected. Please connect first.', 'error');
      return;
    }

    try {
      const message = {
        type: 'conversation.item.create',
        text: text,
        timestamp: new Date().toISOString()
      };
      
      this.dc.send(JSON.stringify(message));
      this.addMessage(text, 'user');
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus(`Send error: ${errorMessage}`, 'error');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }
}