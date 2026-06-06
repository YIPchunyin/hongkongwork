// Hong Kong districts approximate center coordinates
const HK_DISTRICTS: { name: string; lat: number; lng: number }[] = [
  { name: '中西区', lat: 22.286, lng: 114.152 },
  { name: '湾仔区', lat: 22.279, lng: 114.173 },
  { name: '东区', lat: 22.282, lng: 114.226 },
  { name: '南区', lat: 22.247, lng: 114.159 },
  { name: '油尖旺区', lat: 22.311, lng: 114.171 },
  { name: '深水埗区', lat: 22.332, lng: 114.162 },
  { name: '九龙城区', lat: 22.327, lng: 114.192 },
  { name: '黄大仙区', lat: 22.342, lng: 114.197 },
  { name: '观塘区', lat: 22.313, lng: 114.226 },
  { name: '荃湾区', lat: 22.370, lng: 114.112 },
  { name: '屯门区', lat: 22.394, lng: 113.976 },
  { name: '元朗区', lat: 22.444, lng: 114.035 },
  { name: '北区', lat: 22.502, lng: 114.147 },
  { name: '大埔区', lat: 22.446, lng: 114.169 },
  { name: '沙田区', lat: 22.382, lng: 114.188 },
  { name: '西贡区', lat: 22.383, lng: 114.275 },
  { name: '离岛区', lat: 22.262, lng: 113.946 },
  { name: '葵青区', lat: 22.356, lng: 114.127 },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findDistrict(lat: number, lng: number): string {
  let best = '香港';
  let bestDist = Infinity;
  for (const d of HK_DISTRICTS) {
    const dist = haversineDistance(lat, lng, d.lat, d.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = d.name;
    }
  }
  return bestDist < 15 ? best : '香港';
}

// HKO weather icon to weather code mapping
const HKO_ICON_MAP: Record<string, number> = {
  'pic50.png': 0,   // Sunny
  'pic51.png': 1,   // Sunny intervals
  'pic52.png': 2,   // Cloudy
  'pic53.png': 2,   // Cloudy
  'pic54.png': 3,   // Overcast
  'pic60.png': 61,  // Rain
  'pic61.png': 61,  // Light Rain
  'pic62.png': 61,  // Rain
  'pic63.png': 63,  // Heavy Rain
  'pic64.png': 65,  // Heavy Rain
  'pic65.png': 63,  // Rain
  'pic70.png': 71,  // Snow
  'pic71.png': 73,  // Snow
  'pic72.png': 75,  // Heavy Snow
  'pic73.png': 75,  // Snow
  'pic74.png': 77,  // Snow grains
  'pic80.png': 80,  // Showers
  'pic81.png': 81,  // Showers
  'pic82.png': 82,  // Heavy showers
  'pic83.png': 80,  // Showers
  'pic84.png': 82,  // Heavy showers
  'pic91.png': 95,  // Thunderstorm
  'pic92.png': 96,  // Thunderstorm with hail
};

export function getHkoWeatherIcon(iconName: string): number {
  if (!iconName) return 3; // default cloudy
  const lower = iconName.toLowerCase();
  for (const [key, code] of Object.entries(HKO_ICON_MAP)) {
    if (lower.includes(key.replace('.png', '')) || lower === key) return code;
  }
  return 3;
}

// PSR (Probability of Significant Rain) to percentage
export function psrToPercent(psr: string): number {
  const map: Record<string, number> = {
    'High': 80,
    'Medium High': 60,
    'Medium': 50,
    'Medium Low': 30,
    'Low': 10,
  };
  return map[psr] || 10;
}

// HKO weather icons mapping for display
export function getHkoIconEmoji(iconName: string): string {
  const map: Record<string, string> = {
    'pic50.png': '☀️',
    'pic51.png': '🌤️',
    'pic52.png': '⛅',
    'pic53.png': '☁️',
    'pic54.png': '☁️',
    'pic60.png': '🌦️',
    'pic61.png': '🌦️',
    'pic62.png': '🌧️',
    'pic63.png': '🌧️',
    'pic64.png': '🌧️',
    'pic65.png': '🌦️',
    'pic70.png': '🌨️',
    'pic71.png': '🌨️',
    'pic72.png': '❄️',
    'pic73.png': '❄️',
    'pic74.png': '❄️',
    'pic80.png': '🌦️',
    'pic81.png': '🌧️',
    'pic82.png': '🌧️',
    'pic83.png': '🌦️',
    'pic84.png': '🌧️',
    'pic91.png': '⛈️',
    'pic92.png': '⛈️',
  };
  for (const [key, emoji] of Object.entries(map)) {
    if (iconName.toLowerCase().includes(key.replace('.png', '')) || iconName === key) return emoji;
  }
  return '🌤️';
}

export function getHkoWeatherDesc(iconName: string): string {
  const map: Record<string, string> = {
    'pic50.png': '晴天',
    'pic51.png': '大致晴朗',
    'pic52.png': '多云',
    'pic53.png': '多云',
    'pic54.png': '阴天',
    'pic60.png': '有雨',
    'pic61.png': '小雨',
    'pic62.png': '雨',
    'pic63.png': '大雨',
    'pic64.png': '暴雨',
    'pic65.png': '骤雨',
    'pic70.png': '雪',
    'pic71.png': '小雪',
    'pic72.png': '大雪',
    'pic73.png': '雪',
    'pic74.png': '雪粒',
    'pic80.png': '骤雨',
    'pic81.png': '骤雨',
    'pic82.png': '大骤雨',
    'pic83.png': '骤雨',
    'pic84.png': '大骤雨',
    'pic91.png': '雷暴',
    'pic92.png': '雷暴伴冰雹',
  };
  for (const [key, desc] of Object.entries(map)) {
    if (iconName.toLowerCase().includes(key.replace('.png', '')) || iconName === key) return desc;
  }
  return '多云';
}

// WMO Weather Code mappings (kept for compatibility)
export const WMO_CODES: Record<number, string> = {
  0: '晴天', 1: '大致晴朗', 2: '多云', 3: '阴天',
  45: '雾', 48: '雾凇',
  51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
  80: '小阵雨', 81: '中阵雨', 82: '大阵雨',
  85: '小阵雪', 86: '大阵雪',
  95: '雷暴', 96: '雷暴伴冰雹', 99: '雷暴伴大冰雹',
};

export const WMO_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export function getWindDirection(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return dirs[Math.round(deg / 45) % 8];
}

export function getUVLevel(index: number): string {
  if (index <= 2) return '低';
  if (index <= 5) return '中等';
  if (index <= 7) return '高';
  if (index <= 10) return '很高';
  return '极高';
}
