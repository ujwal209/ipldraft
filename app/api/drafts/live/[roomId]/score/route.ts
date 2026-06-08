import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import LiveDraft from '@/models/LiveDraft';

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    const { roomId } = await params;
    const { score, analysis, rosterIndex } = await request.json();

    await connectToDatabase();
    
    const draft = await LiveDraft.findOne({ roomId });
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    const isHost = draft.host.toString() === decoded.userId;
    const isGuest = draft.guest && draft.guest.toString() === decoded.userId;

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (rosterIndex === 1) {
      draft.hostAnalysis = { score, analysis };
    } else {
      draft.guestAnalysis = { score, analysis };
    }

    await draft.save();

    return NextResponse.json({ success: true, draft }, { status: 200 });

  } catch (error: any) {
    console.error('Score Live Draft API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
