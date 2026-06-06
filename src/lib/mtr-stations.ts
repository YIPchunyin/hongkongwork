// Hong Kong MTR Stations Database
// Station codes, coordinates, names, and lines

export interface MtrStation {
  code: string;
  nameTc: string;
  nameEn: string;
  lat: number;
  lng: number;
  lines: string[];
}

export interface MtrLine {
  code: string;
  nameTc: string;
  nameEn: string;
  color: string;
}

export const MTR_LINES: Record<string, MtrLine> = {
  TWL: { code: 'TWL', nameTc: '荃灣線', nameEn: 'Tsuen Wan Line', color: '#E2231A' },
  KTL: { code: 'KTL', nameTc: '觀塘線', nameEn: 'Kwun Tong Line', color: '#00A85D' },
  ISL: { code: 'ISL', nameTc: '港島線', nameEn: 'Island Line', color: '#004EA2' },
  TKL: { code: 'TKL', nameTc: '將軍澳線', nameEn: 'Tseung Kwan O Line', color: '#7B4E9B' },
  TML: { code: 'TML', nameTc: '屯馬線', nameEn: 'Tuen Ma Line', color: '#A75B2E' },
  EAL: { code: 'EAL', nameTc: '東鐵線', nameEn: 'East Rail Line', color: '#5EB6E4' },
  SIL: { code: 'SIL', nameTc: '南港島線', nameEn: 'South Island Line', color: '#CAC400' },
  DRL: { code: 'DRL', nameTc: '迪士尼線', nameEn: 'Disneyland Resort Line', color: '#F36C21' },
  AEL: { code: 'AEL', nameTc: '機場快線', nameEn: 'Airport Express', color: '#00888A' },
  EAL_LO: { code: 'EAL_LO', nameTc: '東鐵線(落馬洲)', nameEn: 'East Rail Line (Lok Ma Chau)', color: '#5EB6E4' },
};

export const MTR_STATIONS: MtrStation[] = [
  // === 荃灣線 Tsuen Wan Line (TWL) ===
  { code: 'TST', nameTc: '尖沙咀', nameEn: 'Tsim Sha Tsui', lat: 22.2974, lng: 114.1723, lines: ['TWL'] },
  { code: 'ADM', nameTc: '金鐘', nameEn: 'Admiralty', lat: 22.2792, lng: 114.1648, lines: ['TWL', 'ISL', 'SIL', 'EAL'] },
  { code: 'CEN', nameTc: '中環', nameEn: 'Central', lat: 22.2819, lng: 114.1585, lines: ['TWL', 'ISL'] },
  { code: 'JOR', nameTc: '佐敦', nameEn: 'Jordan', lat: 22.3047, lng: 114.1710, lines: ['TWL'] },
  { code: 'YMT', nameTc: '油麻地', nameEn: 'Yau Ma Tei', lat: 22.3128, lng: 114.1705, lines: ['TWL'] },
  { code: 'MOK', nameTc: '旺角', nameEn: 'Mong Kok', lat: 22.3192, lng: 114.1702, lines: ['TWL', 'KTL'] },
  { code: 'PRE', nameTc: '太子', nameEn: 'Prince Edward', lat: 22.3256, lng: 114.1686, lines: ['TWL', 'KTL'] },
  { code: 'SSP', nameTc: '深水埗', nameEn: 'Sham Shui Po', lat: 22.3305, lng: 114.1620, lines: ['TWL'] },
  { code: 'CSW', nameTc: '長沙灣', nameEn: 'Cheung Sha Wan', lat: 22.3361, lng: 114.1565, lines: ['TWL'] },
  { code: 'LCK', nameTc: '荔枝角', nameEn: 'Lai Chi Kok', lat: 22.3378, lng: 114.1481, lines: ['TWL'] },
  { code: 'MEF', nameTc: '美孚', nameEn: 'Mei Foo', lat: 22.3375, lng: 114.1383, lines: ['TWL', 'TML'] },
  { code: 'LAK', nameTc: '荔景', nameEn: 'Lai King', lat: 22.3481, lng: 114.1278, lines: ['TWL'] },
  { code: 'KWF', nameTc: '葵芳', nameEn: 'Kwai Fong', lat: 22.3567, lng: 114.1275, lines: ['TWL'] },
  { code: 'KWH', nameTc: '葵興', nameEn: 'Kwai Hing', lat: 22.3628, lng: 114.1314, lines: ['TWL'] },
  { code: 'TWH', nameTc: '大窩口', nameEn: 'Tai Wo Hau', lat: 22.3708, lng: 114.1269, lines: ['TWL'] },
  { code: 'TSW', nameTc: '荃灣', nameEn: 'Tsuen Wan', lat: 22.3736, lng: 114.1178, lines: ['TWL'] },

  // === 觀塘線 Kwun Tong Line (KTL) ===
  { code: 'WHT', nameTc: '黃大仙', nameEn: 'Wong Tai Sin', lat: 22.3408, lng: 114.1969, lines: ['KTL'] },
  { code: 'DIH', nameTc: '鑽石山', nameEn: 'Diamond Hill', lat: 22.3403, lng: 114.2028, lines: ['KTL', 'TML'] },
  { code: 'KWT', nameTc: '九龍塘', nameEn: 'Kowloon Tong', lat: 22.3378, lng: 114.1767, lines: ['KTL', 'EAL'] },
  { code: 'LOF', nameTc: '樂富', nameEn: 'Lok Fu', lat: 22.3372, lng: 114.1875, lines: ['KTL'] },
  { code: 'HOM', nameTc: '何文田', nameEn: 'Ho Man Tin', lat: 22.3089, lng: 114.1861, lines: ['KTL', 'TML'] },
  { code: 'SKM', nameTc: '石硤尾', nameEn: 'Shek Kip Mei', lat: 22.3300, lng: 114.1700, lines: ['KTL'] },
  { code: 'KOB', nameTc: '九龍灣', nameEn: 'Kowloon Bay', lat: 22.3258, lng: 114.2136, lines: ['KTL'] },
  { code: 'NTK', nameTc: '牛頭角', nameEn: 'Ngau Tau Kok', lat: 22.3175, lng: 114.2183, lines: ['KTL'] },
  { code: 'KWT2', nameTc: '觀塘', nameEn: 'Kwun Tong', lat: 22.3122, lng: 114.2247, lines: ['KTL'] },
  { code: 'LAT', nameTc: '藍田', nameEn: 'Lam Tin', lat: 22.3069, lng: 114.2364, lines: ['KTL'] },
  { code: 'YAT', nameTc: '油塘', nameEn: 'Yau Tong', lat: 22.2975, lng: 114.2392, lines: ['KTL', 'TKL'] },
  { code: 'TIK', nameTc: '調景嶺', nameEn: 'Tiu Keng Leng', lat: 22.3050, lng: 114.2525, lines: ['KTL', 'TKL'] },
  { code: 'SWH', nameTc: '順利', nameEn: 'Shun Lee', lat: 22.3258, lng: 114.2269, lines: ['KTL'] },
  { code: 'WFS', nameTc: '彩虹', nameEn: 'Choi Hung', lat: 22.3350, lng: 114.2094, lines: ['KTL'] },

  // === 港島線 Island Line (ISL) ===
  { code: 'SYP', nameTc: '西營盤', nameEn: 'Sai Ying Pun', lat: 22.2875, lng: 114.1431, lines: ['ISL'] },
  { code: 'HKU', nameTc: '香港大學', nameEn: 'HKU', lat: 22.2842, lng: 114.1353, lines: ['ISL'] },
  { code: 'SHW', nameTc: '上環', nameEn: 'Sheung Wan', lat: 22.2869, lng: 114.1511, lines: ['ISL'] },
  { code: 'WAC', nameTc: '金鐘(港島)', nameEn: 'Admiralty (ISL)', lat: 22.2792, lng: 114.1648, lines: ['ISL'] },
  { code: 'WAN', nameTc: '灣仔', nameEn: 'Wan Chai', lat: 22.2778, lng: 114.1728, lines: ['ISL'] },
  { code: 'CWB', nameTc: '銅鑼灣', nameEn: 'Causeway Bay', lat: 22.2806, lng: 114.1839, lines: ['ISL'] },
  { code: 'TIH', nameTc: '天后', nameEn: 'Tin Hau', lat: 22.2833, lng: 114.1917, lines: ['ISL'] },
  { code: 'FOH', nameTc: '炮台山', nameEn: 'Fortress Hill', lat: 22.2881, lng: 114.1950, lines: ['ISL'] },
  { code: 'NOP', nameTc: '北角', nameEn: 'North Point', lat: 22.2914, lng: 114.2000, lines: ['ISL', 'TKL'] },
  { code: 'QUB', nameTc: '鰂魚涌', nameEn: 'Quarry Bay', lat: 22.2922, lng: 114.2103, lines: ['ISL', 'TKL'] },
  { code: 'TAW', nameTc: '太古', nameEn: 'Tai Koo', lat: 22.2861, lng: 114.2169, lines: ['ISL'] },
  { code: 'SKW', nameTc: '西灣河', nameEn: 'Sai Wan Ho', lat: 22.2825, lng: 114.2214, lines: ['ISL'] },
  { code: 'SWH2', nameTc: '筲箕灣', nameEn: 'Shau Kei Wan', lat: 22.2803, lng: 114.2300, lines: ['ISL'] },
  { code: 'HFC', nameTc: '杏花邨', nameEn: 'Heng Fa Chuen', lat: 22.2778, lng: 114.2400, lines: ['ISL'] },
  { code: 'CHW', nameTc: '柴灣', nameEn: 'Chai Wan', lat: 22.2681, lng: 114.2400, lines: ['ISL'] },

  // === 將軍澳線 Tseung Kwan O Line (TKL) ===
  { code: 'LHP', nameTc: '坑口', nameEn: 'Hang Hau', lat: 22.3175, lng: 114.2669, lines: ['TKL'] },
  { code: 'POA', nameTc: '寶琳', nameEn: 'Po Lam', lat: 22.3231, lng: 114.2589, lines: ['TKL'] },
  { code: 'TKO', nameTc: '將軍澳', nameEn: 'Tseung Kwan O', lat: 22.3078, lng: 114.2586, lines: ['TKL'] },
  { code: 'HAH', nameTc: '康城', nameEn: 'LOHAS Park', lat: 22.2933, lng: 114.2689, lines: ['TKL'] },

  // === 屯馬線 Tuen Ma Line (TML) ===
  { code: 'TUM', nameTc: '屯門', nameEn: 'Tuen Mun', lat: 22.3925, lng: 113.9744, lines: ['TML'] },
  { code: 'SIH', nameTc: '兆康', nameEn: 'Siu Hong', lat: 22.4117, lng: 113.9819, lines: ['TML'] },
  { code: 'TIS', nameTc: '天水圍', nameEn: 'Tin Shui Wai', lat: 22.4500, lng: 114.0031, lines: ['TML'] },
  { code: 'LOP', nameTc: '朗屏', nameEn: 'Long Ping', lat: 22.4442, lng: 114.0228, lines: ['TML'] },
  { code: 'YUL', nameTc: '元朗', nameEn: 'Yuen Long', lat: 22.4428, lng: 114.0344, lines: ['TML'] },
  { code: 'KSR', nameTc: '錦上路', nameEn: 'Kam Sheung Road', lat: 22.4361, lng: 114.0636, lines: ['TML'] },
  { code: 'TWW', nameTc: '荃灣西', nameEn: 'Tsuen Wan West', lat: 22.3692, lng: 114.1125, lines: ['TML'] },
  { code: 'NAC', nameTc: '南昌', nameEn: 'Nam Cheong', lat: 22.3267, lng: 114.1553, lines: ['TML'] },
  { code: 'AUS', nameTc: '奧運', nameEn: 'Olympic', lat: 22.3172, lng: 114.1603, lines: ['TML'] },
  { code: 'KOW', nameTc: '柯士甸', nameEn: 'Austin', lat: 22.3047, lng: 114.1642, lines: ['TML'] },
  { code: 'ETS', nameTc: '尖東', nameEn: 'East Tsim Sha Tsui', lat: 22.2975, lng: 114.1717, lines: ['TML'] },
  { code: 'HUH', nameTc: '紅磡', nameEn: 'Hung Hom', lat: 22.3025, lng: 114.1867, lines: ['TML', 'EAL'] },
  { code: 'TAK', nameTc: '啟德', nameEn: 'Kai Tak', lat: 22.3281, lng: 114.1981, lines: ['TML'] },
  { code: 'SUW', nameTc: '宋皇臺', nameEn: 'Sung Wong Toi', lat: 22.3286, lng: 114.1875, lines: ['TML'] },
  { code: 'TUK', nameTc: '土瓜灣', nameEn: 'To Kwa Wan', lat: 22.3167, lng: 114.1900, lines: ['TML'] },
  { code: 'WKS', nameTc: '烏溪沙', nameEn: 'Wu Kai Sha', lat: 22.4258, lng: 114.2444, lines: ['TML'] },
  { code: 'MOS', nameTc: '馬鞍山', nameEn: 'Ma On Shan', lat: 22.4210, lng: 114.2240, lines: ['TML'] },
  { code: 'HIK', nameTc: '恆安', nameEn: 'Heng On', lat: 22.4197, lng: 114.2150, lines: ['TML'] },
  { code: 'TSH', nameTc: '大水坑', nameEn: 'Tai Shui Hang', lat: 22.4167, lng: 114.2067, lines: ['TML'] },
  { code: 'SHT', nameTc: '石門', nameEn: 'Shek Mun', lat: 22.3892, lng: 114.2050, lines: ['TML'] },
  { code: 'CIO', nameTc: '第一城', nameEn: 'City One', lat: 22.3856, lng: 114.2042, lines: ['TML'] },
  { code: 'STW', nameTc: '沙田圍', nameEn: 'Sha Tin Wai', lat: 22.3789, lng: 114.1961, lines: ['TML'] },
  { code: 'SHT2', nameTc: '車公廟', nameEn: 'Che Kung Temple', lat: 22.3750, lng: 114.1894, lines: ['TML'] },
  { code: 'TAW2', nameTc: '大圍', nameEn: 'Tai Wai', lat: 22.3722, lng: 114.1769, lines: ['TML', 'EAL'] },

  // === 東鐵線 East Rail Line (EAL) ===
  { code: 'LOW', nameTc: '羅湖', nameEn: 'Lo Wu', lat: 22.5278, lng: 114.1139, lines: ['EAL'] },
  { code: 'LMC', nameTc: '落馬洲', nameEn: 'Lok Ma Chau', lat: 22.5139, lng: 114.0658, lines: ['EAL_LO'] },
  { code: 'SHT3', nameTc: '上水', nameEn: 'Sheung Shui', lat: 22.5014, lng: 114.1286, lines: ['EAL'] },
  { code: 'FAN', nameTc: '粉嶺', nameEn: 'Fanling', lat: 22.4917, lng: 114.1392, lines: ['EAL'] },
  { code: 'TAP', nameTc: '太和', nameEn: 'Tai Wo', lat: 22.4514, lng: 114.1647, lines: ['EAL'] },
  { code: 'TWR', nameTc: '大埔墟', nameEn: 'Tai Po Market', lat: 22.4450, lng: 114.1686, lines: ['EAL'] },
  { code: 'UNI', nameTc: '大學', nameEn: 'University', lat: 22.4136, lng: 114.2106, lines: ['EAL'] },
  { code: 'SHT4', nameTc: '火炭', nameEn: 'Fo Tan', lat: 22.3961, lng: 114.1950, lines: ['EAL'] },
  { code: 'SHT5', nameTc: '沙田', nameEn: 'Sha Tin', lat: 22.3833, lng: 114.1883, lines: ['EAL'] },
  { code: 'KOT', nameTc: '九龍塘(東鐵)', nameEn: 'Kowloon Tong (EAL)', lat: 22.3378, lng: 114.1767, lines: ['EAL'] },
  { code: 'MKK', nameTc: '旺角東', nameEn: 'Mong Kok East', lat: 22.3211, lng: 114.1731, lines: ['EAL'] },
  { code: 'HUH2', nameTc: '紅磡(東鐵)', nameEn: 'Hung Hom (EAL)', lat: 22.3025, lng: 114.1867, lines: ['EAL'] },
  { code: 'EXC', nameTc: '會展', nameEn: 'Exhibition Centre', lat: 22.2836, lng: 114.1769, lines: ['EAL'] },

  // === 南港島線 South Island Line (SIL) ===
  { code: 'SOH', nameTc: '香港大學(南)', nameEn: 'HKU (SIL)', lat: 22.2842, lng: 114.1353, lines: ['SIL'] },
  { code: 'LEI', nameTc: '利東', nameEn: 'Lei Tung', lat: 22.2400, lng: 114.1567, lines: ['SIL'] },
  { code: 'WCH', nameTc: '黃竹坑', nameEn: 'Wong Chuk Hang', lat: 22.2481, lng: 114.1689, lines: ['SIL'] },
  { code: 'SHT6', nameTc: '海怡半島', nameEn: 'South Horizons', lat: 22.2350, lng: 114.1489, lines: ['SIL'] },
  { code: 'APL', nameTc: '鴨脷洲', nameEn: 'Ap Lei Chau', lat: 22.2436, lng: 114.1614, lines: ['SIL'] },

  // === 迪士尼線 Disneyland Resort Line (DRL) ===
  { code: 'SUN', nameTc: '欣澳', nameEn: 'Sunny Bay', lat: 22.3328, lng: 114.0275, lines: ['DRL'] },
  { code: 'DIS', nameTc: '迪士尼', nameEn: 'Disneyland Resort', lat: 22.3169, lng: 114.0431, lines: ['DRL'] },

  // === 機場快線 Airport Express (AEL) ===
  { code: 'HOK', nameTc: '香港', nameEn: 'Hong Kong', lat: 22.2847, lng: 114.1628, lines: ['AEL'] },
  { code: 'KOW2', nameTc: '九龍(機場)', nameEn: 'Kowloon (AEL)', lat: 22.3042, lng: 114.1647, lines: ['AEL'] },
  { code: 'TSY', nameTc: '青衣', nameEn: 'Tsing Yi', lat: 22.3531, lng: 114.1078, lines: ['AEL'] },
  { code: 'AIR', nameTc: '機場', nameEn: 'Airport', lat: 22.3150, lng: 113.9369, lines: ['AEL'] },
  { code: 'AWE', nameTc: '博覽館', nameEn: 'AsiaWorld Expo', lat: 22.3211, lng: 113.9444, lines: ['AEL'] },
];

// Station code to full station lookup
const stationByCode: Record<string, MtrStation> = {};
for (const s of MTR_STATIONS) {
  stationByCode[s.code] = s;
}

export function getStationByCode(code: string): MtrStation | undefined {
  return stationByCode[code];
}

export function getStationName(code: string): string {
  return stationByCode[code]?.nameTc || code;
}

export function getLineName(lineCode: string): string {
  return MTR_LINES[lineCode]?.nameTc || lineCode;
}

export function getLineColor(lineCode: string): string {
  return MTR_LINES[lineCode]?.color || '#999';
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestStation(lat: number, lng: number): { station: MtrStation; distance: number } {
  let best: MtrStation | null = null;
  let bestDist = Infinity;
  for (const s of MTR_STATIONS) {
    const dist = haversine(lat, lng, s.lat, s.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return { station: best!, distance: Math.round(bestDist * 1000) / 1000 };
}

// Map station codes to their API station IDs 
// For most stations the code is the same, but for interchange stations we map to the primary code
export function getApiStationCode(code: string): string {
  const map: Record<string, string> = {
    WAC: 'ADM',   // Admiralty ISL -> ADM
    KWT2: 'KWT',  // Kwun Tong station
    SWH2: 'SWH',  // Shau Kei Wan
    TAW2: 'TAW',  // Tai Wai (TML)
    SHT2: 'SHT',  // Che Kung Temple
    SHT3: 'SHT',  // Sheung Shui
    SHT4: 'SHT',  // Fo Tan
    SHT5: 'SHT',  // Sha Tin
    SHT6: 'SHT',  // South Horizons
    KOT: 'KWT',   // Kowloon Tong EAL -> KWT
    HUH2: 'HUH',  // Hung Hom EAL -> HUH
    KOW2: 'KOW',  // Kowloon AEL -> KOW
  };
  return map[code] || code;
}
