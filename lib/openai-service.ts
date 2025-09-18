import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }

  // Generate text using OpenAI Chat Completions
  async generateResponse(messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>, scenario?: any) {
    try {
      // Add system prompt if scenario is provided
      const systemPrompt = scenario 
        ? `You are an AI assistant for ethics and anti-corruption training. Current scenario: ${scenario.title} - ${scenario.description}. Provide helpful, educational responses in Spanish.`
        : "You are an AI assistant for ethics and anti-corruption training. Provide helpful, educational responses in Spanish.";

      const messagesWithSystem = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
      ];

      const result = await generateText({
        model: openai('gpt-4'),
        messages: messagesWithSystem,
        maxTokens: 1000,
        temperature: 0.7,
      });

      return result.text;
    } catch (error) {
      console.error("Failed to generate response:", error);
      throw error;
    }
  }

  // Generate speech from text using OpenAI TTS
  async textToSpeech(text: string, voice: string = 'alloy'): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice, // alloy, echo, fable, onyx, nova, shimmer
          response_format: 'mp3',
          speed: 1.0,
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
