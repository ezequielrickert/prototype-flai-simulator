import { NextResponse } from "next/server";
import { professorAgentService } from "@/lib/professor-agent-service";

export async function GET() {
  try {
    if (!professorAgentService) {
      return NextResponse.json({
        success: false,
        error: "Professor agent service not available"
      }, { status: 500 });
    }

    const dilemmas = professorAgentService.getAvailableDilemmas();
    
    return NextResponse.json({
      success: true,
      dilemmas: dilemmas
    });
  } catch (error) {
    console.error("Error fetching ethical dilemmas:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch ethical dilemmas"
    }, { status: 500 });
  }
}
