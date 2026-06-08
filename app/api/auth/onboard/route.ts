import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;
    
    const body = await request.json();
    const { favoriteTeam } = body;

    if (!favoriteTeam) {
      return NextResponse.json({ error: 'Favorite team is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { 
        favoriteTeam,
        isOnboarded: true 
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
