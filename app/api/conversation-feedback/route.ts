import { NextRequest, NextResponse } from 'next/server';
import { realtimeAgentService } from '@/lib/realtime-agent-service';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, timeWindowSeconds = 30 } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    if (!realtimeAgentService) {
      return NextResponse.json(
        { error: 'Agent service not available' },
        { status: 500 }
      );
    }

    const feedback = await realtimeAgentService.generateConversationFeedback(
      conversationId,
      timeWindowSeconds
    );

    if (!feedback) {
      return NextResponse.json(
        { error: 'No recent conversation found or no agent configured' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Error generating conversation feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    if (!realtimeAgentService) {
      return NextResponse.json(
        { error: 'Agent service not available' },
        { status: 500 }
      );
    }

    const allFeedback = realtimeAgentService.getConversationFeedback(conversationId);
    const latestFeedback = realtimeAgentService.getLatestFeedback(conversationId);

    return NextResponse.json({
      success: true,
      allFeedback,
      latestFeedback
    });

  } catch (error) {
    console.error('Error retrieving conversation feedback:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}
