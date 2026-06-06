import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, name, email, password } = body;

    if (!username || !name || !password) {
      return NextResponse.json(
        { success: false, error: '用户名、姓名和密码不能为空' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少6个字符' },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbError) {
      const message = dbError instanceof Error ? dbError.message : '数据库连接失败';
      console.error('注册 - 数据库连接失败:', message);
      return NextResponse.json(
        { success: false, error: '服务暂时不可用，请检查数据库配置或稍后重试' },
        { status: 503 }
      );
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该用户名已被注册' },
        { status: 409 }
      );
    }

    // If email provided, check if it's taken
    if (email) {
      const emailUser = await User.findOne({ email: email.toLowerCase() });
      if (emailUser) {
        return NextResponse.json(
          { success: false, error: '该邮箱已被注册' },
          { status: 409 }
        );
      }
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const userData: any = {
      username,
      name,
      password: hashedPassword,
    };
    if (email) {
      userData.email = email.toLowerCase();
    }

    const user = await User.create(userData);

    // Sign JWT token
    const token = signToken({
      _id: String(user._id),
      username: user.username,
      email: user.email || '',
    });

    const response = NextResponse.json(
      {
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
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('注册失败:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { success: false, error: '注册失败: ' + message },
      { status: 500 }
    );
  }
}
