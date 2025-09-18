import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return OpenAI TTS voices
    const voices = [
      {
        voice_id: "alloy",
        name: "Alloy",
        category: "premade",
        description: "Voz neutral equilibrada",
      },
      {
        voice_id: "echo",
        name: "Echo",
        category: "premade", 
        description: "Voz masculina clara",
      },
      {
        voice_id: "fable",
        name: "Fable",
        category: "premade",
        description: "Voz masculina británica",
      },
      {
        voice_id: "onyx",
        name: "Onyx",
        category: "premade",
        description: "Voz masculina profunda",
      },
      {
        voice_id: "nova",
        name: "Nova",
        category: "premade",
        description: "Voz femenina joven",
      },
      {
        voice_id: "shimmer",
        name: "Shimmer", 
        category: "premade",
        description: "Voz femenina suave",
      },
    ]

    return NextResponse.json({ voices })
  } catch (error) {
    console.error("Error fetching voices:", error)
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 })
  }
}
