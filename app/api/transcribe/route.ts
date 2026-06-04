import { NextRequest, NextResponse } from 'next/server';
import { transcribeAndWait } from '@/server/services/transcription';

export async function POST(req: NextRequest) {
  try {
    const { audioUrl } = await req.json();

    if (!audioUrl) {
      return NextResponse.json({ error: 'audioUrl is required' }, { status: 400 });
    }

    const result = await transcribeAndWait(audioUrl);

    return NextResponse.json({
      text: result.text,
      chapters: result.chapters,
      status: result.status,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
