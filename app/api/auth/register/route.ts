import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a 6-digit OTP
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      verificationToken,
    });

    await sendVerificationEmail(newUser.email, verificationToken);

    return NextResponse.json({ message: 'Registration successful. Please check your email to verify your account.' }, { status: 201 });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
