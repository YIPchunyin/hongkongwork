import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { uploadToR2, isR2Configured } from '@/lib/r2Storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const amount = parseFloat(formData.get('amount') as string) || 0;
    const merchant = (formData.get('merchant') as string) || '';
    const category = (formData.get('category') as string) || '其他';
    const billDate = (formData.get('billDate') as string) || new Date().toISOString().split('T')[0];
    const description = (formData.get('description') as string) || '';
    const project = (formData.get('project') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: '请上传图片' }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ success: false, error: '请输入有效金额' }, { status: 400 });
    }

    await connectDB();

    // 只允许写入对象存储：R2 未配置时直接拒绝，绝不落本地磁盘
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: '图片存储未配置（缺少 R2 凭证），已拒绝上传' },
        { status: 503 }
      );
    }

    // Upload image（只写 R2，失败即报错，不降级）
    const buffer = Buffer.from(await file.arrayBuffer());
    let imageUrl: string;
    let imageOssKey: string;
    try {
      const r2Result = await uploadToR2(buffer, file.name, 'expenses');
      imageUrl = r2Result.url;
      imageOssKey = r2Result.key;
    } catch (uploadErr) {
      console.error('[Expense manual] R2 上传失败:', uploadErr);
      return NextResponse.json(
        {
          success: false,
          error: '上传到对象存储失败：' + (uploadErr instanceof Error ? uploadErr.message : '未知错误'),
        },
        { status: 500 }
      );
    }

    const validCategories = ['餐饮', '交通', '购物', '医疗', '娱乐', '居住', '通讯', '教育', '其他', '工具'];
    const validCategory = validCategories.includes(category) ? category : '其他';

    const expense = await Expense.create({
      userId: payload.userId,
      status: 'confirmed', // Manual entries are immediately confirmed
      amount,
      merchant: merchant || '',
      category: validCategory,
      description: description || '',
      billDate,
      project: project || '',
      imageUrl,
      imageOssKey,
      fileName: file.name,
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: String(expense._id),
        fileName: expense.fileName,
        imageUrl: expense.imageUrl,
        amount: expense.amount,
        merchant: expense.merchant,
        category: expense.category,
        billDate: expense.billDate,
        description: expense.description,
        project: expense.project,
        status: 'confirmed',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('手动上传失败:', error);
    return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
  }
}