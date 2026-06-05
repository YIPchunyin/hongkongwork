import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api-ai.7e.ink';
const API_KEY = process.env.AI_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'qwen3-1';

// Maximum image size: 10MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { success: false, error: '未配置 AI API Key' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: '请上传账单图片' },
        { status: 400 }
      );
    }

    const results = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (buffer.length > MAX_IMAGE_SIZE) {
        results.push({
          fileName: file.name,
          error: '图片过大（超过 10MB），请压缩后重试',
          amount: 0,
          merchant: '',
          category: '其他',
          date: '',
          description: '',
          aiRaw: '',
        });
        continue;
      }

      const base64Image = buffer.toString('base64');
      const mimeType = file.type || 'image/jpeg';

      // Send image directly to vision model
      const aiRes = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: `你是一位专业的财务票据识别助手。请识别图片中的单据信息，严格按照以下 JSON 格式返回，不要返回其他内容：
{
  "amount": 金额数字（纯数字，如 128.50，没有找到返回 0）,
  "merchant": "商户名称",
  "category": "分类（餐饮/交通/购物/医疗/娱乐/居住/通讯/教育/其他）",
  "description": "简要描述消费内容",
  "date": "YYYY-MM-DD 格式的日期"
}

注意：
- 金额优先找"总计"、"合计"、"Total"、"Amount"、"HK$"、"$" 后面的数字
- 日期优先找"日期"、"Date" 后面的日期
- 如果是香港单据，注意识别繁体中文和英文混合内容
- 如果无法识别某些字段，使用空字符串或合理默认值`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType};base64,${base64Image}` },
                },
                {
                  type: 'text',
                  text: '请识别这张单据中的金额、商户、日期和分类',
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        results.push({
          fileName: file.name,
          error: `AI 识别失败: ${errText}`,
          amount: 0,
          merchant: '',
          category: '其他',
          date: '',
          description: '',
          aiRaw: errText,
        });
        continue;
      }

      const aiData = await aiRes.json();
      const aiContent = aiData.choices?.[0]?.message?.content || '';

      // Parse AI response as JSON
      let parsed: { amount?: number; merchant?: string; category?: string; description?: string; date?: string } = {};
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Keep empty parsed
      }

      results.push({
        fileName: file.name,
        amount: parsed.amount || 0,
        merchant: parsed.merchant || '',
        category: parsed.category || '其他',
        description: parsed.description || '',
        date: parsed.date || new Date().toISOString().split('T')[0],
        aiRaw: aiContent,
        error: null,
      });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('AI 识别失败:', error);
    return NextResponse.json(
      { success: false, error: `AI 识别失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
