import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/exchange-rate/history?period=1m|6m|1y
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1m';

    const now = new Date();
    let startDate: Date;
    if (period === '1y') {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else if (period === '6m') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const fmt = (d: Date) =>
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');

    const url = 'https://api.frankfurter.app/' + fmt(startDate) + '..' + fmt(now) + '?from=HKD&to=CNY';

    const res = await fetch(url, {
      next: { revalidate: 0 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Frankfurter returned ' + res.status);
    }

    const data = await res.json();
    const rates = data.rates || {};

    // Convert to array of { date, rate }
    const history: { date: string; rate: number }[] = [];
    for (const [dateStr, rateObj] of Object.entries(rates)) {
      const cnyRate = (rateObj as Record<string, number>).CNY;
      if (cnyRate) {
        history.push({ date: dateStr, rate: Math.round(cnyRate * 10000) / 10000 });
      }
    }
    history.sort((a, b) => a.date.localeCompare(b.date));

    // Get current rate
    const currentRes = await fetch('https://api.exchangerate-api.com/v4/latest/HKD', {
      next: { revalidate: 0 },
    });
    const currentData = await currentRes.json();
    const currentRate = Math.round((currentData.rates?.CNY || 0.93) * 10000) / 10000;

    // Calculate stats
    const rates_only = history.map(h => h.rate);
    const min_rate = rates_only.length > 0 ? Math.min(...rates_only) : currentRate;
    const max_rate = rates_only.length > 0 ? Math.max(...rates_only) : currentRate;
    const avg_rate = rates_only.length > 0
      ? Math.round((rates_only.reduce((a, b) => a + b, 0) / rates_only.length) * 10000) / 10000
      : currentRate;

    return NextResponse.json({
      success: true,
      data: {
        history,
        current: currentRate,
        stats: {
          min: min_rate,
          max: max_rate,
          avg: avg_rate,
          change: history.length >= 2
            ? Math.round((currentRate - history[0].rate) * 10000) / 10000
            : 0,
          changePercent: history.length >= 2
            ? Math.round(((currentRate - history[0].rate) / history[0].rate) * 10000) / 100
            : 0,
        },
        period,
      },
    });
  } catch (error) {
    console.error('获取汇率历史失败:', error);
    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      data: {
        history: [],
        current: 0.93,
        stats: { min: 0.93, max: 0.93, avg: 0.93, change: 0, changePercent: 0 },
        period: '1m',
        note: '历史数据暂不可用',
      },
    });
  }
}
