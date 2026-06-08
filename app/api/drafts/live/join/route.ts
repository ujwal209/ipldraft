import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import LiveDraft from '@/models/LiveDraft';

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    const { roomId } = await request.json();
    if (!roomId) return NextResponse.json({ error: 'Room code required' }, { status: 400 });

    await connectToDatabase();
    
    const draft = await LiveDraft.findOne({ roomId: roomId.toUpperCase() });
    if (!draft) return NextResponse.json({ error: 'Invalid room code' }, { status: 404 });

    // If guest is empty, assign this user as guest and set to active
    if (!draft.guest) {
      if (draft.host.toString() === decoded.userId) {
         return NextResponse.json({ error: 'You are already the host of this room.' }, { status: 400 });
      }
      draft.guest = decoded.userId;
      draft.status = 'active';
      await draft.save();
    }
    // If room is full, they are just a spectator, which is fine. We return success.

    return NextResponse.json({ roomId: draft.roomId, message: 'Joined successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Join Live Draft API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
