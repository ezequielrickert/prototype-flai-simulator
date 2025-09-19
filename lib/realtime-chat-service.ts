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
    private onTranscriptReceived?: (transcript: string, isPartial: boolean) => void;
    private onFinalFeedback?: (feedback: string) => void;
    private onFinalFeedbackDelta?: (delta: string, isPartial: boolean) => void;

    // Para manejar deltas de conversación
    private currentAssistantMessage: string = '';
    private assistantMessageId: string | null = null;
    private aiSpeakingTimeout: NodeJS.Timeout | null = null;
    private isCollectingFinalFeedback: boolean = false;
    private finalFeedbackBuffer: string = '';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    setEventHandlers(handlers: {
        onStatusChange?: (status: string, type?: string) => void;
        onMessage?: (message: RealtimeMessage) => void;
        onAudioReceived?: (stream: MediaStream) => void;
        onMicrophoneStream?: (stream: MediaStream | null) => void;
        onAISpeakingStateChange?: (isSpeaking: boolean) => void;
        onTranscriptReceived?: (transcript: string, isPartial: boolean) => void;
        onFinalFeedback?: (feedback: string) => void;
        onFinalFeedbackDelta?: (delta: string, isPartial: boolean) => void;
    }) {
        this.onStatusChange = handlers.onStatusChange;
        this.onMessage = handlers.onMessage;
        this.onAudioReceived = handlers.onAudioReceived;
        this.onMicrophoneStream = handlers.onMicrophoneStream;
        this.onAISpeakingStateChange = handlers.onAISpeakingStateChange;
        this.onTranscriptReceived = handlers.onTranscriptReceived;
        this.onFinalFeedback = handlers.onFinalFeedback;
        this.onFinalFeedbackDelta = handlers.onFinalFeedbackDelta;
    }

    private updateStatus(message: string, type: string = 'normal') {
        this.onStatusChange?.(message, type);
    }

    private handleRealtimeEvent(data: any) {
        console.log('Realtime event:', data);

        switch (data.type) {
            case 'response.audio_transcript.delta':
                if (data.delta) {
                    if (this.isCollectingFinalFeedback) {
                        this.finalFeedbackBuffer += data.delta;
                        console.log('Collecting final feedback delta:', data.delta);
                        this.onFinalFeedbackDelta?.(data.delta, true);
                    } else {
                        this.currentAssistantMessage += data.delta;
                        this.updateAssistantMessage(this.currentAssistantMessage, true);
                        this.onAISpeakingStateChange?.(true);

                        if (this.aiSpeakingTimeout) {
                            clearTimeout(this.aiSpeakingTimeout);
                        }
                        this.aiSpeakingTimeout = setTimeout(() => {
                            this.onAISpeakingStateChange?.(false);
                        }, 2000);
                    }
                }
                break;

            case 'response.audio_transcript.done':
                if (this.isCollectingFinalFeedback) {
                    if (this.finalFeedbackBuffer.trim()) {
                        console.log('Final feedback complete:', this.finalFeedbackBuffer.trim());
                        this.onFinalFeedbackDelta?.(this.finalFeedbackBuffer.trim(), false);
                        this.finalFeedbackBuffer = '';
                    }
                    this.isCollectingFinalFeedback = false;
                } else {
                    if (this.currentAssistantMessage) {
                        this.updateAssistantMessage(this.currentAssistantMessage, false);
                        this.currentAssistantMessage = '';
                        this.assistantMessageId = null;
                    }

                    if (this.aiSpeakingTimeout) {
                        clearTimeout(this.aiSpeakingTimeout);
                    }
                    setTimeout(() => {
                        console.log('AI terminó de hablar - enviando señal para reanudar speech recognition');
                        this.onAISpeakingStateChange?.(false);
                    }, 1000);
                }
                break;

            case 'response.text.delta':
                if (data.delta) {
                    if (this.isCollectingFinalFeedback) {
                        this.finalFeedbackBuffer += data.delta;
                        console.log('Collecting final feedback text delta:', data.delta);
                        this.onFinalFeedbackDelta?.(data.delta, true);
                    } else {
                        this.currentAssistantMessage += data.delta;
                        this.updateAssistantMessage(this.currentAssistantMessage, true);
                    }
                }
                break;

            case 'response.text.done':
                if (this.isCollectingFinalFeedback) {
                    if (this.finalFeedbackBuffer.trim()) {
                        console.log('Final feedback text complete:', this.finalFeedbackBuffer.trim());
                        this.onFinalFeedbackDelta?.(this.finalFeedbackBuffer.trim(), false);
                        this.finalFeedbackBuffer = '';
                    }
                    this.isCollectingFinalFeedback = false;
                } else {
                    if (this.currentAssistantMessage) {
                        this.updateAssistantMessage(this.currentAssistantMessage, false);
                        this.currentAssistantMessage = '';
                        this.assistantMessageId = null;
                    }
                }
                break;

            case 'conversation.item.created':
                if (!this.isCollectingFinalFeedback && data.item?.content) {
                    const content = Array.isArray(data.item.content) ? data.item.content[0] : data.item.content;
                    if (content?.transcript || content?.text) {
                        const text = content.transcript || content.text;
                        const speaker = data.item.role === 'user' ? 'user' : 'assistant';
                        this.addMessage(text, speaker, false);
                        if (speaker === 'user' && content.transcript) {
                            this.onTranscriptReceived?.(content.transcript, !!content.isPartial);
                        }
                    }
                }
                break;

            case 'response.done':
                if (this.isCollectingFinalFeedback) {
                    console.log('Response done during feedback collection - ignoring');
                } else {
                    console.log('Respuesta de IA completamente terminada');
                    if (this.aiSpeakingTimeout) {
                        clearTimeout(this.aiSpeakingTimeout);
                    }
                    setTimeout(() => {
                        console.log('Response done - enviando señal para reanudar speech recognition');
                        this.onAISpeakingStateChange?.(false);
                    }, 800);
                }
                break;

            default:
                console.log('Unhandled realtime event:', data.type);
                break;
        }
    }

    private updateAssistantMessage(text: string, isPartial: boolean) {
        if (!this.assistantMessageId) {
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

            this.pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            this.currentStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.onMicrophoneStream?.(this.currentStream);

            this.currentStream.getTracks().forEach(track => {
                this.pc!.addTrack(track, this.currentStream!);
            });

            this.pc.ontrack = (event) => {
                console.log('Received audio track from OpenAI');
                this.onAudioReceived?.(event.streams[0]);
            };

            this.dc = this.pc.createDataChannel('oai-events');
            this.dc.onopen = () => {
                console.log('Data channel opened');
                if (this.dc && this.dc.readyState === 'open') {
                    const systemMessage = {
                        type: 'session.update',
                        session: {
                            instructions: `${MARCUS_PERSONALITY}

IMPORTANTE: Durante esta sesión, mantén un registro mental detallado de:
- Las decisiones éticas discutidas y el razonamiento del usuario
- Fortalezas y debilidades en el pensamiento ético mostrado
- Momentos clave de aprendizaje o comprensión
- Patrones en el enfoque del usuario hacia dilemas éticos

Al final de la sesión, cuando se solicite, proporcionarás un feedback integral estructurado que refleje sobre toda la conversación, identificando qué estuvo bien, qué se puede mejorar, y el valor del aprendizaje obtenido.`
                        }
                    };
                    this.dc.send(JSON.stringify(systemMessage));
                    console.log('Sent Marcus personality instructions with memory guidance');
                }
            };

            this.dc.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleRealtimeEvent(data);
                } catch (error) {
                    console.log('Assistant message:', event.data);
                    this.addMessage(event.data, 'assistant');
                }
            };

            this.pc.onconnectionstatechange = () => {
                console.log('Connection state:', this.pc!.connectionState);
                if (this.pc!.connectionState === 'connected') {
                    this.isConnected = true;
                    this.updateStatus('Connected - You can speak now!', 'connected');
                    this.addMessage('🎤 Ready to chat! Start speaking...', 'system');

                    if (this.dc && this.dc.readyState === 'open') {
                        const sessionStartMessage = {
                            "type": "response.create",
                            "response": {
                                "instructions": "Saluda al usuario como Marcus e inicia la sesión de coaching ético. Explica brevemente que al final de la sesión proporcionarás una reflexión integral sobre las decisiones éticas discutidas. Pregúntale qué situación o dilema ético le gustaría explorar hoy."
                            }
                        };
                        this.dc.send(JSON.stringify(sessionStartMessage));
                        console.log('Sent session start message');
                    }
                } else if (this.pc!.connectionState === 'failed' || this.pc!.connectionState === 'disconnected') {
                    this.handleConnectionError('Connection failed');
                }
            };

            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);

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

            const answerSdp = await response.text();
            const answer = {
                type: 'answer' as RTCSdpType,
                sdp: answerSdp
            };

            await this.pc.setRemoteDescription(answer);

        } catch (error) {
            console.error('Error starting conversation:', error);
            this.handleConnectionError((error as Error).message);
        }
    }

    async stopConversation(): Promise<void> {
        try {
            this.updateStatus('Stopping microphone and generating final reflection...', 'thinking');

            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
                this.onMicrophoneStream?.(null);
                console.log('Microphone stopped for feedback generation');
            }

            this.isCollectingFinalFeedback = true;
            this.finalFeedbackBuffer = '';

            if (this.dc && this.dc.readyState === 'open') {
                const finalFeedbackRequest = {
                    "type": "response.create",
                    "response": {
                        "instructions": `Como Marcus, tu coach de ética empresarial, proporciona una reflexión final integral de esta sesión de coaching basada en toda nuestra conversación. 

Estructura tu respuesta en estas tres secciones:

**¿Qué estuvo bien?**
- Identifica decisiones éticas sólidas y fortalezas demostradas
- Reconoce momentos de buena reflexión crítica
- Destaca habilidades de liderazgo ético mostradas

**¿Qué se puede mejorar?**
- Señala áreas donde las decisiones podrían haberse beneficiado de mayor consideración ética
- Identifica patrones de pensamiento que podrían necesitar desarrollo
- Sugiere marcos éticos específicos que podrían haber sido útiles

**Valor del aprendizaje**
- Resume las lecciones clave obtenidas durante la sesión
- Conecta estos aprendizajes con situaciones futuras de liderazgo
- Proporciona 2-3 acciones concretas para continuar el desarrollo ético

Mantén un tono constructivo, alentador pero honesto. Usa ejemplos específicos de nuestra conversación. Limita tu respuesta a 300-400 palabras para que sea concisa pero significativa.`
                    }
                };
                this.dc.send(JSON.stringify(finalFeedbackRequest));
                console.log('Sent comprehensive final feedback request');

                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            this.updateStatus('Disconnecting...', 'connecting');

            if (this.dc) {
                this.dc.close();
                this.dc = null;
            }

            if (this.pc) {
                this.pc.close();
                this.pc = null;
            }

            this.isConnected = false;
            this.updateStatus('Disconnected', 'normal');
            this.addMessage('Conversation ended', 'system');

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
            this.onMicrophoneStream?.(null);
        }
    }

    sendTextMessage(message: string) {
        if (this.dc && this.dc.readyState === 'open') {
            this.dc.send(message);
            this.addMessage(message, 'user');
        } else {
            console.warn('Data channel not open, cannot send message');
        }
    }

    sendUserTranscription(transcript: string, isPartial: boolean = false) {
        if (this.dc && this.dc.readyState === 'open') {
            const userMessage = {
                type: 'conversation.item.created',
                item: {
                    role: 'user',
                    content: {
                        transcript,
                        isPartial
                    }
                }
            };
            this.dc.send(JSON.stringify(userMessage));
            this.addMessage(transcript, 'user', isPartial);
        } else {
            console.warn('Data channel not open, cannot send user transcription');
        }
    }

    getConnectionStatus(): string {
        if (!this.pc) return 'disconnected';
        return this.pc.connectionState;
    }

    getIsConnected(): boolean {
        return this.isConnected;
    }

    cleanup() {
        this.stopConversation();
    }
}

export const createRealtimeService = () => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key not found');
    }

    return new OpenAIRealtimeService(apiKey);
};

export const realtimeService = createRealtimeService();
