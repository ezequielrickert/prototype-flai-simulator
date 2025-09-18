// Utility functions for speech recognition

export interface SpeechRecognitionResult {
  transcript: string;
  confidence?: number;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export class SpeechRecognitionManager {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private useWhisper: boolean = false;
  private isRecording: boolean = false;

  constructor(useWhisper: boolean = false) {
    this.useWhisper = useWhisper;
  }

  async initialize(options: SpeechRecognitionOptions = {}): Promise<boolean> {
    if (this.useWhisper) {
      return await this.initializeWhisper(options);
    } else {
      return this.initializeBrowser(options);
    }
  }

  private initializeBrowser(options: SpeechRecognitionOptions): boolean {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
      console.warn('[Speech Recognition] Browser speech recognition not available');
      return false;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = options.continuous ?? false;
      this.recognition.interimResults = options.interimResults ?? false;
      this.recognition.lang = options.language ?? 'es-419'; // Latin American Spanish by default

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        options.onResult?.({ transcript, confidence });
      };

      this.recognition.onerror = (event: any) => {
        console.error('[Speech Recognition] Error:', event.error);
        
        let errorMessage = 'Error en reconocimiento de voz';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No se detectó voz. Intenta hablar más alto.';
            break;
          case 'audio-capture':
            errorMessage = 'Error en el micrófono. Verifica los permisos.';
            break;
          case 'not-allowed':
            errorMessage = 'Permisos de micrófono denegados.';
            break;
          case 'network':
            errorMessage = 'Error de red. Verifica tu conexión.';
            break;
        }
        
        options.onError?.(errorMessage);
      };

      this.recognition.onstart = () => {
        console.log('[Speech Recognition] Started');
        this.isRecording = true;
        options.onStart?.();
      };

      this.recognition.onend = () => {
        console.log('[Speech Recognition] Ended');
        this.isRecording = false;
        options.onEnd?.();
      };

      return true;
    } catch (error) {
      console.error('[Speech Recognition] Failed to initialize:', error);
      return false;
    }
  }

  private async initializeWhisper(options: SpeechRecognitionOptions): Promise<boolean> {
    try {
      // Check if MediaRecorder is available
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        console.warn('[Whisper] MediaRecorder not available');
        return false;
      }
      return true;
    } catch (error) {
      console.error('[Whisper] Failed to initialize:', error);
      return false;
    }
  }

  async start(): Promise<boolean> {
    if (this.useWhisper) {
      return await this.startWhisper();
    } else {
      return this.startBrowser();
    }
  }

  private startBrowser(): boolean {
    if (!this.recognition) {
      console.error('[Speech Recognition] Not initialized');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('[Speech Recognition] Failed to start:', error);
      return false;
    }
  }

  private async startWhisper(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const audioChunks: Blob[] = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        console.log('[Whisper] Processing audio...');
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Simulate the browser API structure
            this.options.onResult?.({ transcript: result.transcript });
          } else {
            this.options.onError?.(result.error || 'Error transcribing audio');
          }
        } catch (error) {
          console.error('[Whisper] Error:', error);
          this.options.onError?.('Error processing audio');
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        this.isRecording = false;
        this.options.onEnd?.();
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      this.options.onStart?.();
      
      return true;
    } catch (error) {
      console.error('[Whisper] Error accessing microphone:', error);
      return false;
    }
  }

  stop(): void {
    if (this.useWhisper) {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    } else {
      if (this.recognition) {
        this.recognition.stop();
      }
    }
  }

  isActive(): boolean {
    return this.isRecording;
  }

  switchMode(useWhisper: boolean): void {
    if (this.isRecording) {
      this.stop();
    }
    this.useWhisper = useWhisper;
  }

  private options: SpeechRecognitionOptions = {};

  setOptions(options: SpeechRecognitionOptions): void {
    this.options = options;
  }
}
