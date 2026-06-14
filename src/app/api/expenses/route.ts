import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { saveFileToLocal, fileToBuffer } from '@/lib/localStorage';
import { uploadToR2, isR2Configured } from '@/lib/r2Storage';

const API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api-ai.7e.ink';
const API_KEY = process.env.AI_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'hunyuanocr';

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
    const statusFilter = searchParams.get('status') || 'all';
    const category = searchParams.get('category');

    await connectDB();

    const query: Record<string, unknown> = { userId: payload.userId };
    if (statusFilter === 'confirmed') query.status = 'confirmed';
    else if (statusFilter === 'pending') query.status = 'recognized';
    else query.status = { $in: ['recognized', 'confirmed'] };
    if (month) {
      const year = parseInt(month.split('-')[0]);
      const mo = parseInt(month.split('-')[1]);
      const monthStart = new Date(year, mo - 1, 1);
      const monthEnd = new Date(year, mo, 0, 23, 59, 59);
      query["$or"] = [
        { billDate: { "$regex": `^${month}-` } },
        { 
          billDate: { $in: ['', null, undefined] },
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }
      ];
    }
    if (category) query.category = category;

    const pendingCount = await Expense.countDocuments({ userId: payload.userId, status: 'pending' });
    const processingCount = await Expense.countDocuments({ userId: payload.userId, status: 'processing' });
    const reviewCount = await Expense.countDocuments({ userId: payload.userId, status: 'recognized' });

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Expense.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Expense.countDocuments(query),
    ]);

    const allConfirmed = await Expense.find({
      userId: payload.userId,
      status: { $in: ['recognized', 'confirmed'] },
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
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        reviewCount,
        pendingCount,
        processingCount,
        stats: { totalAmount, totalCount: allConfirmed.length, byCategory },
      },
    });
  } catch (error) {
    console.error('获取账单失败:', error);
    return NextResponse.json({ success: false, error: '获取账单失败' }, { status: 500 });
  }
}

/**
 * Try to parse any number from a text - handles HK$128.5, $400, 128.50, etc.
 */
function extractAmountFromText(text: string): number {
  const hkPatterns = [
    /HK\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,
    /HKD\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i,
    /港币\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,
    /金额[：:\s]*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,
    /total[：:\s]*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i,
    /合计[：:\s]*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,
    /\b(\d+(?:\.\d{1,2})?)\s*元/,
  ];
  for (const pattern of hkPatterns) {
    const m = text.match(pattern);
    if (m) return parseFloat(m[1].replace(/,/g, ''));
  }
  const anyNum = text.match(/\b(\d+(?:\.\d{1,2})?)\b/);
  if (anyNum) return parseFloat(anyNum[1]);
  return 0;
}

/**
 * More aggressive amount extraction - tries harder to find numbers
 */
function extractAnyAmount(text: string): number {
  // Try all currency patterns first
  const allPatterns = [
    // HK$ / $ / HKD with number
    /[hkHkHK]*[$＄币]\s*([0-9]+(?:[,.][0-9]{1,2})?)/,
    /(?:金额|合计|总计|总价|总额|实付|付款|消费)[：: ]*[$＄￥¥]?\s*([0-9]+(?:[,.][0-9]{1,2})?)/,
    /(?:total|amount|sum|paid|price|cost)[：: ]*[$＄￥¥]?\s*([0-9]+(?:[,.][0-9]{1,2})?)/i,
    /[$＄￥¥]([0-9]+(?:[,.][0-9]{1,2})?)\s*(?:元|港币|hkd)?/,
    /([0-9]+(?:[,.][0-9]{1,2})?)\s*(?:元|港币|hkd)/i,
    // Any decimal number that looks like currency (between 0.5 and 99999)
    /\b([1-9][0-9]*(?:[,.][0-9]{1,2})?)\s*(?:元|港币|hkd)?/,
  ];
  for (const p of allPatterns) {
    const m = text.match(p);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, "").replace(/,/g, "."));
      if (num > 0 && num < 1000000) return num;
    }
  }
  // Last resort: find any positive number
  const nums = text.match(/\b([1-9][0-9]*(?:[.,][0-9]{1,2})?)\b/g);
  if (nums) {
    for (const n of nums) {
      const num = parseFloat(n.replace(/,/g, ""));
      if (num > 0 && num < 1000000) return num;
    }
  }
  return 0;
}


/**
 * Background AI recognition - processes pending expenses asynchronously.
 * This runs as a fire-and-forget task after the POST response is sent.
 */
async function recognizeExpensesInBackground(expenseIds: string[]) {
  try {
    await connectDB();
    const expenses = await Expense.find({ _id: { $in: expenseIds } });

    for (const expense of expenses) {
      try {
        // Mark as processing
        expense.status = 'processing';
        await expense.save();

        // Fetch image from R2/public URL
        const imageResp = await fetch(expense.imageUrl);
        if (!imageResp.ok) {
          console.error(`[Expense AI] Failed to fetch image ${expense.imageUrl}: ${imageResp.status}`);
          // Reset to pending so it can be retried later
          expense.status = 'pending';
          await expense.save();
          continue;
        }
        const imageBuffer = Buffer.from(await imageResp.arrayBuffer());
        const base64Image = imageBuffer.toString('base64');
        const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

        // Call AI API
        const aiRes = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              {
                role: 'system',
                content: `你是一位专业的财务票据识别助手。请识别图片中的单据信息。

请严格按照以下 JSON 格式返回，不要包含任何其他文字：
{"amount": 金额(纯数字例如128.50),"merchant": "商户名称","category": "分类(餐饮/交通/购物/医疗/娱乐/居住/通讯/教育/其他)","description": "商品或服务描述","date": "YYYY-MM-DD"}`,
              },
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                  { type: 'text', text: '请识别这张单据上的金额、商户、日期和类别，返回JSON格式。' },
                ],
              },
            ],
            max_tokens: 1024,
            temperature: 0.1,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const aiRaw = aiData.choices?.[0]?.message?.content || '';
          console.log(`[Expense AI] Recognized ${expense._id}:`, aiRaw.substring(0, 200));

          // Parse JSON from response
          const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              expense.amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0;
              expense.merchant = parsed.merchant || '';
              expense.category = ['餐饮','交通','购物','医疗','娱乐','居住','通讯','教育','其他'].includes(parsed.category) ? parsed.category : '其他';
              expense.description = parsed.description || '';
              expense.billDate = parsed.date || '';
            } catch (parseErr) {
              console.log(`[Expense AI] JSON parse failed for ${expense._id}`);
            }
          }

          // Fallback: extract amount from raw text
          if (expense.amount === 0 && aiRaw) {
            expense.amount = extractAmountFromText(aiRaw);
            console.log(`[Expense AI] Fallback1 extracted amount for ${expense._id}:`, expense.amount);
          }
          if (expense.amount === 0 && aiRaw) {
            expense.amount = extractAnyAmount(aiRaw);
            console.log(`[Expense AI] Fallback2 extracted amount for ${expense._id}:`, expense.amount);
          }

          expense.aiRaw = aiRaw;
          expense.status = 'recognized';
        } else {
          const errorText = await aiRes.text();
          console.error(`[Expense AI] API error for ${expense._id}:`, aiRes.status, errorText.substring(0, 300));
          expense.aiRaw = errorText;
          expense.status = 'pending'; // Reset to retry later
        }
      } catch (aiErr) {
        console.error(`[Expense AI] Failed for ${expense._id}:`, aiErr);
        expense.aiRaw = String(aiErr);
        expense.status = 'pending'; // Reset to retry later
      }

      // Fallback date
      if (!expense.billDate) {
        expense.billDate = new Date().toISOString().split('T')[0];
      }

      await expense.save();
      console.log(`[Expense AI] Done ${expense._id}: HK$${expense.amount} - ${expense.merchant}`);
    }
  } catch (error) {
    console.error('[Expense AI] Background processing error:', error);
  }
}

// POST /api/expenses - Upload bills (async AI recognition - returns immediately)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    // Parse form data
    const formData = await request.formData();
    const files: File[] = Array.from(formData.getAll('files') || []).filter((v): v is File => v instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: '请上传图片' }, { status: 400 });
    }

    await connectDB();

    const results: Array<{ _id: string; fileName: string; imageUrl: string }> = [];
    const createdIds: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to R2 or local storage
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

      // Create pending record (AI will process in background)
      const expense = await Expense.create({
        userId: payload.userId,
        status: 'pending',
        imageUrl,
        imageOssKey,
        fileName: file.name,
        category: '其他',
      });

      createdIds.push(String(expense._id));
      results.push({ _id: String(expense._id), fileName: file.name, imageUrl });
    }

    // Fire background AI recognition (fire-and-forget)
    if (API_KEY && createdIds.length > 0) {
      recognizeExpensesInBackground(createdIds).catch(err => {
        console.error('[Expense] Background AI failed:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      pendingIds: createdIds,
      message: createdIds.length > 0
        ? `已上传 ${createdIds.length} 张单据，AI 正在后台识别中...`
        : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json({ success: false, error: `上传失败: ${error instanceof Error ? error.message : '未知错误'}` }, { status: 500 });
  }
}
