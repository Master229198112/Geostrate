const CACHE_KEY = 'geostrate_analysis_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 10;

interface CacheEntry {
  problemHash: string;
  data: any;
  timestamp: number;
}

function hashProblem(problem: string): string {
  // Simple hash: use first 100 chars + length for quick lookup
  const normalized = problem.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `h_${hash}_${normalized.length}`;
}

function getCache(): CacheEntry[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CacheEntry[];
  } catch {
    return [];
  }
}

function saveCache(entries: CacheEntry[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage might be full
  }
}

export function getCachedResult(problem: string): any | null {
  const hash = hashProblem(problem);
  const now = Date.now();
  const entries = getCache().filter(e => now - e.timestamp < CACHE_TTL_MS);
  const match = entries.find(e => e.problemHash === hash);
  return match ? match.data : null;
}

export function setCachedResult(problem: string, data: any) {
  const hash = hashProblem(problem);
  let entries = getCache().filter(e => Date.now() - e.timestamp < CACHE_TTL_MS);
  // Remove existing entry for same hash
  entries = entries.filter(e => e.problemHash !== hash);
  // Add new entry
  entries.unshift({ problemHash: hash, data, timestamp: Date.now() });
  // Limit to MAX_ENTRIES
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(0, MAX_ENTRIES);
  }
  saveCache(entries);
}
