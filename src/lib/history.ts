const HISTORY_KEY = 'geostrate_analysis_history';
const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  problem: string;
  timestamp: number;
  riskIndicator: number;
  psiScore: number;
}

function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // localStorage may be full
  }
}

export function addHistoryEntry(problem: string, riskIndicator: number, psiScore: number) {
  const entries = getHistory();
  const entry: HistoryEntry = {
    id: `h_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    problem: problem.substring(0, 200), // Store truncated
    timestamp: Date.now(),
    riskIndicator,
    psiScore
  };
  entries.unshift(entry);
  if (entries.length > MAX_HISTORY) entries.length = MAX_HISTORY;
  saveHistory(entries);
}

export function getHistoryEntries(): HistoryEntry[] {
  return getHistory();
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
