import { professorAgentService, ProfessorAgentService, EthicalDilemma } from './professor-agent-service';

export interface OpenAIMessage {
  id: string;
  text: string;
  speaker: 'user' | 'assistant';
  timestamp: Date;
  audioUrl?: string;
}

export interface OpenAIConversation {
  id: string;
  messages: OpenAIMessage[];
  isActive: boolean;
  dilemma?: EthicalDilemma;
  sessionId?: string;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";
  private agentService: ProfessorAgentService | null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.agentService = professorAgentService;
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }

  // Start a new coaching session
  async startCoachingSession(sessionId: string) {
    if (this.agentService) {
      return await this.agentService.startNewSession(sessionId);
    }
    throw new Error('Professor agent service not available');
  }

  // Generate response using the professor agent with session context
  async generateResponse(
    userMessage: string,
    sessionId: string
  ) {
    try {
      // Use professor agent service if available
      if (this.agentService) {
        return await this.agentService.processUserResponse(sessionId, userMessage);
      }

      // Fallback to direct OpenAI API call
      const systemPrompt = "Eres Marcus, un coach de ética empresarial reflexivo y profesional que ayuda a desarrollar habilidades de toma de decisiones éticas.";

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 800,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error("Failed to generate response:", error);
      throw error;
    }
  }

  // Generate speech from text using Marcus's voice
  async textToSpeech(text: string, voice?: string): Promise<ArrayBuffer> {
    try {
      // Use professor agent service if available
      if (this.agentService) {
        return await this.agentService.textToSpeech(text);
      }

      // Fallback to direct API call with Spanish optimization
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'tts-1-hd', // Use HD model for better Spanish pronunciation
          input: text,
          voice: voice || 'onyx', // Use Marcus's voice by default
          response_format: 'mp3',
          speed: 0.85, // Slightly slower for coaching tone
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error("Failed to generate speech:", error);
      throw error;
    }
  }

  // Get current agent info
  getCurrentAgent() {
    return this.agentService?.getAgentConfig();
  }

  // Transcribe audio using OpenAI Whisper
  async speechToText(audioFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'es'); // Spanish

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Failed to transcribe audio:", error);
      throw error;
    }
  }

  // Get available voices for TTS
  getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', description: 'Neutral voice' },
      { id: 'echo', name: 'Echo', description: 'Male voice' },
      { id: 'fable', name: 'Fable', description: 'British male voice' },
      { id: 'onyx', name: 'Onyx', description: 'Deep male voice' },
      { id: 'nova', name: 'Nova', description: 'Female voice' },
      { id: 'shimmer', name: 'Shimmer', description: 'Soft female voice' },
    ];
  }

  // Get available ethical dilemmas
  getAvailableDilemmas(): EthicalDilemma[] {
    if (this.agentService) {
      return this.agentService.getAvailableDilemmas();
    }
    return [];
  }

  // Get coaching session details
  getCoachingSession(sessionId: string) {
    if (this.agentService) {
      return this.agentService.getSession(sessionId);
    }
    return undefined;
  }

  // End a coaching session
  endCoachingSession(sessionId: string) {
    if (this.agentService) {
      this.agentService.endSession(sessionId);
    }
  }

  // Get all active sessions
  getAllActiveSessions() {
    if (this.agentService) {
      return this.agentService.getAllSessions();
    }
    return [];
  }

  // Generate session feedback
  async generateSessionFeedback(sessionId: string) {
    if (this.agentService) {
      return await this.agentService.generateSessionFeedback(sessionId);
    }
    return null;
  }
}

// Export a configured instance
export const createOpenAIService = () => {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIService(process.env.OPENAI_API_KEY);
  }
  return null;
};

// Export a configured instance
export const openaiService = createOpenAIService();
