import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

export async function GET(request: NextRequest) {
  try {
    // Return configuration info without exposing the full credentials
    return NextResponse.json({
      hasApiKey: !!ELEVENLABS_API_KEY,
      hasAgentId: !!AGENT_ID,
      agentId: AGENT_ID ? AGENT_ID.substring(0, 10) + "..." : "Not configured", // Show partial ID for display
      fullAgentId: AGENT_ID || "Not configured", // For internal use only
      status: (ELEVENLABS_API_KEY && AGENT_ID) ? "configured" : "missing_credentials"
    });
  } catch (error) {
    console.error("Config API error:", error);
    
    return NextResponse.json({
      hasApiKey: false,
      hasAgentId: false,
      agentId: "Error loading configuration",
      status: "error"
    }, { status: 500 });
  }
}