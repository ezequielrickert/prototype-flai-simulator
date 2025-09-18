import { NextRequest, NextResponse } from "next/server";
import { openaiService } from "@/lib/openai-service";
import { EthicalDilemma } from "@/lib/professor-agent-service";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different actions
    if (body.action === 'start-session') {
      const { sessionId, dilemma }: { sessionId: string; dilemma?: EthicalDilemma } = body;
      
      if (!sessionId) {
        return NextResponse.json({
          success: false,
          error: "Session ID is required",
        }, { status: 400 });
      }

      if (!openaiService) {
        return NextResponse.json({
          success: false,
          error: "OpenAI service not available",
        }, { status: 500 });
      }

      const session = await openaiService.startCoachingSession(sessionId);
      
      return NextResponse.json({
        success: true,
        session
      });
    } else if (body.action === 'end-session') {
      const { sessionId }: { sessionId: string } = body;
      
      if (!sessionId) {
        return NextResponse.json({
          success: false,
          error: "Session ID is required",
        }, { status: 400 });
      }

      openaiService?.endCoachingSession(sessionId);
      
      return NextResponse.json({
        success: true,
        message: "Session ended"
      });
    } else {
      // Regular message handling
      const { message, sessionId }: { message: string; sessionId: string } = body;

      if (!message) {
        return NextResponse.json({
          success: false,
          error: "Message is required",
        }, { status: 400 });
      }

      if (!sessionId) {
        return NextResponse.json({
          success: false,
          error: "Session ID is required",
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
        const response = await openaiService.generateResponse(message, sessionId);

        return NextResponse.json({
          success: true,
          response,
          timestamp: new Date().toISOString(),
        });

      } catch (apiError) {
        console.error("Professor Agent Error:", apiError);
        
        let errorMessage = "Error communicating with Marcus";
        if (apiError instanceof Error) {
          if (apiError.message.includes("401")) {
            errorMessage = "Invalid OpenAI API key";
          } else if (apiError.message.includes("429")) {
            errorMessage = "OpenAI API rate limit exceeded";
          } else if (apiError.message.includes("quota")) {
            errorMessage = "OpenAI API quota exceeded";
          } else {
            errorMessage = apiError.message;
          }
        }

        return NextResponse.json({
          success: false,
          error: errorMessage,
        }, { status: 500 });
      }
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
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: "Session ID is required",
      }, { status: 400 });
    }

    if (!openaiService) {
      return NextResponse.json({
        success: false,
        error: "OpenAI service not available",
      }, { status: 500 });
    }

    const session = openaiService.getCoachingSession(sessionId);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Session not found",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        dilemma: session.dilemma,
        phases: session.phases,
        completed: session.completed,
        duration: session.duration
      }
    });

  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
