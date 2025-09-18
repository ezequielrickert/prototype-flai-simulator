import { NextRequest, NextResponse } from "next/server";
import { openaiService } from "@/lib/openai-service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: "Audio file is required"
      }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not configured"
      }, { status: 500 });
    }

    if (!openaiService) {
      return NextResponse.json({
        success: false,
        error: "OpenAI service not configured"
      }, { status: 500 });
    }

    try {
      console.log('[Speech-to-Text] Processing audio file:', audioFile.name, audioFile.size, 'bytes');
      
      const transcript = await openaiService.speechToText(audioFile);
      
      console.log('[Speech-to-Text] Transcript:', transcript);
      
      return NextResponse.json({
        success: true,
        transcript: transcript
      });

    } catch (error) {
      console.error("OpenAI Whisper API error:", error);
      
      let errorMessage = "Error transcribing audio";
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          errorMessage = "Invalid OpenAI API key";
        } else if (error.message.includes("429")) {
          errorMessage = "OpenAI API rate limit exceeded";
        } else if (error.message.includes("audio")) {
          errorMessage = "Invalid audio format or corrupted file";
        } else {
          errorMessage = `OpenAI error: ${error.message}`;
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Speech-to-text API error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
