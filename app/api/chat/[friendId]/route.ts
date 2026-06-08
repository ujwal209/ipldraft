import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Connection from '@/models/Connection';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ friendId: string }> }) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    const { friendId } = await params;

    await connectToDatabase();
    
    // Verify friendship exists and is accepted
    const conn = await Connection.findOne({
      $or: [
        { requester: decoded.userId, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: decoded.userId, status: 'accepted' }
      ]
    });

    if (!conn) {
      return NextResponse.json({ error: 'You must be friends to chat' }, { status: 403 });
    }

    const messages = await Message.find({
      $or: [
        { sender: decoded.userId, recipient: friendId },
        { sender: friendId, recipient: decoded.userId }
      ]
    }).sort({ createdAt: 1 }).limit(100);

    return NextResponse.json({ messages }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ friendId: string }> }) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    const { friendId } = await params;
    const { content } = await request.json();

    if (!content) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });

    await connectToDatabase();
    
    const conn = await Connection.findOne({
      $or: [
        { requester: decoded.userId, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: decoded.userId, status: 'accepted' }
      ]
    });

    if (!conn) {
      return NextResponse.json({ error: 'You must be friends to chat' }, { status: 403 });
    }

    const message = await Message.create({
      sender: decoded.userId,
      recipient: friendId,
      content
    });

    return NextResponse.json({ success: true, message }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
