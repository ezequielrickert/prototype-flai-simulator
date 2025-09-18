import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return OpenAI TTS voices optimized for Latin American Spanish
    const voices = [
      {
        voice_id: "nova",
        name: "Nova",
        category: "premade", 
        description: "Voz femenina clara - Ideal para español",
      },
      {
        voice_id: "alloy",
        name: "Alloy",
        category: "premade",
        description: "Voz neutral equilibrada - Excelente para español",
      },
      {
        voice_id: "echo",
        name: "Echo",
        category: "premade", 
        description: "Voz masculina clara - Buena para español",
      },
      {
        voice_id: "onyx",
        name: "Onyx",
        category: "premade",
        description: "Voz masculina profunda - Autoridad en español",
      },
      {
        voice_id: "shimmer", 
        name: "Shimmer",
        category: "premade",
        description: "Voz femenina suave - Agradable en español",
      },
      {
        voice_id: "fable",
        name: "Fable",
        category: "premade",
        description: "Voz masculina británica - Menos ideal para español",
      },
    ]

    return NextResponse.json({ voices })
  } catch (error) {
    console.error("Error fetching voices:", error)
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 })
  }
}
