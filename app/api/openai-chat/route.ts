import { NextRequest, NextResponse } from "next/server";
import { openaiService } from "@/lib/openai-service";
import { TeachingScenario } from "@/lib/realtime-agent-service";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, scenario }: { 
      message: string; 
      conversationId?: string; 
      scenario?: TeachingScenario 
    } = await request.json();

    if (!message) {
      return NextResponse.json({
        success: false,
        error: "Message is required",
      }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
      }, { status: 500 });
    }

    if (!openaiService) {
      return NextResponse.json({
        success: false,
        error: "OpenAI service not configured",
      }, { status: 500 });
    }

    try {
      // Build message array for the API call
      const messages = [
        { role: 'user' as const, content: message }
      ];

      // Generate unique conversation ID if not provided
      const newConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await openaiService.generateResponse(messages, scenario, newConversationId);

      return NextResponse.json({
        success: true,
        conversationId: newConversationId,
        response: {
          text: response,
          timestamp: new Date().toISOString(),
          agent: scenario ? scenario.agentConfig.name : 'Assistant',
        },
        agentResponse: {
          text: response,
          // Note: audio_url could be generated here if needed
        }
      });

    } catch (apiError) {
      console.error("OpenAI API Error:", apiError);
      
      let errorMessage = "Error communicating with OpenAI";
      if (apiError instanceof Error) {
        if (apiError.message.includes("401")) {
          errorMessage = "Invalid OpenAI API key";
        } else if (apiError.message.includes("429")) {
          errorMessage = "OpenAI API rate limit exceeded";
        } else if (apiError.message.includes("quota")) {
          errorMessage = "OpenAI API quota exceeded";
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        error: "Conversation ID is required",
      }, { status: 400 });
    }

    // For simplicity, return empty conversation data
    // In a real app, you would fetch this from a database
    return NextResponse.json({
      success: true,
      conversation: {
        id: conversationId,
        messages: [],
        created_at: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
