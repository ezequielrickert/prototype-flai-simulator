import { NextResponse } from "next/server";
import { RealtimeAgentService } from "@/lib/realtime-agent-service";

export async function GET() {
  try {
    const scenarios = RealtimeAgentService.getAvailableScenarios();
    
    return NextResponse.json({
      success: true,
      scenarios: scenarios
    });
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch scenarios"
    }, { status: 500 });
  }
}
