import { NextRequest, NextResponse } from 'next/server';
import { verifyWithTavily, isTavilyConfigured } from '@/server/services/verification';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    if (!isTavilyConfigured()) {
      return NextResponse.json({ verified: false, sources: [], configured: false });
    }

    const result = await verifyWithTavily(query);
    return NextResponse.json({ ...result, configured: true });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
