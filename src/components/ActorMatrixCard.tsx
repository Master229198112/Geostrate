import React from 'react';
import { Users } from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Cell, Label } from 'recharts';
import type { Actor } from '../types';

interface Props {
  actors: Actor[];
}

export default function ActorMatrixCard({ actors }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        Actor Power Matrix
      </h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 45, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis type="number" dataKey="capability" name="Capability" domain={[0, 1]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false}>
              <Label value="Actor Influence / Structural Power (Normalized 0–1)" position="bottom" offset={20} style={{ fill: '#64748B', fontSize: 11, fontWeight: 600, textAnchor: 'middle' }} />
            </XAxis>
            <YAxis type="number" dataKey="influence" name="Influence" domain={[0, 1]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false}>
              <Label
                content={({ viewBox }: any) => {
                  const cx = (viewBox?.x ?? 0) - 15;
                  const cy = (viewBox?.y ?? 0) + (viewBox?.height ?? 0) / 2;
                  return (
                    <text x={cx} y={cy} textAnchor="middle" transform={`rotate(-90, ${cx}, ${cy})`} style={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}>
                      <tspan x={cx} dy="-0.5em">Actor Strategic Alignment /</tspan>
                      <tspan x={cx} dy="1.1em">Commitment to Scenario (0–1)</tspan>
                    </text>
                  );
                }}
              />
            </YAxis>
            <ZAxis type="number" dataKey="stability" range={[50, 400]} name="Stability" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#1E293B', fontSize: '12px' }} />
            <Scatter name="Actors" data={actors} fill="#3B82F6" fillOpacity={0.6}>
              {actors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.type === 'State' ? '#3B82F6' : entry.type === 'Military' ? '#EF4444' : '#10B981'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] text-slate-500 uppercase">State</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[10px] text-slate-500 uppercase">Military</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-slate-500 uppercase">Other</span></div>
      </div>
    </div>
  );
}
