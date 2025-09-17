export class ElevenLabsService {
  private apiKey: string;
  private agentId: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor(apiKey: string, agentId: string) {
    this.apiKey = apiKey;
    this.agentId = agentId;
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "xi-api-key": this.apiKey,
    };
  }

  // Create a new conversation with the agent
  async createConversation() {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          agent_id: this.agentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to create conversation:", error);
      throw error;
    }
  }

  // Send a message to an existing conversation
  async sendMessage(conversationId: string, message: string) {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations/${conversationId}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          text: message,
          mode: "text",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  // Get conversation details
  async getConversation(conversationId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations/${conversationId}`, {
        method: "GET",
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get conversation:", error);
      throw error;
    }
  }

  // Generate speech from text using ElevenLabs TTS
  async textToSpeech(text: string, voiceId?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId || "21m00Tcm4TlvDq8ikWAM"}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error("Failed to generate speech:", error);
      throw error;
    }
  }

  // Get available voices
  async getVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: "GET",
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get voices:", error);
      throw error;
    }
  }

  // Get agent details
  async getAgent() {
    try {
      const response = await fetch(`${this.baseUrl}/convai/agents/${this.agentId}`, {
        method: "GET",
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get agent:", error);
      throw error;
    }
  }
}

// Export a configured instance (will be undefined if env vars are not set)
export const createElevenLabsService = () => {
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID) {
    return new ElevenLabsService(
      process.env.ELEVENLABS_API_KEY,
      process.env.ELEVENLABS_AGENT_ID
    );
  }
  return null;
};

// Export a configured instance
export const elevenLabsService = new ElevenLabsService(
  process.env.ELEVENLABS_API_KEY!,
  process.env.ELEVENLABS_AGENT_ID!
);
