import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only') as any;
    
    const { imageBase64 } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: 'Image is required' }, { status: 400 });

    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: 'ipl-draft-avatars',
      transformation: [{ width: 256, height: 256, crop: 'fill' }],
    });

    await connectToDatabase();
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.avatarUrl = uploadResponse.secure_url;
    await user.save();

    return NextResponse.json({ url: uploadResponse.secure_url }, { status: 200 });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
