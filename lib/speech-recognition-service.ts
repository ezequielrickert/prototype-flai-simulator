export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private isPaused: boolean = false;
  private onResult?: (result: SpeechRecognitionResult) => void;
  private onError?: (error: string) => void;
  private onStart?: () => void;
  private onEnd?: () => void;
  private lastResultTime: number = 0;
  private minimumSpeechInterval: number = 500; // ms between speech results

  constructor(options: SpeechRecognitionOptions = {}) {
    if (!this.isSupported()) {
      console.warn('Speech recognition no está soportado en este navegador');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configuración para español
    this.recognition.lang = options.language || 'es-ES';
    this.recognition.continuous = options.continuous ?? true;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Reconocimiento de voz iniciado');
      this.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Reconocimiento de voz terminado');
      this.onEnd?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (this.isPaused) {
        console.log('Reconocimiento pausado, ignorando resultado');
        return;
      }

      const now = Date.now();
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;

        // Filtrar transcripciones muy cortas o con baja confianza
        if (transcript.length < 2) {
          continue;
        }

        // Para resultados finales, verificar que no sean demasiado frecuentes
        if (isFinal && (now - this.lastResultTime) < this.minimumSpeechInterval) {
          console.log('Resultado ignorado por intervalo mínimo:', transcript);
          continue;
        }

        // Filtrar palabras comunes que podrían ser eco de la IA
        const commonEchoWords = ['sí', 'no', 'bien', 'ok', 'claro', 'perfecto', 'exacto'];
        if (isFinal && transcript.length < 10 && commonEchoWords.some(word => 
          transcript.toLowerCase().includes(word.toLowerCase()))) {
          console.log('Posible eco filtrado:', transcript);
          continue;
        }

        if (isFinal) {
          this.lastResultTime = now;
        }

        this.onResult?.({
          transcript,
          confidence,
          isFinal
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Error en reconocimiento de voz:', event.error);
      let errorMessage = 'Error en el reconocimiento de voz';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No se detectó voz. Intenta hablar más cerca del micrófono.';
          break;
        case 'audio-capture':
          errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.';
          break;
        case 'not-allowed':
          errorMessage = 'Permiso de micrófono denegado. Habilítalo en la configuración del navegador.';
          break;
        case 'network':
          errorMessage = 'Error de red. Verifica tu conexión a internet.';
          break;
        case 'language-not-supported':
          errorMessage = 'El idioma español no está soportado en este dispositivo.';
          break;
      }
      
      this.onError?.(errorMessage);
    };
  }

  public setEventHandlers(handlers: {
    onResult?: (result: SpeechRecognitionResult) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }) {
    this.onResult = handlers.onResult;
    this.onError = handlers.onError;
    this.onStart = handlers.onStart;
    this.onEnd = handlers.onEnd;
  }

  public start(): void {
    if (!this.recognition) {
      this.onError?.('Reconocimiento de voz no soportado');
      return;
    }

    if (this.isListening) {
      console.warn('El reconocimiento de voz ya está activo');
      return;
    }

    try {
      this.isPaused = false;
      this.recognition.start();
    } catch (error) {
      console.error('Error al iniciar reconocimiento de voz:', error);
      this.onError?.('No se pudo iniciar el reconocimiento de voz');
    }
  }

  public pause(): void {
    console.log('Pausando reconocimiento de voz');
    this.isPaused = true;
    
    // Detener el reconocimiento actual si está activo
    if (this.isListening && this.recognition) {
      console.log('Deteniendo reconocimiento activo para pausar');
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error al pausar reconocimiento:', error);
      }
    }
  }

  public resume(): void {
    console.log('Reanudando reconocimiento de voz');
    this.isPaused = false;
    
    // Si no estamos escuchando, reiniciar el reconocimiento
    if (!this.isListening && this.recognition) {
      console.log('Reiniciando reconocimiento de voz después de pausa');
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Error al reiniciar reconocimiento:', error);
        // Si hay error porque ya está corriendo, ignorar
      }
    }
  }

  public stop(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error al detener reconocimiento de voz:', error);
    }
  }

  public isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public isPausedState(): boolean {
    return this.isPaused;
  }

  public cleanup(): void {
    this.stop();
    this.recognition = null;
  }
}
