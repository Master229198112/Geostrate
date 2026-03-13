import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { getHistoryEntries, clearHistory, HistoryEntry } from '../lib/history';
import { useUser } from '../context/UserContext';

interface Props {
  onSelect: (problem: string) => void;
}

export default function AnalysisHistory({ onSelect }: Props) {
  const { user, token } = useUser();
  const [entries, setEntries] = React.useState<HistoryEntry[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  // Load entries on mount and whenever the panel is toggled
  React.useEffect(() => {
    async function loadHistory() {
      if (user && token) {
        try {
          const res = await fetch('/api/history', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Map the DB schema to match the local HistoryEntry interface
            const mappedEntries = data.history.map((h: any) => ({
              id: h._id,
              problem: h.problem,
              timestamp: new Date(h.timestamp).getTime(),
              riskIndicator: h.riskScore,
              psiScore: h.psiScore
            }));
            setEntries(mappedEntries);
            return;
          }
        } catch (err) {
          console.error('Failed to load DB history', err);
        }
      }
      // Fallback to local storage for guests or if fetch defaults
      setEntries(getHistoryEntries());
    }
    loadHistory();
  }, [isOpen, user, token]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
          Analysis History ({entries.length})
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          {entries.length === 0 ? (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 p-3 text-center font-mono">No analysis history yet</p>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => { onSelect(entry.problem); setIsOpen(false); }}
                    className="w-full text-left p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                        {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400">Risk {(entry.riskIndicator * 100).toFixed(0)}%</span>
                        <span className={`text-[9px] font-mono px-1 rounded-sm ${entry.psiScore >= 0.387 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          Ψ {entry.psiScore.toFixed(3)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{entry.problem}</p>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  onClick={() => { clearHistory(); setEntries([]); }}
                  className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-1 uppercase tracking-widest font-bold"
                  title={user ? "Clears local history only. Server history is permanent." : "Clear history"}
                >
                  <Trash2 className="w-3 h-3" /> Clear Local History
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
