import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/exchange-rate
export async function GET() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/HKD', {
      next: { revalidate: 0 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Exchange rate API returned ' + res.status);
    }

    const data = await res.json();
    const cnyRate = data.rates?.CNY;

    if (!cnyRate) {
      throw new Error('CNY rate not found');
    }

    // 1 HKD = ? CNY
    const hkdToCny = cnyRate;
    // 1 CNY = ? HKD
    const cnyToHkd = 1 / cnyRate;

    return NextResponse.json({
      success: true,
      data: {
        base: 'HKD',
        target: 'CNY',
        hkdToCny: Math.round(hkdToCny * 10000) / 10000,
        cnyToHkd: Math.round(cnyToHkd * 10000) / 10000,
        updateTime: data.date || new Date().toISOString().split('T')[0],
        source: 'exchangerate-api.com',
      },
    });
  } catch (error) {
    console.error('获取汇率失败:', error);
    // Fallback to a reasonable approximate rate
    return NextResponse.json({
      success: true,
      data: {
        base: 'HKD',
        target: 'CNY',
        hkdToCny: 0.93,
        cnyToHkd: 1.0753,
        updateTime: new Date().toISOString().split('T')[0],
        source: 'approximate',
        note: '使用近似值，实际汇率可能略有差异',
      },
    });
  }
}
