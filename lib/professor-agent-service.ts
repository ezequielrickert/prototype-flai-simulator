import OpenAI from 'openai';

export interface ProfessorAgentConfig {
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

export interface SessionPhase {
  name: 'inicio' | 'exploracion' | 'retroalimentacion' | 'cierre';
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

export interface EthicalDilemma {
  id: string;
  title: string;
  scenario: string;
  complexity: 'basico' | 'intermedio' | 'avanzado';
  principles: string[];
  category: 'transparencia' | 'conflicto-interes' | 'responsabilidad' | 'integridad' | 'equidad';
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  phase?: SessionPhase['name'];
}

export interface SessionFeedback {
  id: string;
  sessionId: string;
  userReasoning: string[];
  ethicalPrinciples: string[];
  strengthsIdentified: string[];
  risksIdentified: string[];
  finalRecommendation: string;
  keyLesson: string;
  engagementLevel: 'bajo' | 'medio' | 'alto';
  reflectionQuality: 'superficial' | 'moderada' | 'profunda';
  timestamp: Date;
}

export interface CoachingSession {
  id: string;
  dilemma: EthicalDilemma;
  phases: SessionPhase[];
  messages: ConversationMessage[];
  feedback?: SessionFeedback;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  completed: boolean;
}

export class ProfessorAgentService {
  private openai: OpenAI;
  private currentAgent: ProfessorAgentConfig;
  private activeSessions: Map<string, CoachingSession> = new Map();
  private ethicalDilemmas: EthicalDilemma[] = [];

  constructor(apiKey: string) {
    this.openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true
    });
    
    this.currentAgent = this.getMarcusAgentConfig();
    this.initializeEthicalDilemmas();
  }

  private getMarcusAgentConfig(): ProfessorAgentConfig {
    return {
      name: 'Marcus',
      instructions: `Eres Marcus, un coach de ética empresarial reflexivo y profesional.
Te especializas en crear sesiones diarias breves pero impactantes que ayudan a los usuarios a practicar la toma de decisiones éticas a través de dilemas del mundo real.
Eres reflexivo, perspicaz y siempre te enfocas en fomentar la integridad, la responsabilidad y el buen juicio en contextos empresariales.

ENTORNO:
Hablas con el usuario en una breve llamada diaria de 5 minutos, diseñada como una microsesión de coaching ético.
El usuario espera que le presentes un dilema ético realista, le hagas preguntas incisivas sobre su razonamiento y le brindes retroalimentación.
No evalúas el desempeño para los registros de cumplimiento; tu rol es puramente de desarrollo, ayudando al usuario a desarrollar conciencia ética y confianza.

TONO:
Tus respuestas son tranquilas, profesionales y conversacionales.
Suenas como un coach o mentor: alentador, curioso y sin prejuicios.
Limitas las explicaciones a menos de tres oraciones a menos que se necesite un contexto más profundo.
Incorporas afirmaciones de forma natural ("Esa es una perspectiva interesante", "Entiendo tu punto de vista") y pausas para reflexionar ("Mmm... pensemos en eso").
Revisas periódicamente con preguntas como "¿Qué opinas de esa decisión?" o "¿Qué factores influyeron en tu decisión?".
Utilizas el énfasis y las pausas estratégicamente para que la conversación se sienta natural y reflexiva.

ESTRUCTURA DE SESIÓN:
1. INICIO: Prepara brevemente el escenario: "Trabajemos en el escenario ético de hoy". Presenta un dilema empresarial conciso pero realista.
2. EXPLORACIÓN: Haz preguntas abiertas sobre cómo respondería el usuario. Anímalo a explicar su razonamiento y los valores que sustentan su elección. Indaga con cuidado con preguntas de seguimiento que revelen los principios subyacentes.
3. RETROALIMENTACIÓN: Resume el razonamiento del usuario. Ofrece retroalimentación clara y constructiva sobre las fortalezas y los riesgos de su enfoque. Ofrece la mejor manera de abordar la situación, basada en estándares comunes de ética empresarial.
4. CIERRE: Refuerza una lección clave y finaliza con palabras de aliento.

RESTRICCIONES:
- Mantén todas las conversaciones centradas en dilemas de ética empresarial
- Nunca proporciones asesoramiento legal ni orientación específica sobre políticas de empresa
- Evita la filosofía abstracta; siempre basa ejemplos en situaciones laborales realistas
- Mantén una postura de coaching: de apoyo, indagación y corrección sin juzgar
- Si el usuario se pone a la defensiva o inseguro, reduce la velocidad y tranquilízalo mientras lo guías hacia un razonamiento más claro

Responde siempre en español y adopta completamente la personalidad de Marcus.`,
      voice: 'onyx', // Professional, warm voice for coaching
      temperature: 0.7, // Higher for more conversational and natural responses
      maxTokens: 1000, // Shorter responses for 5-minute sessions
      language: 'es-ES',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 200,
        silenceDurationMs: 3000, // Shorter for coaching conversation flow
        minWords: 2,
        interruptResponse: true // Allow natural conversation flow
      }
    };
  }

  private initializeEthicalDilemmas(): void {
    this.ethicalDilemmas = [
      {
        id: 'transparencia-1',
        title: 'Información confidencial del competidor',
        scenario: 'Un empleado de la competencia te ofrece información confidencial sobre una licitación en la que tu empresa participa. Dice que está descontento con su empleador y quiere ayudarte.',
        complexity: 'intermedio',
        principles: ['transparencia', 'integridad', 'competencia_leal'],
        category: 'integridad'
      },
      {
        id: 'conflicto-1',
        title: 'Negocio familiar',
        scenario: 'Tu hermano ha iniciado una empresa de consultoría y quiere hacer negocios con tu compañía. Tú tienes influencia en las decisiones de contratación de proveedores.',
        complexity: 'basico',
        principles: ['transparencia', 'conflicto_interes'],
        category: 'conflicto-interes'
      },
      {
        id: 'responsabilidad-1',
        title: 'Error en el reporte financiero',
        scenario: 'Descubres un error significativo en un reporte financiero que ya fue enviado a inversionistas. Corregirlo podría afectar negativamente la percepción sobre la empresa en un momento crítico.',
        complexity: 'avanzado',
        principles: ['transparencia', 'responsabilidad', 'integridad'],
        category: 'responsabilidad'
      },
      {
        id: 'equidad-1',
        title: 'Promoción interna',
        scenario: 'Dos candidatos están compitiendo por una promoción. Uno es tu amigo personal con buen desempeño, el otro es un candidato ligeramente más calificado pero con el que no tienes relación personal.',
        complexity: 'intermedio',
        principles: ['equidad', 'transparencia', 'meritocracia'],
        category: 'equidad'
      },
      {
        id: 'transparencia-2',
        title: 'Gastos de representación',
        scenario: 'Un cliente importante te invita a un evento deportivo muy costoso. Las políticas de tu empresa permiten entretenimiento de clientes, pero no especifican límites claros para eventos de este valor.',
        complexity: 'basico',
        principles: ['transparencia', 'integridad', 'politicas_empresa'],
        category: 'transparencia'
      }
    ];
  }

  // Start a new coaching session
  async startNewSession(sessionId: string): Promise<CoachingSession> {
    // Select a random dilemma
    const dilemma = this.ethicalDilemmas[Math.floor(Math.random() * this.ethicalDilemmas.length)];
    
    const session: CoachingSession = {
      id: sessionId,
      dilemma,
      phases: [
        { name: 'inicio', startTime: new Date(), completed: false }
      ],
      messages: [],
      startTime: new Date(),
      completed: false
    };

    this.activeSessions.set(sessionId, session);
    
    // Generate the opening message
    const openingMessage = await this.generateSessionOpening(dilemma);
    
    // Add the opening message to the session
    session.messages.push({
      role: 'assistant',
      content: openingMessage,
      timestamp: new Date(),
      phase: 'inicio'
    });

    return session;
  }

  private async generateSessionOpening(dilemma: EthicalDilemma): Promise<string> {
    const prompt = `Como Marcus, inicia una nueva sesión de coaching ético de 5 minutos. 

DILEMA PARA HOY: ${dilemma.scenario}

Sigue este formato:
1. Saluda brevemente y establece el contexto de la sesión de hoy
2. Presenta el dilema de manera clara y concisa
3. Invita al usuario a compartir su primera reacción

Mantén el tono conversacional y profesional de Marcus. Limítate a 2-3 oraciones por punto.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: this.currentAgent.instructions
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.currentAgent.maxTokens,
      temperature: this.currentAgent.temperature
    });

    return response.choices[0]?.message?.content || '';
  }

  // Process user response and generate coaching response
  async processUserResponse(
    sessionId: string, 
    userMessage: string
  ): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add user message to session
    const currentPhase = this.getCurrentPhase(session);
    session.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      phase: currentPhase
    });

    // Determine next action based on session state
    const nextResponse = await this.generateCoachingResponse(session, userMessage);

    // Add assistant response to session
    session.messages.push({
      role: 'assistant',
      content: nextResponse,
      timestamp: new Date(),
      phase: currentPhase
    });

    // Update session phases if needed
    this.updateSessionPhase(session);

    return nextResponse;
  }

  private getCurrentPhase(session: CoachingSession): SessionPhase['name'] {
    const activePhase = session.phases.find(p => !p.completed);
    return activePhase?.name || 'inicio';
  }

  private async generateCoachingResponse(
    session: CoachingSession, 
    userMessage: string
  ): Promise<string> {
    const currentPhase = this.getCurrentPhase(session);
    const conversationContext = this.buildConversationContext(session);
    
    let phaseInstructions = '';
    
    switch (currentPhase) {
      case 'inicio':
        phaseInstructions = 'El usuario ha dado su primera reacción. Ahora guíalo hacia la fase de exploración haciendo preguntas abiertas sobre su razonamiento.';
        break;
      case 'exploracion':
        phaseInstructions = 'Profundiza en el razonamiento del usuario. Haz preguntas incisivas que revelen los principios éticos subyacentes. Ayúdalo a considerar diferentes perspectivas.';
        break;
      case 'retroalimentacion':
        phaseInstructions = 'Resume el razonamiento del usuario y proporciona retroalimentación constructiva. Identifica fortalezas y riesgos, y ofrece la mejor práctica ética.';
        break;
      case 'cierre':
        phaseInstructions = 'Refuerza la lección clave de hoy y cierra con palabras de aliento. Prepara al usuario para la siguiente sesión.';
        break;
    }

    const prompt = `CONTEXTO DE LA SESIÓN:
${conversationContext}

FASE ACTUAL: ${currentPhase.toUpperCase()}
INSTRUCCIONES DE FASE: ${phaseInstructions}

ÚLTIMO MENSAJE DEL USUARIO: "${userMessage}"

Como Marcus, responde apropiadamente para esta fase de la sesión. Mantén tu respuesta concisa (1-3 oraciones) y enfocada en el coaching ético.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: this.currentAgent.instructions
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.currentAgent.maxTokens,
      temperature: this.currentAgent.temperature
    });

    return response.choices[0]?.message?.content || '';
  }

  private buildConversationContext(session: CoachingSession): string {
    const dilemma = session.dilemma;
    const messageHistory = session.messages
      .slice(-6) // Last 6 messages for context
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Marcus'}: ${m.content}`)
      .join('\n');

    return `DILEMA: ${dilemma.scenario}
CATEGORÍA: ${dilemma.category}
PRINCIPIOS CLAVE: ${dilemma.principles.join(', ')}

CONVERSACIÓN RECIENTE:
${messageHistory}`;
  }

  private updateSessionPhase(session: CoachingSession): void {
    const currentPhase = session.phases.find(p => !p.completed);
    if (!currentPhase) return;

    const sessionDuration = Date.now() - session.startTime.getTime();
    const messageCount = session.messages.filter(m => m.role === 'user').length;

    // Transition logic based on time and interaction
    if (currentPhase.name === 'inicio' && messageCount >= 1) {
      currentPhase.completed = true;
      currentPhase.endTime = new Date();
      session.phases.push({
        name: 'exploracion',
        startTime: new Date(),
        completed: false
      });
    } else if (currentPhase.name === 'exploracion' && messageCount >= 3) {
      currentPhase.completed = true;
      currentPhase.endTime = new Date();
      session.phases.push({
        name: 'retroalimentacion',
        startTime: new Date(),
        completed: false
      });
    } else if (currentPhase.name === 'retroalimentacion' && messageCount >= 4) {
      currentPhase.completed = true;
      currentPhase.endTime = new Date();
      session.phases.push({
        name: 'cierre',
        startTime: new Date(),
        completed: false
      });
    } else if (currentPhase.name === 'cierre' || sessionDuration > 300000) { // 5 minutes
      currentPhase.completed = true;
      currentPhase.endTime = new Date();
      session.completed = true;
      session.endTime = new Date();
      session.duration = sessionDuration;
    }
  }

  // Generate session feedback and insights
  async generateSessionFeedback(sessionId: string): Promise<SessionFeedback | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.completed) {
      return null;
    }

    const feedbackPrompt = `Analiza esta sesión de coaching ético completada y genera feedback estructurado.

DILEMA: ${session.dilemma.scenario}
PRINCIPIOS CLAVE: ${session.dilemma.principles.join(', ')}

CONVERSACIÓN COMPLETA:
${session.messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Marcus'}: ${m.content}`).join('\n')}

Genera un análisis en formato JSON con la siguiente estructura:
{
  "userReasoning": ["razonamiento 1", "razonamiento 2"],
  "ethicalPrinciples": ["principio aplicado 1", "principio aplicado 2"],
  "strengthsIdentified": ["fortaleza 1", "fortaleza 2"],
  "risksIdentified": ["riesgo 1", "riesgo 2"],
  "finalRecommendation": "recomendación principal",
  "keyLesson": "lección clave de la sesión",
  "engagementLevel": "bajo|medio|alto",
  "reflectionQuality": "superficial|moderada|profunda"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un evaluador experto en coaching ético. Analiza sesiones y proporciona feedback estructurado para mejorar el desarrollo ético.'
          },
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const responseContent = response.choices[0]?.message?.content || '';
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
      const feedbackData = JSON.parse(jsonStr);

      const feedback: SessionFeedback = {
        id: `feedback_${Date.now()}`,
        sessionId,
        ...feedbackData,
        timestamp: new Date()
      };

      session.feedback = feedback;
      return feedback;

    } catch (error) {
      console.error('Failed to generate session feedback:', error);
      return null;
    }
  }

  // Get session details
  getSession(sessionId: string): CoachingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Get all active sessions
  getAllSessions(): CoachingSession[] {
    return Array.from(this.activeSessions.values());
  }

  // End session manually
  endSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session && !session.completed) {
      const currentPhase = session.phases.find(p => !p.completed);
      if (currentPhase) {
        currentPhase.completed = true;
        currentPhase.endTime = new Date();
      }
      session.completed = true;
      session.endTime = new Date();
      session.duration = Date.now() - session.startTime.getTime();
    }
  }

  // Get available dilemmas
  getAvailableDilemmas(): EthicalDilemma[] {
    return this.ethicalDilemmas;
  }

  // Generate speech using Marcus's voice
  async textToSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: text,
          voice: this.currentAgent.voice || 'onyx',
          response_format: 'mp3',
          speed: 0.85, // Slightly slower for thoughtful coaching tone
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

  // Get agent configuration
  getAgentConfig(): ProfessorAgentConfig {
    return this.currentAgent;
  }
}

// Export a configured instance
export const createProfessorAgentService = () => {
  if (process.env.OPENAI_API_KEY) {
    return new ProfessorAgentService(process.env.OPENAI_API_KEY);
  }
  return null;
};

export const professorAgentService = createProfessorAgentService();