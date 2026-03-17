import React from 'react';
import { History } from 'lucide-react';
import type { TimelineEvent } from '../types';

interface Props {
  events: TimelineEvent[];
}

// Correction 7: Fixed 5-period timeline buckets
const TIMELINE_BUCKETS = [
  { label: 'Current', key: 'current' },
  { label: 'Next 3 Months', key: '3m' },
  { label: 'Next 6–12 Months', key: '6-12m' },
  { label: 'Next 12–24 Months', key: '12-24m' },
  { label: 'Next 24–36 Months', key: '24-36m' },
];

function mapEventsToBuckets(events: TimelineEvent[]): Record<string, string[]> {
  const buckets: Record<string, string[]> = {
    current: [],
    '3m': [],
    '6-12m': [],
    '12-24m': [],
    '24-36m': [],
  };

  events.forEach((evt, i) => {
    const d = (evt.date || '').toLowerCase();

    if (
      d.includes('current') || d.includes('now') || d.includes('today') ||
      d.includes('immediate') || d.includes('ongoing') || i === 0
    ) {
      buckets.current.push(evt.event);
    } else if (
      d.includes('1 month') || d.includes('2 month') || d.includes('3 month') ||
      d.includes('q1') || d.includes('short') || d.includes('1-3') ||
      d.includes('next 3') || i === 1
    ) {
      buckets['3m'].push(evt.event);
    } else if (
      d.includes('6 month') || d.includes('6-12') || d.includes('mid') ||
      d.includes('q2') || d.includes('q3') || d.includes('next 6') || i === 2
    ) {
      buckets['6-12m'].push(evt.event);
    } else if (
      d.includes('12') || d.includes('1 year') || d.includes('12-24') ||
      d.includes('long') || d.includes('next 12') || d.includes('next year') || i === 3
    ) {
      buckets['12-24m'].push(evt.event);
    } else {
      buckets['24-36m'].push(evt.event);
    }
  });

  if (buckets.current.length === 0 && events.length > 0) {
    const keys = Object.keys(buckets);
    events.forEach((evt, i) => {
      const bKey = keys[Math.min(i, keys.length - 1)];
      if (bKey && !Object.values(buckets).flat().includes(evt.event)) {
        buckets[bKey].push(evt.event);
      }
    });
  }

  return buckets;
}

const BUCKET_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
];

const BUCKET_BORDER_COLORS = [
  'border-blue-500',
  'border-indigo-500',
  'border-violet-500',
  'border-purple-500',
  'border-fuchsia-500',
];

export default function EscalationTimeline({ events }: Props) {
  const buckets = mapEventsToBuckets(events);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-5 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        Escalation Timeline
      </h2>

      {/* Vertical Timeline */}
      <div className="relative ml-4">
        {/* Vertical line */}
        <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-slate-200 dark:bg-slate-600" />

        <div className="space-y-6">
          {TIMELINE_BUCKETS.map((bucket, i) => {
            const items = buckets[bucket.key] || [];
            const isLast = i === TIMELINE_BUCKETS.length - 1;
            return (
              <div key={bucket.key} className="relative flex items-start gap-4">
                {/* Dot */}
                <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${items.length > 0 ? BUCKET_COLORS[i] : 'bg-slate-300 dark:bg-slate-600'}`}>
                  {i + 1}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-${isLast ? '0' : '2'}`}>
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">
                    {bucket.label}
                  </div>
                  {items.length > 0 ? (
                    <div className={`border-l-2 ${BUCKET_BORDER_COLORS[i]} pl-3 space-y-1`}>
                      {items.map((item, j) => (
                        <p key={j} className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 italic">No events in this period</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
