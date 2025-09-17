import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, scenario } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY || !AGENT_ID) {
      return NextResponse.json({ 
        error: "ElevenLabs configuration missing", 
        details: "Please check your API key and Agent ID in environment variables",
        config: {
          hasApiKey: !!ELEVENLABS_API_KEY,
          hasAgentId: !!AGENT_ID,
          apiKey: ELEVENLABS_API_KEY ? "Set" : "Missing",
          agentId: AGENT_ID ? "Set" : "Missing"
        }
      }, { status: 500 });
    }

    // Test the agent endpoint first
    try {
      const agentTestResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
        {
          method: "GET",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (!agentTestResponse.ok) {
        const errorText = await agentTestResponse.text();
        console.error("Agent test failed:", errorText);
        return NextResponse.json({
          error: "Agent not found or invalid credentials",
          details: errorText,
          statusCode: agentTestResponse.status,
          suggestion: "Please verify your Agent ID and API key"
        }, { status: 500 });
      }

      const agentData = await agentTestResponse.json();
      console.log("Agent verified successfully:", agentData.name || agentData.id);

    } catch (agentError) {
      console.error("Error testing agent:", agentError);
      return NextResponse.json({
        error: "Failed to connect to ElevenLabs",
        details: agentError instanceof Error ? agentError.message : "Network error",
        suggestion: "Check your internet connection and API key"
      }, { status: 500 });
    }

    // Try to create a conversation
    try {
      const conversationResponse = await fetch(
        "https://api.elevenlabs.io/v1/convai/conversations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            agent_id: AGENT_ID,
          }),
        }
      );

      if (!conversationResponse.ok) {
        const errorText = await conversationResponse.text();
        console.error("Conversation creation failed:", errorText);
        
        return NextResponse.json({
          error: "Failed to create conversation",
          details: errorText,
          statusCode: conversationResponse.status,
          endpoint: "https://api.elevenlabs.io/v1/convai/conversations",
          method: "POST",
          suggestion: "Check ElevenLabs documentation for the latest Conversational AI endpoints."
        }, { status: 500 });
      }

      const conversationData = await conversationResponse.json();
      console.log("Conversation created successfully:", conversationData);

      const newConversationId = conversationData.conversation_id || conversationData.id;

      // Try to send a message
      const messageResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${newConversationId}`,
        {
          method: "POST", 
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: message,
          }),
        }
      );

      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        console.error("Message sending failed:", errorText);
        return NextResponse.json({
          error: "Failed to send message",
          details: errorText,
          conversationId: newConversationId,
          statusCode: messageResponse.status,
        }, { status: 500 });
      }

      const messageData = await messageResponse.json();
      console.log("Message sent successfully:", messageData);

      return NextResponse.json({
        success: true,
        conversationId: newConversationId,
        response: messageData,
        agentResponse: {
          text: messageData.agent_response || messageData.response || messageData.text || "Response received",
          audio_url: messageData.audio_url,
        },
      });

    } catch (conversationError) {
      console.error("Error in conversation flow:", conversationError);
      return NextResponse.json({
        error: "Conversation flow error",
        details: conversationError instanceof Error ? conversationError.message : "Unknown error",
      }, { status: 500 });
    }

  } catch (error) {
    console.error("ElevenLabs API error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to communicate with ElevenLabs agent",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to get conversation:", errorText);
      return NextResponse.json(
        { 
          error: "Failed to retrieve conversation", 
          details: errorText,
          statusCode: response.status,
        }, 
        { status: 500 }
      );
    }

    const conversationData = await response.json();

    return NextResponse.json({
      success: true,
      conversation: conversationData,
    });

  } catch (error) {
    console.error("ElevenLabs conversation retrieval error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve conversation",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
