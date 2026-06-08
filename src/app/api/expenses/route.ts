import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { saveFileToLocal, fileToBuffer } from '@/lib/localStorage';
import { uploadToR2, isR2Configured } from '@/lib/r2Storage';

const API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api-ai.7e.ink';
const API_KEY = process.env.AI_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'qwen3-1';

export const dynamic = 'force-dynamic';

// GET /api/expenses?month=2026-06&status=confirmed&page=1
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const month = searchParams.get('month');
    const status = searchParams.get('status') || 'confirmed';
    const category = searchParams.get('category');

    await connectDB();

    const query: Record<string, unknown> = { userId: payload.userId, status };
    if (month) {
      const regex = `^${month}-`;
      query.billDate = { $regex: regex };
    }
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Expense.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Expense.countDocuments(query),
    ]);

    // Calculate monthly stats
    const allConfirmed = await Expense.find({
      userId: payload.userId,
      status: 'confirmed',
      ...(month ? { billDate: { $regex: `^${month}-` } } : {}),
    }).lean();
    const totalAmount = allConfirmed.reduce((sum, item) => sum + (item.amount || 0), 0);
    const byCategory: Record<string, { count: number; total: number }> = {};
    for (const item of allConfirmed) {
      const cat = item.category || '其他';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
      byCategory[cat].count++;
      byCategory[cat].total += item.amount || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => ({ ...item, _id: String(item._id) })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: { totalAmount, totalCount: allConfirmed.length, byCategory },
      },
    });
  } catch (error) {
    console.error('获取账单失败:', error);
    return NextResponse.json({ success: false, error: '获取账单失败' }, { status: 500 });
  }
}

// POST /api/expenses - Upload bills + AI recognize
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: '请上传账单图片' }, { status: 400 });
    }

    await connectDB();
    const results = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save image to R2 (preferred) or local storage
      let imageUrl: string, imageOssKey: string;
      const useR2 = isR2Configured();
      if (useR2) {
        const r2Result = await uploadToR2(buffer, file.name, 'expenses');
        imageUrl = r2Result.url;
        imageOssKey = r2Result.key;
      } else {
        const { relativePath } = await saveFileToLocal(buffer, file.name, 'image');
        imageUrl = `/api/files/${relativePath}`;
        imageOssKey = relativePath;
      }

      // Create record (pending)
      const expense = await Expense.create({
        userId: payload.userId,
        status: 'pending',
        imageUrl,
        imageOssKey,
        fileName: file.name,
      });

      // AI recognize
      if (!API_KEY) {
        results.push({ _id: String(expense._id), fileName: file.name, imageUrl, error: 'AI 未配置', amount: 0 });
        continue;
      }

      const base64Image = buffer.toString('base64');
      const mimeType = file.type || 'image/jpeg';

      const aiRes = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: `你是一位专业的财务票据识别助手。请识别图片中的单据信息，严格按照以下 JSON 格式返回，不要返回其他内容：
{"amount": 金额数字（纯数字，如128.50）,"merchant": "商户名称","category": "分类（餐饮/交通/购物/医疗/娱乐/居住/通讯/教育/其他）","description": "简要描述","date": "YYYY-MM-DD"}`,
            },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                { type: 'text', text: '识别这张单据' },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      });

      let amount = 0, merchant = '', category = '其他', description = '', billDate = '', aiRaw = '';
      if (aiRes.ok) {
        aiRaw = (await aiRes.json()).choices?.[0]?.message?.content || '';
        try {
          const parsed = JSON.parse((aiRaw.match(/\{[\s\S]*\}/) || ['{}'])[0]);
          amount = parsed.amount || 0;
          merchant = parsed.merchant || '';
          category = parsed.category || '其他';
          description = parsed.description || '';
          billDate = parsed.date || '';
        } catch { /* keep defaults */ }
      } else {
        aiRaw = await aiRes.text();
      }

      expense.amount = amount;
      expense.merchant = merchant;
      expense.category = category;
      expense.description = description;
      expense.billDate = billDate;
      expense.aiRaw = aiRaw;
      expense.status = 'recognized';
      await expense.save();

      results.push({ _id: String(expense._id), fileName: file.name, imageUrl, amount, merchant, category, billDate, description });
    }

    return NextResponse.json({ success: true, data: results, totalAmount: results.reduce((s, r) => s + (r.amount || 0), 0) }, { status: 201 });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json({ success: false, error: `上传失败: ${error instanceof Error ? error.message : '未知错误'}` }, { status: 500 });
  }
}
