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
  messageType?: 'question' | 'response' | 'feedback' | 'transition';
  topicsAddressed?: string[];
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

export interface SessionState {
  questionsAsked: string[];
  topicsExplored: string[];
  userValues: string[];
  readinessForFeedback: boolean;
  conversationDepth: 'surface' | 'moderate' | 'deep';
}

export interface CoachingSession {
  id: string;
  dilemma: EthicalDilemma;
  phases: SessionPhase[];
  messages: ConversationMessage[];
  state: SessionState;
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
      voice: 'echo', // Professional, warm voice for coaching
      temperature: 0.7, // Higher for more conversational and natural responses
      maxTokens: 1000, // Shorter responses for 5-minute sessions
      language: 'es-ES',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 200,
        silenceDurationMs: 3000, // Shorter for coaching conversation flow
        minWords: 2,
        interruptResponse: false
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
      state: {
        questionsAsked: [],
        topicsExplored: [],
        userValues: [],
        readinessForFeedback: false,
        conversationDepth: 'surface'
      },
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
PRINCIPIOS CLAVE: ${dilemma.principles.join(', ')}

Sigue este formato específico:
1. Saluda brevemente y establece el contexto de la sesión de hoy (1 oración)
2. Presenta el dilema de manera clara y concisa (2-3 oraciones)
3. Haz UNA pregunta específica inicial sobre su primera reacción o instinto

IMPORTANTE:
- Mantén el tono conversacional y profesional de Marcus
- La pregunta inicial debe ser específica, no genérica
- Evita preguntas como "¿qué piensas?" - sé más específico
- Limítate a 3-4 oraciones total`;

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
      phase: currentPhase,
      messageType: 'response'
    });

    // Determine next action based on session state
    const nextResponse = await this.generateCoachingResponse(session, userMessage);

    // Determine message type for assistant response
    const messageType = this.determineMessageType(nextResponse, currentPhase);

    // Add assistant response to session
    session.messages.push({
      role: 'assistant',
      content: nextResponse,
      timestamp: new Date(),
      phase: currentPhase,
      messageType
    });

    // Update session phases if needed
    this.updateSessionPhase(session);

    return nextResponse;
  }

  private determineMessageType(response: string, phase: SessionPhase['name']): ConversationMessage['messageType'] {
    if (response.includes('?')) {
      return 'question';
    } else if (phase === 'retroalimentacion' || response.includes('fortaleza') || response.includes('recomiendo')) {
      return 'feedback';
    } else if (phase === 'cierre') {
      return 'transition';
    }
    return 'response';
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
        phaseInstructions = `El usuario ha dado su primera reacción. Ahora guíalo hacia la fase de exploración.
        - Haz UNA pregunta abierta específica sobre su razonamiento inicial
        - Evita preguntas genéricas como "¿qué piensas?" 
        - Enfócate en un aspecto específico de su respuesta`;
        break;
        
      case 'exploracion':
        const needsDeepening = session.state.conversationDepth === 'surface';
        const topicsToExplore = session.dilemma.principles.filter(p => 
          !session.state.topicsExplored.includes(p)
        );
        
        if (needsDeepening) {
          phaseInstructions = `Profundiza en el razonamiento del usuario. 
          - NO repitas preguntas ya hechas
          - Explora aspectos específicos como: ${topicsToExplore.slice(0, 2).join(', ')}
          - Pregunta sobre valores personales o experiencias previas
          - Si ha dado respuestas superficiales, pide ejemplos concretos`;
        } else {
          phaseInstructions = `El usuario ha mostrado reflexión profunda. 
          - Haz una pregunta final que integre lo discutido
          - Prepara la transición hacia feedback
          - Pregunta sobre las consecuencias o implicaciones de su decisión`;
        }
        break;
        
      case 'retroalimentacion':
        phaseInstructions = `Resume el razonamiento del usuario y proporciona feedback constructivo.
        - Identifica 1-2 fortalezas específicas en su razonamiento
        - Señala 1 riesgo o punto ciego potencial
        - Ofrece una recomendación práctica basada en mejores prácticas éticas
        - Mantén un tono constructivo y de apoyo`;
        break;
        
      case 'cierre':
        phaseInstructions = `Cierra la sesión de manera memorable y alentadora.
        - Refuerza UNA lección clave específica de hoy
        - Conecta la lección con situaciones futuras
        - Termina con palabras de aliento sobre su desarrollo ético`;
        break;
    }

    const prompt = `CONTEXTO DE LA SESIÓN:
${conversationContext}

FASE ACTUAL: ${currentPhase.toUpperCase()}
INSTRUCCIONES ESPECÍFICAS: ${phaseInstructions}

ÚLTIMO MENSAJE DEL USUARIO: "${userMessage}"

INSTRUCCIONES CRÍTICAS:
- NO repitas preguntas que ya aparecen en "PREGUNTAS PREVIAS DE MARCUS"
- Progresa la conversación naturalmente según la fase
- Mantén respuestas concisas (1-3 oraciones máximo)
- Sé específico, no genérico
- Como Marcus, responde apropiadamente para esta fase de la sesión`;

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
      .slice(-8) // Increased to 8 messages for better context
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Marcus'}: ${m.content}`)
      .join('\n');

    // Extract previous questions asked by Marcus to avoid repetition
    const marcusQuestions = session.messages
      .filter(m => m.role === 'assistant' && m.content.includes('?'))
      .map(m => m.content.split('?')[0] + '?')
      .slice(-3); // Last 3 questions

    // Get topics already explored
    const topicsExplored = session.state.topicsExplored.join(', ');
    const conversationDepth = session.state.conversationDepth;
    const questionsAsked = marcusQuestions.length;

    return `DILEMA: ${dilemma.scenario}
CATEGORÍA: ${dilemma.category}
PRINCIPIOS CLAVE: ${dilemma.principles.join(', ')}

ESTADO DE LA CONVERSACIÓN:
- Profundidad: ${conversationDepth}
- Temas explorados: ${topicsExplored || 'Ninguno aún'}
- Preguntas realizadas: ${questionsAsked}
- Listo para feedback: ${session.state.readinessForFeedback ? 'Sí' : 'No'}

PREGUNTAS PREVIAS DE MARCUS (EVITAR REPETIR):
${marcusQuestions.length > 0 ? marcusQuestions.join('\n') : 'Ninguna'}

CONVERSACIÓN RECIENTE:
${messageHistory}`;
  }

  private updateSessionPhase(session: CoachingSession): void {
    const currentPhase = session.phases.find(p => !p.completed);
    if (!currentPhase) return;

    const sessionDuration = Date.now() - session.startTime.getTime();
    const userMessages = session.messages.filter(m => m.role === 'user');
    const assistantMessages = session.messages.filter(m => m.role === 'assistant');
    const messageCount = userMessages.length;

    // Analyze conversation depth and readiness
    this.analyzeConversationState(session);

    // Enhanced transition logic based on conversation quality and depth
    if (currentPhase.name === 'inicio' && messageCount >= 1) {
      // Move to exploration after first user response
      this.transitionToPhase(session, 'exploracion');
      
    } else if (currentPhase.name === 'exploracion') {
      // More intelligent transition conditions for exploration phase
      const shouldTransitionToFeedback = 
        (messageCount >= 3 && session.state.readinessForFeedback) ||
        (messageCount >= 5) || // Maximum exploration messages
        (session.state.conversationDepth === 'deep' && messageCount >= 3) ||
        (sessionDuration > 180000); // 3 minutes maximum for exploration

      if (shouldTransitionToFeedback) {
        this.transitionToPhase(session, 'retroalimentacion');
      }
      
    } else if (currentPhase.name === 'retroalimentacion') {
      // Transition to closure after feedback is given
      const feedbackGiven = assistantMessages.some(m => 
        m.phase === 'retroalimentacion' && 
        (m.content.includes('fortaleza') || m.content.includes('recomiendo') || m.content.includes('sugerencia'))
      );
      
      if (feedbackGiven || messageCount >= 6) {
        this.transitionToPhase(session, 'cierre');
      }
      
    } else if (currentPhase.name === 'cierre' || sessionDuration > 300000) { // 5 minutes total
      this.completeSession(session);
    }
  }

  private transitionToPhase(session: CoachingSession, newPhase: SessionPhase['name']): void {
    const currentPhase = session.phases.find(p => !p.completed);
    if (currentPhase) {
      currentPhase.completed = true;
      currentPhase.endTime = new Date();
    }
    
    session.phases.push({
      name: newPhase,
      startTime: new Date(),
      completed: false
    });
  }

  private completeSession(session: CoachingSession): void {
    const currentPhase = session.phases.find(p => !p.completed);
    if (currentPhase) {
      currentPhase.completed = true;
      currentPhase.endTime = new Date();
    }
    
    session.completed = true;
    session.endTime = new Date();
    session.duration = Date.now() - session.startTime.getTime();
  }

  private analyzeConversationState(session: CoachingSession): void {
    const userMessages = session.messages.filter(m => m.role === 'user');
    const lastUserMessages = userMessages.slice(-2); // Analyze last 2 user messages
    
    // Analyze conversation depth based on message content
    const hasDeepReflection = lastUserMessages.some(m => 
      m.content.length > 100 && // Longer, more thoughtful responses
      (m.content.includes('porque') || m.content.includes('considero') || 
       m.content.includes('creo que') || m.content.includes('mi experiencia'))
    );
    
    const hasValuesDiscussion = lastUserMessages.some(m =>
      m.content.includes('valor') || m.content.includes('principio') || 
      m.content.includes('ética') || m.content.includes('correcto')
    );
    
    // Update conversation depth
    if (hasDeepReflection && hasValuesDiscussion) {
      session.state.conversationDepth = 'deep';
      session.state.readinessForFeedback = true;
    } else if (hasDeepReflection || hasValuesDiscussion) {
      session.state.conversationDepth = 'moderate';
      session.state.readinessForFeedback = userMessages.length >= 3;
    } else {
      session.state.conversationDepth = 'surface';
      session.state.readinessForFeedback = false;
    }
    
    // Extract topics explored
    const allContent = userMessages.map(m => m.content).join(' ').toLowerCase();
    const topics = [];
    
    if (allContent.includes('transparencia') || allContent.includes('honesto')) topics.push('transparencia');
    if (allContent.includes('conflicto') || allContent.includes('interés')) topics.push('conflicto_interes');
    if (allContent.includes('responsabilidad') || allContent.includes('consecuencias')) topics.push('responsabilidad');
    if (allContent.includes('equidad') || allContent.includes('justo')) topics.push('equidad');
    if (allContent.includes('integridad') || allContent.includes('valores')) topics.push('integridad');
    
    session.state.topicsExplored = [...new Set([...session.state.topicsExplored, ...topics])];
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