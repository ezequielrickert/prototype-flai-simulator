import { type NextRequest, NextResponse } from "next/server"
import { ElevenLabs } from '@elevenlabs/elevenlabs-js'

// Inicializar ElevenLabs con la API key
const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY || 'YOUR_API_KEY',
})

// Cache para almacenar agentes por sesión
const agentCache = new Map<string, string>()

// Función para crear un agente si no existe
async function getOrCreateAgent(sessionId: string, scenario: any): Promise<string> {
  // Verificar si ya existe un agente para esta sesión
  if (agentCache.has(sessionId)) {
    return agentCache.get(sessionId)!
  }

  // Crear el prompt del sistema personalizado para el agente
  const systemPrompt = `Eres un asistente de capacitación ética especializado en anti-corrupción con acento argentino.

Contexto del escenario: ${scenario.title} - ${scenario.description}

Tu rol y personalidad:
- Eres un entrenador experto en ética empresarial con acento y modismos argentinos
- Haces preguntas reflexivas para guiar al usuario hacia decisiones éticas
- Proporcionas feedback constructivo sin ser condescendiente
- Usas ejemplos prácticos y situaciones reales
- Mantienes un tono profesional pero cercano, típico argentino
- Cada respuesta debe ser conversacional, como si fuera una charla telefónica
- Limita tus respuestas a 2-3 oraciones para mantener el flujo natural
- Usa expresiones como "mirá", "está bueno", "bárbaro", "che", etc.

Responde de manera natural y conversacional, guiando al usuario hacia reflexiones éticas profundas.`

  // Crear el agente conversacional
  const agent = await elevenlabs.conversationalAi.agents.create({
    conversationConfig: {
      agent: {
        prompt: {
          prompt: systemPrompt,
          tools: [
            {
              type: 'system',
              name: 'end_call',
              description: 'Termina la conversación cuando el usuario haya completado su reflexión ética',
            }
          ],
        },
        // Configuración de voz para que suene argentino/latino
        voice: {
          voiceId: "pNInz6obpgDQGcFmaJgB", // Adam voice - puedes cambiar por una voz más apropiada
        },
        // Variables dinámicas para personalización
        dynamicVariables: [
          {
            name: "scenario_title",
            value: scenario.title
          },
          {
            name: "scenario_description",
            value: scenario.description
          }
        ],
      },
    },
  })

  // Guardar el agente en el cache
  agentCache.set(sessionId, agent.agentId)

  // Limpiar el cache después de 1 hora para evitar acumulación
  setTimeout(() => {
    agentCache.delete(sessionId)
  }, 3600000) // 1 hora

  return agent.agentId
}

export async function POST(request: NextRequest) {
  try {
    const { message, scenario, conversationHistory, sessionId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Obtener o crear el agente para esta sesión
    const agentId = await getOrCreateAgent(sessionId, scenario)

    // Generar respuesta del agente
    const response = await elevenlabs.conversationalAi.agents.chat({
      agentId: agentId,
      message: message,
    })

    return NextResponse.json({
      success: true,
      response: response.text || response.message,
      agentId: agentId,
      sessionId: sessionId,
    })

  } catch (error) {
    console.error("ElevenLabs Chat API error:", error)

    // Respuestas de fallback en caso de error
    const fallbackResponses = [
      "Mirá, esa es una perspectiva interesante. ¿Me podrías contar un poco más sobre por qué pensás que esa sería la mejor opción?",
      "Está bueno lo que decís. Ahora, ¿cómo te asegurarías de que tu decisión esté alineada con los valores de la empresa?",
      "Perfecto, veo que entendés los riesgos. ¿Qué harías si tu jefe te presiona para tomar una decisión diferente?",
      "Muy bien, esa consideración ética está bárbara. ¿Cómo comunicarías tu posición al resto del equipo?",
      "Excelente análisis. ¿Qué políticas internas de la empresa crees que se aplicarían en este caso?",
    ]

    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      fallback: true,
    })
  }
}

