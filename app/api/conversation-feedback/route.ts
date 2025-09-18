import { NextRequest, NextResponse } from 'next/server';
import { professorAgentService } from '@/lib/professor-agent-service';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!professorAgentService) {
      return NextResponse.json(
        { error: 'Professor agent service not available' },
        { status: 500 }
      );
    }

    const feedback = await professorAgentService.generateSessionFeedback(sessionId);

    if (!feedback) {
      return NextResponse.json(
        { error: 'Session not found or not completed yet' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Error generating session feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!professorAgentService) {
      return NextResponse.json(
        { error: 'Professor agent service not available' },
        { status: 500 }
      );
    }

    const session = professorAgentService.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        dilemma: session.dilemma,
        phases: session.phases,
        feedback: session.feedback,
        completed: session.completed,
        duration: session.duration
      }
    });

  } catch (error) {
    console.error('Error retrieving session information:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session information' },
      { status: 500 }
    );
  }
}
