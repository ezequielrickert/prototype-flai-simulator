// import OpenAI from 'openai';

export interface ProfessorAgentConfig {
  name: string;
  instructions: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'Marin';
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
  // private openai: OpenAI;
  private currentAgent: ProfessorAgentConfig;
  private activeSessions: Map<string, CoachingSession> = new Map();
  private ethicalDilemmas: EthicalDilemma[] = [];

  constructor(apiKey: string) {
    // this.openai = new OpenAI({ 
    //   apiKey,
    //   dangerouslyAllowBrowser: true
    // });
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
      voice: 'Marin',
      temperature: 0.7,
      maxTokens: 1000,
      language: 'es-ES',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 200,
        silenceDurationMs: 3000,
        minWords: 2,
        interruptResponse: false
      }
    };
  }

  /**
   * Build a string with previous Marcus questions and recent conversation for prompt context.
   */
  private buildConversationContext(session: CoachingSession): string {
    // Get all assistant questions (Marcus) so far
    const marcusQuestions = session.messages
      .filter(m => m.role === 'assistant' && m.content.trim().endsWith('?'))
      .map(m => m.content.trim());

    // Build recent conversation (last 6 messages)
    const recentMessages = session.messages.slice(-6);
    const messageHistory = recentMessages
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Marcus'}: ${m.content}`)
      .join('\n');

    return `PREGUNTAS PREVIAS DE MARCUS (EVITAR REPETIR):\n${marcusQuestions.length > 0 ? marcusQuestions.join('\n') : 'Ninguna'}\n\nCONVERSACIÓN RECIENTE:\n${messageHistory}`;
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
- Mantén un tono profesional pero cálido
- NO uses terminología legal
- Enfócate en principios éticos empresariales
- Limita tu respuesta a 4-5 oraciones máximo`;

      // TODO: Implement new OpenAI Realtime API logic here
      throw new Error('Not implemented: Use WebRTC Realtime API for chat.');
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
      case 'inicio': {
        phaseInstructions = 'El usuario ha dado su primera reacción. Ahora guíalo hacia la fase de exploración.\n- Haz UNA pregunta abierta específica sobre su razonamiento inicial\n- Evita preguntas genéricas como "¿qué piensas?"\n- Enfócate en un aspecto específico de su respuesta';
        break;
      }
      case 'exploracion': {
        const needsDeepening = session.state.conversationDepth === 'surface';
        const topicsToExplore = session.dilemma.principles.filter(p => 
          !session.state.topicsExplored.includes(p)
        );
        if (needsDeepening) {
          phaseInstructions = 'Profundiza en el razonamiento del usuario.\n- NO repitas preguntas ya hechas\n- Explora aspectos específicos como: ' + topicsToExplore.slice(0, 2).join(', ') + '\n- Pregunta sobre valores personales o experiencias previas\n- Si ha dado respuestas superficiales, pide ejemplos concretos';
        } else {
          phaseInstructions = 'El usuario ha mostrado reflexión profunda.\n- Haz una pregunta final que integre lo discutido\n- Prepara la transición hacia feedback\n- Pregunta sobre las consecuencias o implicaciones de su decisión';
        }
        break;
      }
      case 'retroalimentacion': {
        phaseInstructions = 'Resume el razonamiento del usuario y proporciona feedback constructivo.\n- Identifica 1-2 fortalezas específicas en su razonamiento\n- Señala 1 riesgo o punto ciego potencial\n- Ofrece una recomendación práctica basada en mejores prácticas éticas\n- Mantén un tono constructivo y de apoyo';
        break;
      }
      case 'cierre': {
        phaseInstructions = 'Cierra la sesión de manera memorable y alentadora.\n- Refuerza UNA lección clave específica de hoy\n- Conecta la lección con situaciones futuras\n- Termina con palabras de aliento sobre su desarrollo ético';
        break;
      }
    }

    // Add context for prompt
    const context = conversationContext;
    const fullPrompt = `${phaseInstructions}\n\n${context}`;

    // TODO: Implement OpenAI chat completion here
    throw new Error('Not implemented: Use OpenAI API for response generation.');
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
    session.duration = session.endTime.getTime() - session.startTime.getTime();
  }

  private analyzeConversationState(session: CoachingSession): void {
    const userMessages = session.messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage) return;

    // Analyze conversation depth
    const messageLength = lastUserMessage.content.length;
    const hasExplanation = lastUserMessage.content.includes('porque') || 
                          lastUserMessage.content.includes('ya que') ||
                          lastUserMessage.content.includes('considero');
    
    if (messageLength > 100 && hasExplanation) {
      session.state.conversationDepth = userMessages.length >= 3 ? 'deep' : 'moderate';
    } else if (messageLength > 50) {
      session.state.conversationDepth = 'moderate';
    }

    // Check readiness for feedback
    const hasReasoningDepth = session.state.conversationDepth !== 'surface';
    const hasExploredTopics = session.state.topicsExplored.length >= 2;
    const sufficientMessages = userMessages.length >= 3;

    session.state.readinessForFeedback = hasReasoningDepth && (hasExploredTopics || sufficientMessages);
  }

  // Get session status
  getSession(sessionId: string): CoachingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Generate comprehensive session feedback
  async generateSessionFeedback(sessionId: string): Promise<SessionFeedback> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const feedbackPrompt = `Analiza esta sesión de coaching ético completada y genera feedback estructurado.

DILEMA: ${session.dilemma.scenario}
PRINCIPIOS CLAVE: ${session.dilemma.principles.join(', ')}

CONVERSACIÓN:
${session.messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Marcus'}: ${m.content}`).join('\n')}

Genera feedback estructurado que incluya:
1. Razonamiento del usuario (puntos principales)
2. Principios éticos aplicados
3. Fortalezas identificadas
4. Riesgos o puntos ciegos
5. Recomendación final
6. Lección clave para recordar
7. Nivel de engagement (bajo/medio/alto)
8. Calidad de reflexión (superficial/moderada/profunda)`;

    // TODO: Implement OpenAI completion for feedback generation
    const feedback: SessionFeedback = {
      id: `feedback-${sessionId}`,
      sessionId,
      userReasoning: ['Placeholder reasoning'],
      ethicalPrinciples: session.dilemma.principles,
      strengthsIdentified: ['Placeholder strength'],
      risksIdentified: ['Placeholder risk'],
      finalRecommendation: 'Placeholder recommendation',
      keyLesson: 'Placeholder lesson',
      engagementLevel: 'medio',
      reflectionQuality: 'moderada',
      timestamp: new Date()
    };

    session.feedback = feedback;
    return feedback;
  }
}