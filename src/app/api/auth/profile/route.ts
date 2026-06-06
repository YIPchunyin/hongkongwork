import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken, getTokenFromRequest, signToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const body = await request.json();
    const { username, name } = body;

    if (!username || !name) {
      return NextResponse.json({ success: false, error: '用户名和姓名不能为空' }, { status: 400 });
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ success: false, error: '用户名长度2-20个字符' }, { status: 400 });
    }

    if (name.length > 30) {
      return NextResponse.json({ success: false, error: '姓名最多30个字符' }, { status: 400 });
    }

    await connectDB();

    // Check if new username is taken by another user
    const existingUser = await User.findOne({ username, _id: { $ne: payload.userId } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: '该用户名已被使用' }, { status: 409 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.userId,
      { username, name },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // Re-sign token with new username
    const newToken = signToken({
      _id: String(updatedUser._id),
      username: updatedUser.username,
      email: updatedUser.email || '',
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: String(updatedUser._id),
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email || '',
      },
    });

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('更新个人信息失败:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: '更新失败: ' + message }, { status: 500 });
  }
}