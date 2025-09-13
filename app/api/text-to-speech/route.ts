import { type NextRequest, NextResponse } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

export async function POST(request: NextRequest) {
  let text = ""

  try {
    const requestData = await request.json()
    text = requestData.text
    const voiceId = requestData.voiceId || "kulszILr6ees0ArU8miO"

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message:
          "ElevenLabs API key no encontrada. Por favor configura ELEVENLABS_API_KEY en las variables de entorno.",
        fallbackText: text,
      })
    }

    if (apiKey === "demo-key") {
      return NextResponse.json({
        success: false,
        message: "ElevenLabs API key es demo-key. Por favor configura una API key válida.",
        fallbackText: text,
      })
    }

    try {
      const elevenlabs = new ElevenLabsClient({
        apiKey: apiKey,
      })

      console.log("[v0] Using ElevenLabs with voice:", voiceId)

      const audio = await elevenlabs.textToSpeech.convert(voiceId, {
        text: text,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
        voiceSettings: {
          stability: 0.7,
          similarityBoost: 0.8,
          style: 0.3,
          useSpeakerBoost: true,
        },
      })

      const chunks: Uint8Array[] = []
      const reader = audio.getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      const audioBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let offset = 0
      for (const chunk of chunks) {
        audioBuffer.set(chunk, offset)
        offset += chunk.length
      }

      const audioBase64 = Buffer.from(audioBuffer).toString("base64")
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`

      console.log("[v0] ElevenLabs audio generated successfully")
      return NextResponse.json({ success: true, audioUrl })
    } catch (error) {
      console.error("ElevenLabs API error:", error)
      let errorMessage = "Error desconocido de ElevenLabs"

      if (error instanceof Error) {
        const errorString = error.toString().toLowerCase()

        if (errorString.includes("unusual_activity") || errorString.includes("detected_unusual_activity")) {
          errorMessage =
            "ElevenLabs detectó actividad inusual. Necesitas una suscripción paga para continuar. Visita elevenlabs.io para actualizar tu plan."
        } else if (errorString.includes("401") || errorString.includes("unauthorized")) {
          errorMessage =
            "Error de autenticación con ElevenLabs. Verifica tu API key y que tengas una suscripción activa."
        } else if (errorString.includes("quota") || errorString.includes("usage") || errorString.includes("limit")) {
          errorMessage = "Límite de cuota de ElevenLabs alcanzado. Verifica tu plan y créditos disponibles."
        } else if (errorString.includes("voice")) {
          errorMessage = `Voice ID '${voiceId}' no encontrado. Verifica que el voice ID sea correcto.`
        } else {
          errorMessage = `Error de ElevenLabs: ${error.message}`
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
