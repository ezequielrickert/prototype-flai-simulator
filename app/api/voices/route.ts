import { NextResponse } from "next/server"

export async function GET() {
  try {
    // For demo purposes, return predefined voices
    // In production, this would fetch from ElevenLabs API
    const voices = [
      {
        voice_id: "pNInz6obpgDQGcFmaJgB",
        name: "Adam",
        category: "premade",
        description: "Voz masculina profesional",
      },
      {
        voice_id: "yoZ06aMxZJJ28mfd3POQ",
        name: "Sam",
        category: "premade",
        description: "Voz masculina joven",
      },
      {
        voice_id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi",
        category: "premade",
        description: "Voz femenina confiable",
      },
    ]

    return NextResponse.json({ voices })
  } catch (error) {
    console.error("Error fetching voices:", error)
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 })
  }
}
