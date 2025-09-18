import { type NextRequest, NextResponse } from "next/server"
import { openaiService } from "@/lib/openai-service"

export async function POST(request: NextRequest) {
  let text = ""

  try {
    const requestData = await request.json()
    text = requestData.text
    const voice = requestData.voice || "echo" // Echo is a professional male voice for Spanish

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message:
          "OpenAI API key no encontrada. Por favor configura OPENAI_API_KEY en las variables de entorno.",
        fallbackText: text,
      })
    }

    if (apiKey === "demo-key") {
      return NextResponse.json({
        success: false,
        message: "OpenAI API key es demo-key. Por favor configura una API key válida.",
        fallbackText: text,
      })
    }

    try {
      if (!openaiService) {
        throw new Error("OpenAI service not configured")
      }

      console.log("[v0] Using OpenAI TTS with voice:", voice)

      const audioBuffer = await openaiService.textToSpeech(text, voice)
      const audioBase64 = Buffer.from(audioBuffer).toString("base64")
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`

      console.log("[v0] OpenAI audio generated successfully")
      return NextResponse.json({ success: true, audioUrl })
    } catch (error) {
      console.error("OpenAI API error:", error)
      let errorMessage = "Error desconocido de OpenAI"

      if (error instanceof Error) {
        const errorString = error.toString().toLowerCase()

        if (errorString.includes("401") || errorString.includes("unauthorized")) {
          errorMessage =
            "Error de autenticación con OpenAI. Verifica tu API key y que tengas una suscripción activa."
        } else if (errorString.includes("quota") || errorString.includes("usage") || errorString.includes("limit")) {
          errorMessage = "Límite de cuota de OpenAI alcanzado. Verifica tu plan y créditos disponibles."
        } else if (errorString.includes("voice")) {
          errorMessage = `Voice '${voice}' no encontrado. Verifica que el voice sea correcto (alloy, echo, fable, onyx, nova, shimmer).`
        } else {
          errorMessage = `Error de OpenAI: ${error.message}`
        }
      }

      return NextResponse.json({
        success: false,
        message: errorMessage,
      })
    }
  } catch (error) {
    console.error("Text-to-speech error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error en síntesis de voz",
        fallbackText: text,
      },
      { status: 500 },
    )
  }
}
