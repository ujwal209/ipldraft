import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import LiveDraft from '@/models/LiveDraft';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    const { roomId } = await params;

    await connectToDatabase();
    
    // We populate host and guest to send their names to the client
    const draft = await LiveDraft.findOne({ roomId }).populate('host', 'name favoriteTeam').populate('guest', 'name favoriteTeam');
    
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    // Determine role
    const isHost = draft.host._id.toString() === decoded.userId;
    let isGuest = draft.guest && draft.guest._id.toString() === decoded.userId;

    if (!isHost && !draft.guest && draft.status === 'waiting') {
      draft.guest = decoded.userId;
      draft.status = 'active';
      await draft.save();
      await draft.populate('guest', 'name favoriteTeam');
      isGuest = true;
    }

    let myRole = 0; // Spectator
    if (isHost) myRole = 1;
    else if (isGuest) myRole = 2;

    return NextResponse.json({ 
      draft, 
      myRole
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get Live Draft API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
