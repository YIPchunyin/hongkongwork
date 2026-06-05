import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: '用户名、邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少6个字符' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      const field = existingUser.username === username ? '用户名' : '邮箱';
      return NextResponse.json(
        { success: false, error: `该${field}已被注册` },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Sign JWT token
    const token = signToken({
      _id: String(user._id),
      username: user.username,
      email: user.email,
    });

    // Create response with cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: String(user._id),
            username: user.username,
            email: user.email,
          },
        },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
