import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    await connectToDatabase();
    
    if (!query) return NextResponse.json({ users: [] }, { status: 200 });
    
    const users = await User.find({
      $and: [
        { _id: { $ne: decoded.userId } },
        { 
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email avatarUrl favoriteTeam').limit(10);

    return NextResponse.json({ users }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
