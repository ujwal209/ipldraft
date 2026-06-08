import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import Draft from '@/models/Draft';

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;
    
    const { teamName, franchise, year, players, score, analysis } = await request.json();
    
    if (!teamName || !players || players.length === 0) {
      return NextResponse.json({ error: 'Missing required draft data' }, { status: 400 });
    }

    await connectToDatabase();
    
    const newDraft = await Draft.create({
      userId: decoded.userId,
      teamName,
      franchise,
      year,
      players,
      score,
      analysis
    });

    return NextResponse.json({ success: true, draftId: newDraft._id }, { status: 201 });

  } catch (error: any) {
    console.error('Save Draft Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
