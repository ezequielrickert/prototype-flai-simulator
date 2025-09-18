import { realtimeAgentService, RealtimeAgentService, TeachingScenario } from './realtime-agent-service';

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
  scenario?: TeachingScenario;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";
  private agentService: RealtimeAgentService | null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.agentService = realtimeAgentService;
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }

  // Set the current agent based on scenario
  setAgent(scenario: TeachingScenario) {
    if (this.agentService) {
      this.agentService.setAgent(scenario);
    }
  }

  // Generate text using the configured agent with conversation history
  async generateResponse(
    messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>, 
    scenario?: TeachingScenario,
    conversationId?: string
  ) {
    try {
      // If scenario is provided, set the agent
      if (scenario && this.agentService) {
        this.agentService.setAgent(scenario);
        return await this.agentService.generateResponse(messages, conversationId);
      }

      // Fallback to direct OpenAI API call
      const systemPrompt = "You are an AI assistant for ethics and anti-corruption training. Provide helpful, educational responses in Spanish.";

      const messagesWithSystem = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messagesWithSystem,
          max_tokens: 1000,
          temperature: 0.7,
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

  // Generate speech from text using configured agent or default voice
  async textToSpeech(text: string, voice?: string): Promise<ArrayBuffer> {
    try {
      // Use agent service if available and agent is configured
      if (this.agentService && this.agentService.getCurrentAgent()) {
        return await this.agentService.textToSpeech(text);
      }

      // Fallback to direct API call with Spanish optimization
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'tts-1-hd', // Use HD model for better Spanish pronunciation
          input: text,
          voice: voice || 'echo', // Echo is a professional male voice
          response_format: 'mp3',
          speed: 0.9, // Slightly slower for clearer Spanish pronunciation
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
    return this.agentService?.getCurrentAgent();
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

  // Get available teaching scenarios
  getAvailableScenarios(): TeachingScenario[] {
    return RealtimeAgentService.getAvailableScenarios();
  }

  // Get conversation history
  getConversationHistory(conversationId: string) {
    if (this.agentService) {
      return this.agentService.getConversationHistory(conversationId);
    }
    return undefined;
  }

  // Clear conversation history
  clearConversationHistory(conversationId: string) {
    if (this.agentService) {
      this.agentService.clearConversationHistory(conversationId);
    }
  }

  // Get all conversation IDs
  getAllConversationIds(): string[] {
    if (this.agentService) {
      return this.agentService.getAllConversationIds();
    }
    return [];
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
