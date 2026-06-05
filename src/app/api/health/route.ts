import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/health - 部署诊断检查
export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. 检查环境变量
  const envVars = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    JWT_SECRET: !!process.env.JWT_SECRET,
    AI_API_KEY: !!process.env.AI_API_KEY,
    NODE_ENV: process.env.NODE_ENV || 'unknown',
  };
  checks.environment = envVars;

  // 2. 检查 MongoDB 连接
  let dbStatus = '未检查';
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    dbStatus = '已连接';
  } catch (e) {
    dbStatus = `连接失败: ${e instanceof Error ? e.message : '未知错误'}`;
  }
  checks.database = dbStatus;

  // 3. 检查 next config
  checks.nextVersion = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'local-dev';

  const allOk = envVars.MONGODB_URI && envVars.JWT_SECRET && dbStatus === '已连接';

  return NextResponse.json({
    success: allOk,
    timestamp: new Date().toISOString(),
    checks,
    tips: allOk
      ? '部署配置正常，可以尝试登录'
      : '环境变量未完全配置，请在 Vercel 项目 Settings → Environment Variables 中添加',
  });
}
