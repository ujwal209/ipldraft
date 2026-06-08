import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import Connection from '@/models/Connection';

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    await connectToDatabase();
    
    // Fetch connections where user is either requester or recipient
    const connections = await Connection.find({
      $or: [{ requester: decoded.userId }, { recipient: decoded.userId }]
    }).populate('requester', 'name email avatarUrl favoriteTeam').populate('recipient', 'name email avatarUrl favoriteTeam');

    return NextResponse.json({ connections }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    const { targetUserId, action } = await request.json();

    await connectToDatabase();

    if (action === 'send') {
      const existing = await Connection.findOne({
        $or: [
          { requester: decoded.userId, recipient: targetUserId },
          { requester: targetUserId, recipient: decoded.userId }
        ]
      });

      if (existing) return NextResponse.json({ error: 'Connection already exists' }, { status: 400 });

      const newConn = await Connection.create({ requester: decoded.userId, recipient: targetUserId });
      return NextResponse.json({ success: true, connection: newConn }, { status: 201 });
    } 
    
    if (action === 'accept') {
      const conn = await Connection.findOneAndUpdate(
        { requester: targetUserId, recipient: decoded.userId, status: 'pending' },
        { status: 'accepted' },
        { new: true }
      );
      if (!conn) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      return NextResponse.json({ success: true, connection: conn }, { status: 200 });
    }

    if (action === 'cancel') {
      const conn = await Connection.findOneAndDelete({
        $or: [
          { requester: decoded.userId, recipient: targetUserId, status: 'pending' },
          { requester: targetUserId, recipient: decoded.userId, status: 'pending' }
        ]
      });
      if (!conn) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
