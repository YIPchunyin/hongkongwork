import { NextRequest, NextResponse } from 'next/server';
import { findNearestStation, getStationName, getLineName, getApiStationCode } from '@/lib/mtr-stations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/mtr?lat=22.3193&lng=114.1694
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '22.3193');
    const lng = parseFloat(searchParams.get('lng') || '114.1694');

    // Find nearest station
    const { station, distance } = findNearestStation(lat, lng);

    // Get next train times for each line the station belongs to
    const lines = station.lines;
    const linePromises = lines.map(async (lineCode) => {
      const apiCode = getApiStationCode(station.code);
      const url = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=' + lineCode + '&sta=' + apiCode;

      try {
        const res = await fetch(url, {
          next: { revalidate: 0 },
          headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (json.status !== 1 || !json.data) return null;

        const stationKey = lineCode + '-' + apiCode;
        const stationData = json.data[stationKey];
        if (!stationData) return null;

        const upTrains = (stationData.UP || []).map((t: any) => ({
          direction: '上行',
          dest: getStationName(t.dest),
          destCode: t.dest,
          time: t.time,
          ttnt: parseInt(t.ttnt || '0'),
          plat: t.plat,
          valid: t.valid === 'Y',
        }));

        const downTrains = (stationData.DOWN || []).map((t: any) => ({
          direction: '下行',
          dest: getStationName(t.dest),
          destCode: t.dest,
          time: t.time,
          ttnt: parseInt(t.ttnt || '0'),
          plat: t.plat,
          valid: t.valid === 'Y',
        }));

        return {
          line: lineCode,
          lineName: getLineName(lineCode),
          stationKey,
          currTime: stationData.curr_time,
          up: upTrains,
          down: downTrains,
        };
      } catch {
        return null;
      }
    });

    const lineResults = (await Promise.all(linePromises)).filter(Boolean);
    const sysTime = lineResults[0]?.currTime || new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: {
        station: {
          code: station.code,
          nameTc: station.nameTc,
          nameEn: station.nameEn,
          lat: station.lat,
          lng: station.lng,
          lines: station.lines.map((l) => ({
            code: l,
            name: getLineName(l),
          })),
        },
        distanceKm: distance,
        sysTime,
        lines: lineResults,
      },
    });
  } catch (error) {
    console.error('获取地铁数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取地铁到站数据失败' },
      { status: 500 }
    );
  }
}
