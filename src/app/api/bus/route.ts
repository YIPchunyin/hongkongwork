import { NextRequest, NextResponse } from 'next/server';

const KMB_API = 'https://data.etabus.gov.hk/v1/transport/kmb';

export const dynamic = 'force-dynamic';


async function fetchKmb(path: string) {
  const res = await fetch(KMB_API + path, { 
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 30 }
  });
  if (!res.ok) throw new Error('KMB API error: ' + res.status);
  return res.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const route = searchParams.get('route');
    const bound = searchParams.get('bound');
    const stopId = searchParams.get('stop');
    const search = searchParams.get('search');

    // Search routes by keyword
    if (search) {
      const routes = await fetchKmb('/route/');
      const allRoutes = routes.data || [];
      const filtered = allRoutes.filter((r: any) => {
        const rn = (r.route || '').toUpperCase();
        const orig = (r.orig_tc || r.orig_en || '').toLowerCase();
        const dest = (r.dest_tc || r.dest_en || '').toLowerCase();
        const q = search.toLowerCase();
        return rn.includes(q) || orig.includes(q) || dest.includes(q);
      }).slice(0, 20);
      return NextResponse.json({ success: true, data: filtered });
    }

    // Get ETA for route+stop (service_type=1 for regular service)
    if (route && stopId) {
      const eta = await fetchKmb('/eta/' + stopId + '/' + route + '/1');
      const allEta = eta.data || [];
      return NextResponse.json({ success: true, data: allEta.filter((e: any) => e.route === route && (bound ? e.dir === bound : true)) });
    }

    // Get route stops (filter from full list)
    if (route && bound) {
      const [routeStopsRes, allStopsRes] = await Promise.all([
        fetchKmb('/route-stop/'),
        fetchKmb('/stop/'),
      ]);
      const allRouteStops = routeStopsRes.data || [];
      const stops = allRouteStops.filter((rs: any) => rs.route === route && rs.bound === bound && rs.service_type === '1');
      const stopMap: Record<string, any> = {};
      (allStopsRes.data || []).forEach((s: any) => { stopMap[s.stop] = s; });
      stops.sort((a: any, b: any) => a.seq - b.seq);
      const enriched = stops.map((rs: any) => ({
        ...rs,
        nameTc: stopMap[rs.stop]?.name_tc || '',
        nameEn: stopMap[rs.stop]?.name_en || '',
        lat: stopMap[rs.stop]?.lat,
        long: stopMap[rs.stop]?.long,
      }));
      return NextResponse.json({ success: true, data: enriched });
    }

    // Get route info
    if (route) {
      const routes = await fetchKmb('/route/');
      const allRoutes = routes.data || [];
      const routeInfo = allRoutes.filter((r: any) => r.route === route.toUpperCase());
      return NextResponse.json({ success: true, data: routeInfo });
    }

    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Bus API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

