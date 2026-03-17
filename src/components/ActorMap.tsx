import React, { useMemo, useState, lazy, Suspense } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, Circle } from 'react-leaflet';
import type { AnalysisResponse } from '../types';
import { getCoords, getRegionCoords, deconflictCoords } from '../lib/geo_coords';
import 'leaflet/dist/leaflet.css';

// Lazy load the 3D globe (heavy Three.js bundle)
const ActorGlobe = lazy(() => import('./ActorGlobe'));

interface Props {
  results: AnalysisResponse;
}

// Color by actor type
const TYPE_COLORS: Record<string, string> = {
  'State':        '#ef4444',
  'Military':     '#f59e0b',
  'Financial':    '#3b82f6',
  'Tech':         '#10b981',
  'Proxy':        '#a855f7',
  'Multilateral': '#6b7280',
};

// Alliance line styles
const ALIGNMENT_STYLES: Record<string, { color: string; dash: string; opacity: number }> = {
  'Opposed': { color: '#ef4444', dash: '6 4', opacity: 0.5 },
  'Aligned': { color: '#22c55e', dash: '', opacity: 0.4 },
  'Neutral': { color: '#64748b', dash: '3 6', opacity: 0.25 },
};

function getColor(type: string): string {
  return TYPE_COLORS[type] || '#94a3b8';
}

// Risk level color
function getRiskColor(risk: number): string {
  if (risk >= 0.7) return '#ef4444';
  if (risk >= 0.3) return '#f59e0b';
  return '#22c55e';
}

function getRiskLabel(risk: number): string {
  if (risk >= 0.7) return 'HIGH';
  if (risk >= 0.3) return 'MODERATE';
  return 'LOW';
}

// Shock index to color (for region heatmap)
function shockColor(idx: number): string {
  if (idx >= 0.7) return '#ef4444';
  if (idx >= 0.4) return '#f59e0b';
  return '#22c55e';
}

export default function ActorMap({ results }: Props) {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [showSectors, setShowSectors] = useState(true);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const actors = results.parsedData?.part2_ActorArchitecture?.actors || [];
  const alignments = results.parsedData?.part1_SituationAssessment?.strategicAlignment || [];
  const regions = results.parsedData?.part6_GeographicImpact?.regions || [];
  const sectors = results.parsedData?.part5_SectorDecision?.sectors || [];
  const stressData = results.parsedData?.part7_OrderEffects?.institutionalStress || [];
  const scenarios = results.parsedData?.part4_Scenarios || [];
  const cipf = results.cipf;
  const timeline = results.parsedData?.executiveSummary?.escalationTimeline || [];
  const globalRisk = results.parsedData?.executiveSummary?.globalRiskIndicator || 0;

  // Map actors to geo-coordinates (deconflicted so overlaps spread apart)
  const geoActors = useMemo(() => {
    const raw = actors
      .map(actor => {
        const coords = getCoords(actor.name);
        return coords ? { ...actor, coords } : null;
      })
      .filter(Boolean) as (typeof actors[0] & { coords: [number, number] })[];
    return deconflictCoords(
      raw,
      item => item.coords,
      (item, lat, lng) => ({ ...item, coords: [lat, lng] as [number, number] }),
      3
    );
  }, [actors]);

  // Build ALL alignment connection lines (Opposed, Aligned, Neutral)
  const connections = useMemo(() => {
    const lines: { from: [number, number]; to: [number, number]; alignment: string }[] = [];
    const seenPairs = new Set<string>();

    // Group actors by alignment type
    const alignmentGroups: Record<string, string[]> = {};
    for (const a of alignments) {
      if (!alignmentGroups[a.alignment]) alignmentGroups[a.alignment] = [];
      alignmentGroups[a.alignment].push(a.actor);
    }

    // For each group, create connections between all pairs
    for (const [alignment, group] of Object.entries(alignmentGroups)) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const key = [group[i], group[j]].sort().join('|');
          if (!seenPairs.has(key)) {
            seenPairs.add(key);
            const c1 = getCoords(group[i]);
            const c2 = getCoords(group[j]);
            if (c1 && c2) {
              lines.push({ from: c1, to: c2, alignment });
            }
          }
        }
      }
    }
    return lines;
  }, [alignments]);

  // Region heatmap data
  const geoRegions = useMemo(() => {
    return regions
      .map(r => {
        const coords = getRegionCoords(r.name);
        return coords ? { ...r, coords } : null;
      })
      .filter(Boolean) as (typeof regions[0] & { coords: [number, number] })[];
  }, [regions]);

  // Institutional stress markers (deconflicted)
  const geoStress = useMemo(() => {
    const raw = stressData
      .map(s => {
        const coords = getCoords(s.institution);
        return coords ? { ...s, coords } : null;
      })
      .filter(Boolean) as (typeof stressData[0] & { coords: [number, number] })[];
    return deconflictCoords(
      raw,
      item => item.coords,
      (item, lat, lng) => ({ ...item, coords: [lat, lng] as [number, number] }),
      3
    );
  }, [stressData]);

  if (geoActors.length === 0) return null;

  const riskColor = getRiskColor(globalRisk);
  const riskLabel = getRiskLabel(globalRisk);

  return (
    <div className="w-full rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Actor Intelligence Map</span>
          </div>

          {/* Global Risk Indicator */}
          {globalRisk > 0 && (
            <div className="flex items-center gap-2 ml-2 px-2 py-0.5 rounded-sm border" style={{ borderColor: riskColor + '40', background: riskColor + '10' }}>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">Risk</span>
              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${globalRisk * 100}%`, background: riskColor }} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: riskColor }}>
                {riskLabel} {Math.round(globalRisk * 100)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Type legend */}
          <div className="hidden sm:flex items-center gap-3">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">{type}</span>
              </div>
            ))}
          </div>

          {/* Alliance legend */}
          <div className="hidden md:flex items-center gap-2 border-l border-slate-700 pl-3">
            <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-emerald-500" /><span className="text-[8px] text-slate-500">Aligned</span></div>
            <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '1px dashed #ef4444' }} /><span className="text-[8px] text-slate-500">Opposed</span></div>
            <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-slate-500 opacity-50" /><span className="text-[8px] text-slate-500">Neutral</span></div>
          </div>

          {/* 2D / 3D Toggle */}
          <div className="flex items-center bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                viewMode === '2D'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                viewMode === '3D'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D
            </button>
          </div>
        </div>
      </div>

      {/* Map + Overlays wrapper */}
      <div className="relative">
        {/* Map View */}
        {viewMode === '2D' ? (
          <MapContainer
            center={[20, 30]}
            zoom={2}
            minZoom={2}
            maxZoom={6}
            scrollWheelZoom={true}
            style={{ height: '420px', width: '100%', background: '#0f172a' }}
            attributionControl={false}
          >
            {/* Dark Matter Tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Region Heatmap — large transparent circles */}
            {geoRegions.map((region, i) => {
              const clr = shockColor(region.economicShockIndex);
              return (
                <Circle
                  key={`region-${i}`}
                  center={region.coords}
                  radius={1200000}
                  pathOptions={{
                    color: clr,
                    fillColor: clr,
                    fillOpacity: 0.08,
                    weight: 1,
                    opacity: 0.3,
                  }}
                >
                  <Tooltip direction="top" opacity={1} className="actor-tooltip">
                    <div style={{ minWidth: 200, padding: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 12, color: '#f1f5f9' }}>{region.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: clr, border: `1px solid ${clr}`, padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase' }}>
                          {region.economicShockIndex >= 0.7 ? 'HIGH IMPACT' : region.economicShockIndex >= 0.4 ? 'MODERATE' : 'LOW IMPACT'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: '#94a3b8', width: 90 }}>Economic Shock</span>
                          <div style={{ flex: 1, height: 4, background: '#1e293b', overflow: 'hidden' }}>
                            <div style={{ width: `${region.economicShockIndex * 100}%`, height: '100%', background: clr }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#e2e8f0', fontFamily: 'monospace', width: 28, textAlign: 'right' }}>{Math.round(region.economicShockIndex * 100)}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: '#94a3b8', width: 90 }}>Trade Depend.</span>
                          <div style={{ flex: 1, height: 4, background: '#1e293b', overflow: 'hidden' }}>
                            <div style={{ width: `${region.tradeDependency * 100}%`, height: '100%', background: '#3b82f6' }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#e2e8f0', fontFamily: 'monospace', width: 28, textAlign: 'right' }}>{Math.round(region.tradeDependency * 100)}%</span>
                        </div>
                      </div>
                      {region.strategicImpact && (
                        <div style={{ marginTop: 6, borderTop: '1px solid #334155', paddingTop: 4 }}>
                          {region.economicShockIndex >= 0.7 && (
                            <div style={{ marginBottom: 4, background: '#7f1d1d20', border: '1px solid #ef444440', borderRadius: 2, padding: '3px 6px' }}>
                              <span style={{ fontSize: 8, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚠ High Impact Justification</span>
                            </div>
                          )}
                          <p style={{ fontSize: 10, color: region.economicShockIndex >= 0.7 ? '#fca5a5' : '#94a3b8', lineHeight: 1.4, margin: 0, fontWeight: region.economicShockIndex >= 0.7 ? 600 : 400 }}>{region.strategicImpact}</p>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </Circle>
              );
            })}

            {/* Institutional Stress pulsing rings */}
            {geoStress.map((inst, i) => {
              const stressClr = inst.stressLevel >= 0.7 ? '#ef4444' : inst.stressLevel >= 0.4 ? '#f59e0b' : '#22c55e';
              return (
                <CircleMarker
                  key={`stress-${i}`}
                  center={inst.coords}
                  radius={8 + inst.stressLevel * 10}
                  pathOptions={{
                    color: stressClr,
                    fillColor: stressClr,
                    fillOpacity: 0.15,
                    weight: 2,
                    opacity: 0.7,
                    className: 'stress-pulse',
                  }}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={1} className="actor-tooltip">
                    <div style={{ minWidth: 160, padding: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 12, color: '#f1f5f9' }}>{inst.institution}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: stressClr, border: `1px solid ${stressClr}`, padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase' }}>STRESS</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8', width: 70 }}>Stress Level</span>
                        <div style={{ flex: 1, height: 5, background: '#1e293b', overflow: 'hidden' }}>
                          <div style={{ width: `${inst.stressLevel * 100}%`, height: '100%', background: stressClr }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#e2e8f0', fontFamily: 'monospace', width: 28, textAlign: 'right' }}>{Math.round(inst.stressLevel * 100)}%</span>
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}

            {/* Alliance / Opposition lines */}
            {connections.map((conn, i) => {
              const style = ALIGNMENT_STYLES[conn.alignment] || ALIGNMENT_STYLES['Neutral'];
              return (
                <Polyline
                  key={`conn-${i}`}
                  positions={[conn.from, conn.to]}
                  pathOptions={{
                    color: style.color,
                    weight: conn.alignment === 'Aligned' ? 2 : 1,
                    opacity: style.opacity,
                    dashArray: style.dash || undefined,
                  }}
                />
              );
            })}

            {/* Actor markers */}
            {geoActors.map((actor, i) => {
              const radius = 6 + (actor.influence || 0.5) * 12;
              const color = getColor(actor.type);

              return (
                <CircleMarker
                  key={`actor-${i}`}
                  center={actor.coords}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.35,
                    weight: 2,
                    opacity: 0.9,
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -radius]}
                    opacity={1}
                    className="actor-tooltip"
                  >
                    <div style={{ minWidth: 220, padding: 0 }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: '#f1f5f9', letterSpacing: '0.05em' }}>
                          {actor.name}
                        </span>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: color,
                          border: `1px solid ${color}`,
                          padding: '1px 6px',
                          borderRadius: 2,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}>
                          {actor.type}
                        </span>
                      </div>

                      {/* Stats bars */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                          { label: 'Capability', value: actor.capability },
                          { label: 'Influence', value: actor.influence },
                          { label: 'Stability', value: actor.stability },
                        ].map(stat => (
                          <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, color: '#94a3b8', width: 64, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {stat.label}
                            </span>
                            <div style={{ flex: 1, height: 5, backgroundColor: '#1e293b', borderRadius: 0, overflow: 'hidden' }}>
                              <div style={{
                                width: `${(stat.value || 0) * 100}%`,
                                height: '100%',
                                backgroundColor: (stat.value || 0) >= 0.7 ? '#22c55e' : (stat.value || 0) >= 0.4 ? '#f59e0b' : '#ef4444',
                                transition: 'width 0.3s',
                              }} />
                            </div>
                            <span style={{ fontSize: 10, color: '#e2e8f0', fontFamily: 'monospace', width: 28, textAlign: 'right' }}>
                              {Math.round((stat.value || 0) * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Intentions */}
                      {actor.intentions && (
                        <div style={{ marginTop: 8, borderTop: '1px solid #334155', paddingTop: 6 }}>
                          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                            {actor.intentions}
                          </p>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        ) : (
          /* 3D Globe View */
          <Suspense fallback={
            <div className="flex items-center justify-center h-[420px] bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-xs text-slate-400 uppercase tracking-widest">Loading 3D Globe...</span>
              </div>
            </div>
          }>
            <ActorGlobe results={results} />
          </Suspense>
        )}

        {/* Floating Sector Impact Panel */}
        {sectors.length > 0 && (
          <div
            className="absolute bottom-3 left-3 z-[1000]"
            style={{ maxHeight: 380, width: showSectors ? 220 : 'auto' }}
          >
            <button
              onClick={() => setShowSectors(!showSectors)}
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-800/90 border border-slate-700 text-slate-300 rounded-sm hover:bg-slate-700/90 transition-colors mb-1 backdrop-blur-sm"
            >
              {showSectors ? '✕ Sectors' : '◈ Sectors'}
            </button>
            {showSectors && (
              <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-sm p-2.5 overflow-y-auto custom-scrollbar" style={{ maxHeight: 340 }}>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sector Impact</div>
                <div className="space-y-2">
                  {sectors.map((s, i) => {
                    const vulnClr = s.shockVulnerability >= 0.7 ? '#ef4444' : s.shockVulnerability >= 0.4 ? '#f59e0b' : '#22c55e';
                    const oppClr = s.opportunityScore >= 0.6 ? '#22c55e' : s.opportunityScore >= 0.3 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={i} className="border-b border-slate-800 pb-1.5">
                        <div className="text-[10px] font-bold text-slate-200 mb-1">{s.name}</div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8px] text-slate-500 w-[50px] shrink-0">VULN</span>
                          <div className="flex-1 h-1 bg-slate-800 overflow-hidden rounded-sm">
                            <div style={{ width: `${s.shockVulnerability * 100}%`, height: '100%', background: vulnClr }} />
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono w-6 text-right">{Math.round(s.shockVulnerability * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8px] text-slate-500 w-[50px] shrink-0">OPP</span>
                          <div className="flex-1 h-1 bg-slate-800 overflow-hidden rounded-sm">
                            <div style={{ width: `${s.opportunityScore * 100}%`, height: '100%', background: oppClr }} />
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono w-6 text-right">{Math.round(s.opportunityScore * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] text-slate-500 w-[50px] shrink-0">RESIL</span>
                          <div className="flex-1 h-1 bg-slate-800 overflow-hidden rounded-sm">
                            <div style={{ width: `${s.resilienceScore * 100}%`, height: '100%', background: '#3b82f6' }} />
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono w-6 text-right">{Math.round(s.resilienceScore * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CIPF Coordination Score Overlay — bottom right */}
        {cipf && cipf.Psi_final !== undefined && (
          <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-sm p-3" style={{ width: 180 }}>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">CIPF Score</div>
            {/* Psi_final gauge */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-10 h-10">
                <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={cipf.Psi_final >= 0.7 ? '#22c55e' : cipf.Psi_final >= 0.4 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${cipf.Psi_final * 94.2} 94.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                  {Math.round(cipf.Psi_final * 100)}%
                </span>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-200">Ψ Final</div>
                <div className="text-[8px] text-slate-500">Coordination Probability</div>
              </div>
            </div>
            {/* Sub-scores */}
            <div className="space-y-1">
              {[
                { label: 'SCM', value: cipf.SCM, desc: 'Structural' },
                { label: 'PCE', value: cipf.PCE, desc: 'Physical' },
                { label: 'PCC', value: cipf.PCC, desc: 'Cultural' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="text-[8px] text-slate-500 w-7 shrink-0 font-bold">{s.label}</span>
                  <div className="flex-1 h-1 bg-slate-800 overflow-hidden rounded-sm">
                    <div style={{ width: `${(s.value as number) * 100}%`, height: '100%', background: '#6366f1' }} />
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono w-6 text-right">{Math.round((s.value as number) * 100)}%</span>
                </div>
              ))}
            </div>
            {/* Binding constraint */}
            {cipf.bindingConstraint && (
              <div className="mt-2 pt-1.5 border-t border-slate-800">
                <span className="text-[8px] text-slate-500">Binding: </span>
                <span className="text-[9px] font-bold text-amber-400">{cipf.bindingConstraint}</span>
              </div>
            )}
          </div>
        )}

        {/* Scenario Selector — floating top bar */}
        {scenarios.length > 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-sm px-1.5 py-1">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest mr-1 hidden sm:inline">Scenarios</span>
            {scenarios.map((sc, i) => {
              const probClr = sc.probability >= 0.5 ? '#22c55e' : sc.probability >= 0.25 ? '#f59e0b' : '#ef4444';
              return (
                <button
                  key={i}
                  onClick={() => setActiveScenario(activeScenario === i ? null : i)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all border ${
                    activeScenario === i
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                  title={sc.description}
                >
                  S{i + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Scenario Details Card — appears when a scenario is selected */}
        {activeScenario !== null && scenarios[activeScenario] && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-sm p-3" style={{ width: 320, maxWidth: '90vw' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-200">{scenarios[activeScenario].name}</span>
              <button onClick={() => setActiveScenario(null)} className="text-[10px] text-slate-500 hover:text-slate-300">✕</button>
            </div>
            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{scenarios[activeScenario].description}</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="text-[8px] text-slate-500 uppercase mb-0.5">Probability</div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                    <div style={{ width: `${scenarios[activeScenario].probability * 100}%`, height: '100%', background: scenarios[activeScenario].probability >= 0.5 ? '#22c55e' : '#f59e0b' }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 font-mono">{Math.round(scenarios[activeScenario].probability * 100)}%</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[8px] text-slate-500 uppercase mb-0.5">Econ Shock</div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                    <div style={{ width: `${scenarios[activeScenario].economicShock * 100}%`, height: '100%', background: scenarios[activeScenario].economicShock >= 0.5 ? '#ef4444' : '#f59e0b' }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 font-mono">{Math.round(scenarios[activeScenario].economicShock * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="mt-1.5 text-[9px] text-slate-500">Recovery: <span className="text-slate-300 font-bold">{scenarios[activeScenario].recoveryTimeline}</span></div>
          </div>
        )}
      </div>

      {/* Escalation Timeline — below the map */}
      {timeline.length > 0 && (
        <div className="bg-slate-900 border-t border-slate-700 px-4 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Escalation Timeline</span>
          </div>
          <div className="relative">
            {/* Timeline track */}
            <div className="h-0.5 bg-slate-700 rounded-full w-full absolute top-[5px]" />
            <div className="flex justify-between relative">
              {timeline.map((evt, i) => (
                <div key={i} className="flex flex-col items-center group" style={{ flex: 1 }}>
                  {/* Dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full border-2 border-slate-600 bg-slate-800 group-hover:border-amber-400 group-hover:bg-amber-400/20 transition-colors cursor-pointer relative z-10"
                    title={`${evt.date}: ${evt.event}`}
                  />
                  {/* Label */}
                  <div className="mt-1.5 text-center">
                    <div className="text-[8px] font-bold text-slate-500 group-hover:text-amber-400 transition-colors">{evt.date}</div>
                    <div className="text-[7px] text-slate-600 group-hover:text-slate-400 transition-colors leading-tight max-w-[80px] truncate">{evt.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
