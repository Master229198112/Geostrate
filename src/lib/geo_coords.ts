// Geo-coordinates for countries, regions, and organizations
// Used to place actor markers on the world map

export const GEO_COORDS: Record<string, [number, number]> = {
  // ===== COUNTRIES =====
  'India':            [20.5937,  78.9629],
  'Pakistan':         [30.3753,  69.3451],
  'China':            [35.8617, 104.1954],
  'United States':    [37.0902, -95.7129],
  'USA':              [37.0902, -95.7129],
  'US':               [37.0902, -95.7129],
  'Russia':           [61.5240, 105.3188],
  'United Kingdom':   [55.3781,  -3.4360],
  'UK':               [55.3781,  -3.4360],
  'France':           [46.6034,   1.8883],
  'Germany':          [51.1657,  10.4515],
  'Japan':            [36.2048, 138.2529],
  'South Korea':      [35.9078, 127.7669],
  'North Korea':      [40.3399, 127.5101],
  'Iran':             [32.4279,  53.6880],
  'Iraq':             [33.2232,  43.6793],
  'Syria':            [34.8021,  38.9968],
  'Israel':           [31.0461,  34.8516],
  'Palestine':        [31.9522,  35.2332],
  'Saudi Arabia':     [23.8859,  45.0792],
  'Turkey':           [38.9637,  35.2433],
  'Egypt':            [26.8206,  30.8025],
  'Brazil':           [-14.235, -51.9253],
  'South Africa':     [-30.5595, 22.9375],
  'Australia':        [-25.2744, 133.7751],
  'Canada':           [56.1304, -106.3468],
  'Mexico':           [23.6345, -102.5528],
  'Ukraine':          [48.3794,  31.1656],
  'Poland':           [51.9194,  19.1451],
  'Italy':            [41.8719,  12.5674],
  'Spain':            [40.4637,  -3.7492],
  'Netherlands':      [52.1326,   5.2913],
  'Belgium':          [50.5039,   4.4699],
  'Sweden':           [60.1282,  18.6435],
  'Norway':           [60.4720,   8.4689],
  'Finland':          [61.9241,  25.7482],
  'Indonesia':        [-0.7893, 113.9213],
  'Malaysia':         [4.2105,  101.9758],
  'Philippines':      [12.8797, 121.7740],
  'Vietnam':          [14.0583, 108.2772],
  'Thailand':         [15.8700, 100.9925],
  'Myanmar':          [21.9162,  95.9560],
  'Afghanistan':      [33.9391,  67.7100],
  'Taiwan':           [23.6978, 120.9605],
  'Singapore':        [1.3521,  103.8198],
  'Nigeria':          [9.0820,   8.6753],
  'Ethiopia':         [9.1450,  40.4897],
  'Kenya':            [-0.0236,  37.9062],
  'Argentina':        [-38.4161,-63.6167],
  'Colombia':         [4.5709,  -74.2973],
  'Venezuela':        [6.4238,  -66.5897],
  'Cuba':             [21.5218, -77.7812],
  'Libya':            [26.3351,  17.2283],
  'Algeria':          [28.0339,   1.6596],
  'Morocco':          [31.7917,  -7.0926],
  'Sudan':            [12.8628,  30.2176],
  'Yemen':            [15.5527,  48.5164],
  'Oman':             [21.4735,  55.9754],
  'Qatar':            [25.3548,  51.1839],
  'UAE':              [23.4241,  53.8478],
  'Kuwait':           [29.3117,  47.4818],
  'Bahrain':          [26.0667,  50.5577],
  'Jordan':           [30.5852,  36.2384],
  'Lebanon':          [33.8547,  35.8623],
  'Bangladesh':       [23.6850,  90.3563],
  'Sri Lanka':        [7.8731,   80.7718],
  'Nepal':            [28.3949,  84.1240],
  'Greece':           [39.0742,  21.8243],
  'Romania':          [45.9432,  24.9668],
  'Hungary':          [47.1625,  19.5033],
  'Czech Republic':   [49.8175,  15.4730],
  'Austria':          [47.5162,  14.5501],
  'Switzerland':      [46.8182,   8.2275],
  'Portugal':         [39.3999,  -8.2245],
  'Denmark':          [56.2639,   9.5018],

  // ===== ORGANIZATIONS & MULTILATERALS =====
  'United Nations':   [40.7489, -73.9680],
  'UN':               [40.7489, -73.9680],
  'NATO':             [50.8770,   4.3220],
  'European Union':   [50.8503,   4.3517],
  'EU':               [50.8503,   4.3517],
  'ASEAN':            [6.1170,  106.8290],
  'African Union':    [9.0054,   38.7636],
  'AU':               [9.0054,   38.7636],
  'Arab League':      [30.0444,  31.2357],
  'BRICS':            [-15.7942,-47.8825],
  'G7':               [48.8566,   2.3522],
  'G20':              [48.8566,   2.3522],
  'IMF':              [38.8951, -77.0364],
  'World Bank':       [38.8951, -77.0364],
  'WHO':              [46.2276,   6.1382],
  'WTO':              [46.2100,   6.1419],
  'OPEC':             [48.2350,  16.3256],
  'SCO':              [39.9042, 116.4074],
  'IAEA':             [48.2350,  16.3256],
};

// Region center coordinates (used for part6 Geographic Impact heatmap)
export const REGION_COORDS: Record<string, [number, number]> = {
  'North America':   [45.0, -100.0],
  'Europe':          [50.0,  15.0],
  'Middle East':     [28.0,  45.0],
  'Asia-Pacific':    [20.0, 110.0],
  'Asia':            [35.0,  95.0],
  'Africa':          [5.0,   22.0],
  'Global South':    [-15.0,  25.0],
  'South America':   [-15.0, -60.0],
  'Latin America':   [-10.0, -65.0],
  'Central Asia':    [42.0,  65.0],
  'South Asia':      [22.0,  78.0],
  'Southeast Asia':  [5.0,  110.0],
  'East Asia':       [35.0, 120.0],
  'Oceania':         [-25.0, 140.0],
  'Eastern Europe':  [52.0,  30.0],
  'Western Europe':  [48.0,   5.0],
  'Sub-Saharan Africa': [-5.0, 25.0],
  'Caribbean':       [18.0, -72.0],
};

// Fuzzy match: try common aliases and partial matches  
export function getCoords(actorName: string): [number, number] | null {
  // Direct match
  const direct = GEO_COORDS[actorName];
  if (direct) return direct;

  // Case-insensitive match
  const lower = actorName.toLowerCase();
  for (const [key, val] of Object.entries(GEO_COORDS)) {
    if (key.toLowerCase() === lower) return val;
  }

  // Partial match (e.g., "People's Republic of China" → "China")
  for (const [key, val] of Object.entries(GEO_COORDS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }

  return null;
}

// Region coordinate lookup with fuzzy match
export function getRegionCoords(regionName: string): [number, number] | null {
  const direct = REGION_COORDS[regionName];
  if (direct) return direct;

  const lower = regionName.toLowerCase();
  for (const [key, val] of Object.entries(REGION_COORDS)) {
    if (key.toLowerCase() === lower) return val;
  }
  for (const [key, val] of Object.entries(REGION_COORDS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }
  // Fallback: try the country coords
  return getCoords(regionName);
}

/**
 * Deconflict overlapping coordinate points.
 * Points within `threshold` degrees of each other are spread in a circle.
 * @param items  Array of objects that have lat/lng (or coords)
 * @param getLatLng  Accessor returning [lat, lng] for each item
 * @param setLatLng  Setter to update the lat/lng on the item
 * @param offsetDeg  How far to offset overlapping points (in degrees)
 */
export function deconflictCoords<T>(
  items: T[],
  getLatLng: (item: T) => [number, number],
  setLatLng: (item: T, lat: number, lng: number) => T,
  offsetDeg: number = 3
): T[] {
  // Group by rounded position
  const threshold = 1.5; // degrees within which points are "same location"
  const groups = new Map<string, { indices: number[]; center: [number, number] }>();

  items.forEach((item, i) => {
    const [lat, lng] = getLatLng(item);
    // Round to find cluster key
    const key = `${Math.round(lat / threshold) * threshold},${Math.round(lng / threshold) * threshold}`;
    if (!groups.has(key)) {
      groups.set(key, { indices: [], center: [lat, lng] });
    }
    groups.get(key)!.indices.push(i);
  });

  const result = [...items];
  for (const group of groups.values()) {
    const n = group.indices.length;
    if (n <= 1) continue; // No overlap, keep original

    const [cLat, cLng] = group.center;
    group.indices.forEach((idx, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2; // Start from top
      const newLat = cLat + offsetDeg * Math.sin(angle);
      const newLng = cLng + offsetDeg * Math.cos(angle);
      result[idx] = setLatLng(result[idx], newLat, newLng);
    });
  }

  return result;
}
