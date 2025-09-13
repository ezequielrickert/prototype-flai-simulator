import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { message, scenario, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const systemPrompt = `Eres un asistente de capacitación ética especializado en anti-corrupción. 
    
Contexto del escenario: ${scenario.title} - ${scenario.description}

Tu rol:
- Eres un entrenador experto en ética empresarial con acento argentino
- Haces preguntas reflexivas para guiar al usuario hacia decisiones éticas
- Proporcionas feedback constructivo sin ser condescendiente
- Usas ejemplos prácticos y situaciones reales
- Mantienes un tono profesional pero cercano, típico argentino
- Cada respuesta debe ser conversacional, como si fuera una charla telefónica
- Limita tus respuestas a 2-3 oraciones para mantener el flujo natural

Historial de conversación:
${conversationHistory.map((msg: any) => `${msg.speaker === "user" ? "Usuario" : "IA"}: ${msg.text}`).join("\n")}

Responde de manera natural y conversacional al siguiente mensaje del usuario.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `${systemPrompt}\n\nUsuario: ${message}`,
      maxTokens: 150, // Limitar para respuestas concisas
      temperature: 0.7, // Balance entre creatividad y consistencia
    })

    return NextResponse.json({
      success: true,
      response: text.trim(),
    })
  } catch (error) {
    console.error("Chat API error:", error)

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
