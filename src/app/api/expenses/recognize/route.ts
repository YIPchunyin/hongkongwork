import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/lib/models/Expense';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api-ai.7e.ink';
const API_KEY = process.env.AI_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'qwen3.5-4';

export const dynamic = 'force-dynamic';

/**
 * Extract amount from text fallback
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

// POST /api/expenses/recognize - Process next pending expense with AI (for reliable background processing)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const specificId = searchParams.get('id');

    await connectDB();

    // Find the oldest pending/processing record for this user
    const query: Record<string, unknown> = {
      userId: payload.userId,
      status: { $in: ['pending', 'processing'] },
    };
    // If a specific ID is provided, try that one first
    if (specificId) {
      query._id = specificId;
    }

    const expense = await Expense.findOne(query).sort({ createdAt: 1 });
    if (!expense) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '没有待识别的单据',
      });
    }

    // Mark as processing
    expense.status = 'processing';
    await expense.save();

    let recognized = false;
    try {
      // Fetch image
      const imageResp = await fetch(expense.imageUrl);
      if (!imageResp.ok) {
        throw new Error(`Failed to fetch image: ${imageResp.status}`);
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
        console.log(`[Expense Recognize] Raw:`, aiRaw.substring(0, 200));

        const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            expense.amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0;
            expense.merchant = parsed.merchant || '';
            expense.category = ['餐饮','交通','购物','医疗','娱乐','居住','通讯','教育','其他'].includes(parsed.category) ? parsed.category : '其他';
            expense.description = parsed.description || '';
            expense.billDate = parsed.date || '';
          } catch (e) {}
        }

        if (expense.amount === 0 && aiRaw) {
          expense.amount = extractAmountFromText(aiRaw);
        }

        expense.aiRaw = aiRaw;
        recognized = true;
      } else {
        const errorText = await aiRes.text();
        console.error(`[Expense Recognize] API error:`, aiRes.status, errorText.substring(0, 300));
        expense.aiRaw = errorText;
      }
    } catch (err) {
      console.error(`[Expense Recognize] Failed:`, err);
      expense.aiRaw = String(err);
    }

    if (recognized) {
      expense.status = 'recognized';
    } else {
      expense.status = 'pending'; // Reset to retry later
    }
    if (!expense.billDate) {
      expense.billDate = new Date().toISOString().split('T')[0];
    }
    await expense.save();

    return NextResponse.json({
      success: true,
      data: {
        _id: String(expense._id),
        fileName: expense.fileName,
        imageUrl: expense.imageUrl,
        amount: expense.amount,
        merchant: expense.merchant,
        category: expense.category,
        description: expense.description,
        billDate: expense.billDate,
        status: expense.status,
        recognized,
      },
    });
  } catch (error) {
    console.error('识别失败:', error);
    return NextResponse.json({ success: false, error: '识别失败' }, { status: 500 });
  }
}
