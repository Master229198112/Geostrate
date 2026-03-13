import React from 'react';
import { History } from 'lucide-react';
import type { TimelineEvent } from '../types';

interface Props {
  events: TimelineEvent[];
}

export default function EscalationTimeline({ events }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Escalation Timeline
      </h2>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-px before:bg-slate-200 dark:bg-slate-600">
        {events.map((evt, i) => (
          <div key={i} className="relative flex items-start gap-4 pl-6">
            <div className="absolute left-0 w-4 h-4 rounded-full border-2 border-white bg-blue-500 -translate-x-1/2 mt-0.5"></div>
            <div>
              <div className="text-[10px] font-mono text-blue-600 mb-0.5">{evt.date}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">{evt.event}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
