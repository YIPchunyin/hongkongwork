import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbError) {
      const message = dbError instanceof Error ? dbError.message : '数据库连接失败';
      console.error('登录 - 数据库连接失败:', message);
      return NextResponse.json(
        { success: false, error: '服务暂时不可用，请检查数据库配置或稍后重试' },
        { status: 503 }
      );
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // Sign JWT token
    const token = signToken({
      _id: String(user._id),
      username: user.username,
      email: user.email || '',
    });

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: String(user._id),
          username: user.username,
          name: user.name,
          email: user.email || '',
        },
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登录失败:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { success: false, error: '登录失败: ' + message },
      { status: 500 }
    );
  }
}
