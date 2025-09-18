import OpenAI from 'openai';

export interface AgentConfig {
  name: string;
  instructions: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  temperature?: number;
  maxTokens?: number;
  language?: string;
  turnDetection?: {
    type: 'server_vad';
    threshold: number;
    prefixPaddingMs: number;
    silenceDurationMs: number;
    minWords: number;
    interruptResponse: boolean;
  };
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConversationFeedback {
  id: string;
  conversationId: string;
  analysisTimestamp: Date;
  timeWindowSeconds: number;
  messagesAnalyzed: number;
  feedback: {
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
    engagementLevel: 'low' | 'medium' | 'high';
    comprehensionLevel: 'basic' | 'intermediate' | 'advanced';
  };
}

export interface ConversationHistory {
  id: string;
  messages: ConversationMessage[];
  agentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeachingScenario {
  id: string;
  title: string;
  description: string;
  agentConfig: AgentConfig;
}

export class RealtimeAgentService {
  private openai: OpenAI;
  private currentAgent?: AgentConfig;
  private websocket?: WebSocket;
  private conversationHistory: Map<string, ConversationHistory> = new Map();
  private conversationFeedback: Map<string, ConversationFeedback[]> = new Map();

  constructor(apiKey: string) {
    this.openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // Only for client-side usage
    });
  }

  // Predefined specialized agents for different teaching scenarios
  static getPredefineAgents(): Record<string, TeachingScenario> {
    return {
      'ethics-basic': {
        id: 'ethics-basic',
        title: 'Ética Básica',
        description: 'Principios fundamentales de ética empresarial',
        agentConfig: {
          name: 'Instructor de Ética',
          instructions: `Eres un instructor especializado en ética empresarial básica. Tu objetivo es enseñar los principios fundamentales de la ética en el ambiente laboral.

Características:
- Explica conceptos de manera clara y didáctica
- Usa ejemplos prácticos del mundo empresarial latinoamericano
- Fomenta la reflexión sobre situaciones éticas
- Mantén un tono profesional pero accesible
- Responde en español neutro latinoamericano
- Usa modismos y expresiones comunes en Latinoamérica
- Hablas en español neutro latinoamericano

Temas principales:
- Integridad personal y profesional
- Transparencia en las comunicaciones
- Responsabilidad en la toma de decisiones
- Respeto hacia colegas y clientes`,
          voice: 'shimmer', // Professional male voice for Spanish
          temperature: 0.7,
          maxTokens: 1000,
          language: 'es-MX',
          turnDetection: {
            type: 'server_vad',
            threshold: 0.5,
            prefixPaddingMs: 300,
            silenceDurationMs: 5000, // 5 seconds
            minWords: 3,
            interruptResponse: false
          }
        }
      },
      'anti-corruption': {
        id: 'anti-corruption',
        title: 'Anti-Corrupción',
        description: 'Prevención y detección de prácticas corruptas',
        agentConfig: {
          name: 'Especialista Anti-Corrupción',
          instructions: `Eres un especialista en prevención de corrupción y cumplimiento normativo. Tu misión es educar sobre la identificación, prevención y reporte de prácticas corruptas.

Características:
- Proporciona información precisa sobre regulaciones latinoamericanas
- Enseña a identificar señales de alerta
- Explica procedimientos de reporte
- Enfatiza la importancia del cumplimiento
- Responde en español neutro latinoamericano
- Referencia marcos legales comunes en Latinoamérica
- Hablas en español neutro latinoamericano

Temas principales:
- Identificación de conflictos de interés
- Procedimientos de denuncia
- Políticas de regalos y entretenimiento
- Transparencia en licitaciones y contratos
- Consecuencias legales de la corrupción`,
          voice: 'shimmer', // Deep male voice for authority
          temperature: 0.6,
          maxTokens: 1200,
          language: 'es-MX',
          turnDetection: {
            type: 'server_vad',
            threshold: 0.5,
            prefixPaddingMs: 300,
            silenceDurationMs: 5000, // 5 seconds
            minWords: 3,
            interruptResponse: false
          }
        }
      },
      'conflict-resolution': {
        id: 'conflict-resolution',
        title: 'Resolución de Conflictos',
        description: 'Manejo de conflictos éticos en el workplace',
        agentConfig: {
          name: 'Mediador de Conflictos',
          instructions: `Eres un mediador experto en resolución de conflictos éticos en el ambiente laboral. Tu papel es guiar a los usuarios en el análisis y resolución de dilemas éticos.

Características:
- Facilita el análisis de situaciones complejas
- Presenta múltiples perspectivas culturales latinoamericanas
- Guía hacia soluciones éticas
- Fomenta el diálogo constructivo
- Responde en español neutro latinoamericano
- Considera aspectos culturales de la región
- Hablas en español argentino latinoamericano

Temas principales:
- Análisis de dilemas éticos
- Técnicas de mediación
- Comunicación asertiva
- Toma de decisiones éticas
- Prevención de conflictos futuros`,
          voice: 'shimmer', // Professional male voice for mediation
          temperature: 0.8,
          maxTokens: 1100,
          language: 'es-MX',
          turnDetection: {
            type: 'server_vad',
            threshold: 0.5,
            prefixPaddingMs: 300,
            silenceDurationMs: 5000, // 5 seconds
            minWords: 3,
            interruptResponse: false
          }
        }
      },
      'compliance': {
        id: 'compliance',
        title: 'Cumplimiento Normativo',
        description: 'Regulaciones y políticas empresariales',
        agentConfig: {
          name: 'Oficial de Cumplimiento',
          instructions: `Eres un oficial de cumplimiento especializado en regulaciones empresariales y políticas internas. Tu objetivo es educar sobre el marco normativo y asegurar su comprensión.

Características:
- Explica regulaciones de manera comprensible
- Relaciona normas con situaciones prácticas latinoamericanas
- Enfatiza la importancia del cumplimiento
- Proporciona guías claras de acción
- Responde en español neutro latinoamericano
- Considera marcos regulatorios regionales
- Hablas en español neutro latinoamericano

Temas principales:
- Marco regulatorio aplicable
- Políticas internas de la empresa
- Procedimientos de cumplimiento
- Auditorías y controles
- Consecuencias del incumplimiento`,
          voice: 'shimmer', // Clear male voice for formal content
          temperature: 0.5,
          maxTokens: 1000,
          language: 'es-MX',
          turnDetection: {
            type: 'server_vad',
            threshold: 0.5,
            prefixPaddingMs: 300,
            silenceDurationMs: 5000, // 5 seconds
            minWords: 3,
            interruptResponse: false
          }
        }
      }
    };
  }

  // Set the current agent for the session
  setAgent(scenario: TeachingScenario) {
    this.currentAgent = scenario.agentConfig;
  }

  // Generate response using the configured agent with conversation history
  async generateResponse(
    messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>,
    conversationId?: string
  ) {
    if (!this.currentAgent) {
      throw new Error('No agent configured. Please set an agent first.');
    }

    try {
      // Get or create conversation history
      let conversation = conversationId ? this.conversationHistory.get(conversationId) : undefined;
      
      if (!conversation && conversationId) {
        conversation = {
          id: conversationId,
          messages: [],
          agentId: this.currentAgent.name,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.conversationHistory.set(conversationId, conversation);
      }

      // Add the agent's instructions as system message
      const systemMessage: ConversationMessage = {
        role: 'system' as const,
        content: `${this.currentAgent.instructions}

CONVERSACIÓN PREVIA: ${conversation ? this.formatConversationContext(conversation.messages) : 'Esta es una nueva conversación.'}

Mantén coherencia con lo que se ha discutido anteriormente y haz referencia a temas previos cuando sea relevante. Si el usuario hace preguntas sobre algo que ya discutieron, proporciona respuestas consistentes y construye sobre esa base.`,
        timestamp: new Date()
      };

      // Build messages array with conversation history
      let allMessages: ConversationMessage[] = [systemMessage];
      
      // Add conversation history if available (limit to last 10 exchanges to manage token usage)
      if (conversation && conversation.messages.length > 0) {
        const recentHistory = conversation.messages.slice(-20); // Last 20 messages (10 exchanges)
        allMessages = [systemMessage, ...recentHistory];
      }
      
      // Add current messages
      const currentMessages: ConversationMessage[] = messages.map(msg => ({
        ...msg,
        timestamp: new Date()
      }));
      allMessages = [...allMessages, ...currentMessages];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: allMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: this.currentAgent.maxTokens || 1000,
        temperature: this.currentAgent.temperature || 0.7,
      });

      const responseContent = response.choices[0]?.message?.content || '';

      // Update conversation history
      if (conversation && conversationId) {
        // Add user message and AI response to history
        conversation.messages.push(...currentMessages);
        conversation.messages.push({
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        });
        conversation.updatedAt = new Date();
        this.conversationHistory.set(conversationId, conversation);
      }

      return responseContent;
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw error;
    }
  }

  // Format conversation context for the system message
  private formatConversationContext(messages: ConversationMessage[]): string {
    if (!messages || messages.length === 0) {
      return 'No hay conversación previa.';
    }

    const recentMessages = messages
      .filter(msg => msg.role !== 'system')
      .slice(-10) // Last 10 messages
      .map(msg => {
        const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    return `Resumen de la conversación reciente:\n${recentMessages}`;
  }

  // Get conversation history for a specific conversation
  getConversationHistory(conversationId: string): ConversationHistory | undefined {
    return this.conversationHistory.get(conversationId);
  }

  // Clear conversation history for a specific conversation
  clearConversationHistory(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  // Get all conversation IDs
  getAllConversationIds(): string[] {
    return Array.from(this.conversationHistory.keys());
  }

  // Generate feedback for the last 30 seconds of conversation
  async generateConversationFeedback(conversationId: string, timeWindowSeconds: number = 30): Promise<ConversationFeedback | null> {
    const conversation = this.conversationHistory.get(conversationId);
    
    if (!conversation || !this.currentAgent) {
      return null;
    }

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (timeWindowSeconds * 1000));

    // Filter messages from the last specified time window
    const recentMessages = conversation.messages.filter(msg => 
      msg.timestamp && msg.timestamp >= cutoffTime && msg.role !== 'system'
    );

    if (recentMessages.length === 0) {
      return null;
    }

    try {
      // Create a prompt for feedback analysis
      const feedbackPrompt = `Analiza la siguiente conversación de los últimos ${timeWindowSeconds} segundos en una sesión de entrenamiento en ética empresarial. Proporciona feedback constructivo y específico.

CONVERSACIÓN A ANALIZAR:
${recentMessages.map(msg => `${msg.role === 'user' ? 'Estudiante' : 'Instructor'}: ${msg.content}`).join('\n')}

Proporciona tu análisis en el siguiente formato JSON:
{
  "summary": "Resumen breve de la conversación analizada",
  "strengths": ["Fortaleza 1", "Fortaleza 2"],
  "areasForImprovement": ["Área de mejora 1", "Área de mejora 2"],
  "suggestions": ["Sugerencia específica 1", "Sugerencia específica 2"],
  "engagementLevel": "low|medium|high",
  "comprehensionLevel": "basic|intermediate|advanced"
}

Criterios para evaluar:
- Participación activa del estudiante
- Calidad de las preguntas formuladas
- Comprensión de conceptos éticos
- Aplicación práctica de los principios
- Reflexión crítica sobre los escenarios`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un evaluador experto en entrenamiento ético empresarial. Tu tarea es analizar conversaciones y proporcionar feedback constructivo y específico para mejorar el aprendizaje.'
          },
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3, // Lower temperature for more consistent feedback
      });

      const responseContent = response.choices[0]?.message?.content || '';
      
      // Try to parse the JSON response
      let feedbackData;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
        feedbackData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse feedback JSON:', parseError);
        // Fallback to structured feedback
        feedbackData = {
          summary: "Análisis de conversación completado",
          strengths: ["Participación en la conversación"],
          areasForImprovement: ["Continuar desarrollando comprensión"],
          suggestions: ["Continuar con el diálogo y hacer más preguntas"],
          engagementLevel: "medium",
          comprehensionLevel: "intermediate"
        };
      }

      const feedback: ConversationFeedback = {
        id: `feedback_${Date.now()}`,
        conversationId,
        analysisTimestamp: now,
        timeWindowSeconds,
        messagesAnalyzed: recentMessages.length,
        feedback: feedbackData
      };

      // Store the feedback
      if (!this.conversationFeedback.has(conversationId)) {
        this.conversationFeedback.set(conversationId, []);
      }
      this.conversationFeedback.get(conversationId)!.push(feedback);

      return feedback;

    } catch (error) {
      console.error('Failed to generate conversation feedback:', error);
      throw error;
    }
  }

  // Get all feedback for a conversation
  getConversationFeedback(conversationId: string): ConversationFeedback[] {
    return this.conversationFeedback.get(conversationId) || [];
  }

  // Get the most recent feedback for a conversation
  getLatestFeedback(conversationId: string): ConversationFeedback | null {
    const feedback = this.conversationFeedback.get(conversationId);
    if (!feedback || feedback.length === 0) {
      return null;
    }
    return feedback[feedback.length - 1];
  }

  // Clear feedback for a conversation
  clearConversationFeedback(conversationId: string): void {
    this.conversationFeedback.delete(conversationId);
  }

  // Generate speech using the agent's configured voice optimized for Spanish
  async textToSpeech(text: string): Promise<ArrayBuffer> {
    if (!this.currentAgent) {
      throw new Error('No agent configured. Please set an agent first.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd', // Use HD model for better Spanish pronunciation
          input: text,
          voice: this.currentAgent.voice || 'alloy',
          response_format: 'mp3',
          speed: 0.9, // Slightly slower for clearer Spanish pronunciation
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Failed to generate speech:', error);
      throw error;
    }
  }

  // Get current agent info
  getCurrentAgent(): AgentConfig | undefined {
    return this.currentAgent;
  }

  // Get available teaching scenarios
  static getAvailableScenarios(): TeachingScenario[] {
    return Object.values(this.getPredefineAgents());
  }
}

// Export a configured instance
export const createRealtimeAgentService = () => {
  if (process.env.OPENAI_API_KEY) {
    return new RealtimeAgentService(process.env.OPENAI_API_KEY);
  }
  return null;
};

export const realtimeAgentService = createRealtimeAgentService();
