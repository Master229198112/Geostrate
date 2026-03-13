import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import Globe from 'react-globe.gl';
import type { AnalysisResponse } from '../types';
import { getCoords, getRegionCoords, deconflictCoords } from '../lib/geo_coords';

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

function getColor(type: string): string {
  return TYPE_COLORS[type] || '#94a3b8';
}

interface GlobePoint {
  lat: number;
  lng: number;
  name: string;
  type: string;
  capability: number;
  influence: number;
  stability: number;
  intentions: string;
  color: string;
  size: number;
  altitude: number;
}

export default function ActorGlobe({ results }: Props) {
  const globeRef = useRef<any>(null);
  const [isRotating, setIsRotating] = useState(true);
  const actors = results.parsedData?.part2_ActorArchitecture?.actors || [];

  // Map actors to globe points
  const points: GlobePoint[] = useMemo(() => {
    return actors
      .map(actor => {
        const coords = getCoords(actor.name);
        if (!coords) return null;
        return {
          lat: coords[0],
          lng: coords[1],
          name: actor.name,
          type: actor.type,
          capability: actor.capability,
          influence: actor.influence,
          stability: actor.stability,
          intentions: actor.intentions,
          color: getColor(actor.type),
          size: 0.4 + (actor.influence || 0.5) * 0.8,
          altitude: 0.01,
        };
      })
      .filter(Boolean) as GlobePoint[];
  }, [actors]);


  // Region heatmap points (from part6 Geographic Impact)
  const regionPoints = useMemo(() => {
    const regions = results.parsedData?.part6_GeographicImpact?.regions || [];
    return regions
      .map(r => {
        const coords = getRegionCoords(r.name);
        if (!coords) return null;
        const clr = r.economicShockIndex >= 0.7 ? '#ef4444' : r.economicShockIndex >= 0.4 ? '#f59e0b' : '#22c55e';
        return {
          lat: coords[0],
          lng: coords[1],
          name: r.name,
          economicShockIndex: r.economicShockIndex,
          tradeDependency: r.tradeDependency,
          strategicImpact: r.strategicImpact,
          color: clr + '90',
          size: 3,
          altitude: 0.01,
        };
      })
      .filter(Boolean) as any[];
  }, [results]);

  // Institutional stress points (from part7 OrderEffects)
  const stressPoints = useMemo(() => {
    const stressData = results.parsedData?.part7_OrderEffects?.institutionalStress || [];
    return stressData
      .map(s => {
        const coords = getCoords(s.institution);
        if (!coords) return null;
        const clr = s.stressLevel >= 0.7 ? '#ef4444' : s.stressLevel >= 0.4 ? '#f59e0b' : '#22c55e';
        return {
          lat: coords[0],
          lng: coords[1],
          name: s.institution,
          stressLevel: s.stressLevel,
          color: clr,
          size: 0.6 + s.stressLevel * 0.6,
          altitude: 0.02,
          isStress: true,
        };
      })
      .filter(Boolean) as any[];
  }, [results]);

  // Deconflict all points combined (actors + regions + stress)
  const allPoints = useMemo(() => {
    const combined = [...points, ...regionPoints, ...stressPoints] as any[];
    return deconflictCoords(
      combined,
      (item: any) => [item.lat, item.lng] as [number, number],
      (item: any, lat: number, lng: number) => ({ ...item, lat, lng }),
      5
    );
  }, [points, regionPoints, stressPoints]);

  // Build arc connections using deconflicted positions so arcs connect to actual marker locations
  const arcs = useMemo(() => {
    const alignments = results.parsedData?.part1_SituationAssessment?.strategicAlignment || [];
    const arcData: any[] = [];
    const seen = new Set<string>();

    const ARC_COLORS: Record<string, string> = {
      'Opposed': '#ef4444',
      'Aligned': '#22c55e',
      'Neutral': '#64748b',
    };

    // Build a name→coords lookup from deconflicted points
    const coordsMap = new Map<string, [number, number]>();
    for (const p of allPoints) {
      if (p.name && !coordsMap.has(p.name)) {
        coordsMap.set(p.name, [p.lat, p.lng]);
      }
    }

    const groups: Record<string, string[]> = {};
    for (const a of alignments) {
      if (!groups[a.alignment]) groups[a.alignment] = [];
      groups[a.alignment].push(a.actor);
    }

    for (const [alignment, group] of Object.entries(groups)) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const key = [group[i], group[j]].sort().join('|');
          if (!seen.has(key)) {
            seen.add(key);
            const c1 = coordsMap.get(group[i]) || getCoords(group[i]);
            const c2 = coordsMap.get(group[j]) || getCoords(group[j]);
            if (c1 && c2) {
              arcData.push({
                startLat: c1[0], startLng: c1[1],
                endLat: c2[0], endLng: c2[1],
                color: ARC_COLORS[alignment] || '#64748b',
              });
            }
          }
        }
      }
    }
    return arcData;
  }, [results, allPoints]);

  // Setup globe with rotation pause on interaction
  useEffect(() => {
    if (!globeRef.current) return;

    const globe = globeRef.current;
    const controls = globe.controls();

    // Auto-rotation
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;

    // Initial camera position
    globe.pointOfView({ lat: 20, lng: 30, altitude: 2.5 }, 0);

    // Stop rotation on mouse/touch interaction (user must click button to resume)
    const el = globe.renderer().domElement as HTMLElement;

    const handleStart = () => {
      controls.autoRotate = false;
      setIsRotating(false);
    };

    el.addEventListener('mousedown', handleStart);
    el.addEventListener('touchstart', handleStart);

    return () => {
      el.removeEventListener('mousedown', handleStart);
      el.removeEventListener('touchstart', handleStart);
    };
  }, []);

  // Sync rotation state with controls
  const toggleRotation = useCallback(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    const next = !isRotating;
    controls.autoRotate = next;
    setIsRotating(next);
  }, [isRotating]);

  // Tooltip HTML
  const pointLabel = useCallback((d: any) => {
    const p = d as GlobePoint;
    const barStyle = (val: number) => {
      const pct = Math.round((val || 0) * 100);
      const clr = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
        <span style="font-size:10px;color:#94a3b8;width:60px;text-transform:uppercase;letter-spacing:0.05em">${pct >= 0 ? '' : ''}</span>
        <div style="flex:1;height:4px;background:#1e293b;border-radius:0;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${clr}"></div>
        </div>
        <span style="font-size:10px;color:#e2e8f0;font-family:monospace;width:28px;text-align:right">${pct}%</span>
      </div>`;
    };

    return `<div style="background:#0f172a;border:1px solid #334155;border-radius:2px;padding:10px 12px;min-width:220px;box-shadow:0 8px 32px rgba(0,0,0,0.5);color:#f1f5f9;font-family:system-ui,sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:800;font-size:13px;color:#f1f5f9;letter-spacing:0.05em">${p.name}</span>
        <span style="font-size:9px;font-weight:700;color:${p.color};border:1px solid ${p.color};padding:1px 6px;border-radius:2px;text-transform:uppercase;letter-spacing:0.1em">${p.type}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:3px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;color:#94a3b8;width:60px;text-transform:uppercase;letter-spacing:0.05em">Capability</span>
          <div style="flex:1;height:4px;background:#1e293b;overflow:hidden"><div style="width:${Math.round(p.capability * 100)}%;height:100%;background:${p.capability >= 0.7 ? '#22c55e' : p.capability >= 0.4 ? '#f59e0b' : '#ef4444'}"></div></div>
          <span style="font-size:10px;color:#e2e8f0;font-family:monospace;width:28px;text-align:right">${Math.round(p.capability * 100)}%</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;color:#94a3b8;width:60px;text-transform:uppercase;letter-spacing:0.05em">Influence</span>
          <div style="flex:1;height:4px;background:#1e293b;overflow:hidden"><div style="width:${Math.round(p.influence * 100)}%;height:100%;background:${p.influence >= 0.7 ? '#22c55e' : p.influence >= 0.4 ? '#f59e0b' : '#ef4444'}"></div></div>
          <span style="font-size:10px;color:#e2e8f0;font-family:monospace;width:28px;text-align:right">${Math.round(p.influence * 100)}%</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;color:#94a3b8;width:60px;text-transform:uppercase;letter-spacing:0.05em">Stability</span>
          <div style="flex:1;height:4px;background:#1e293b;overflow:hidden"><div style="width:${Math.round(p.stability * 100)}%;height:100%;background:${p.stability >= 0.7 ? '#22c55e' : p.stability >= 0.4 ? '#f59e0b' : '#ef4444'}"></div></div>
          <span style="font-size:10px;color:#e2e8f0;font-family:monospace;width:28px;text-align:right">${Math.round(p.stability * 100)}%</span>
        </div>
      </div>
      ${p.intentions ? `<div style="margin-top:8px;border-top:1px solid #334155;padding-top:6px"><p style="font-size:10px;color:#94a3b8;line-height:1.4;margin:0">${p.intentions}</p></div>` : ''}
    </div>`;
  }, []);

  if (points.length === 0) return null;

  return (
    <div style={{ height: 420, width: '100%', background: '#0f172a', position: 'relative' }}>
      <Globe
        ref={globeRef}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        pointsData={allPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"
        pointLabel={(d: any) => {
          // Stress points
          if (d.isStress) {
            const s = d;
            const clr = s.color;
            const pct = Math.round(s.stressLevel * 100);
            return `<div style="background:#0f172a;border:1px solid #334155;border-radius:2px;padding:10px 12px;min-width:160px;box-shadow:0 8px 32px rgba(0,0,0,0.5);color:#f1f5f9;font-family:system-ui,sans-serif">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-weight:800;font-size:12px;color:#f1f5f9">${s.name}</span>
                <span style="font-size:9px;font-weight:700;color:${clr};border:1px solid ${clr};padding:1px 5px;border-radius:2px;text-transform:uppercase">STRESS</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:10px;color:#94a3b8;width:70px">Stress Level</span>
                <div style="flex:1;height:4px;background:#1e293b;overflow:hidden"><div style="width:${pct}%;height:100%;background:${clr}"></div></div>
                <span style="font-size:10px;color:#e2e8f0;font-family:monospace;width:28px;text-align:right">${pct}%</span>
              </div>
            </div>`;
          }
          // Region points have economicShockIndex; actor points don't
          if (d.economicShockIndex !== undefined) {
            const r = d;
            const clr = r.color;
            const shock = Math.round(r.economicShockIndex * 100);
            const trade = Math.round(r.tradeDependency * 100);
            return `<div style="background:#0f172a;border:1px solid #334155;border-radius:2px;padding:10px 12px;min-width:200px;box-shadow:0 8px 32px rgba(0,0,0,0.5);color:#f1f5f9;font-family:system-ui,sans-serif">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-weight:800;font-size:12px;color:#f1f5f9">${r.name}</span>
                <span style="font-size:9px;font-weight:700;color:${clr};border:1px solid ${clr};padding:1px 5px;border-radius:2px;text-transform:uppercase">${shock >= 70 ? 'HIGH IMPACT' : shock >= 40 ? 'MODERATE' : 'LOW IMPACT'}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="font-size:10px;color:#94a3b8;width:90px">Economic Shock</span>
                <div style="flex:1;height:4px;background:#1e293b;overflow:hidden"><div style="width:${shock}%;height:100%;background:${clr}"></div></div>
                <span style="font-size:10px;color:#e2e8f0;font-family:monospace;width:28px;text-align:right">${shock}%</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:10px;color:#94a3b8;width:90px">Trade Depend.</span>
                <div style="flex:1;height:4px;background:#1e293b;overflow:hidden"><div style="width:${trade}%;height:100%;background:#3b82f6"></div></div>
                <span style="font-size:10px;color:#e2e8f0;font-family:monospace;width:28px;text-align:right">${trade}%</span>
              </div>
              ${r.strategicImpact ? `<div style="margin-top:6px;border-top:1px solid #334155;padding-top:4px"><p style="font-size:10px;color:#94a3b8;line-height:1.4;margin:0">${r.strategicImpact}</p></div>` : ''}
            </div>`;
          }
          return pointLabel(d);
        }}
        arcsData={arcs}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.4}
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.2}
        width={undefined}
        height={420}
      />

      {/* Rotation toggle button */}
      <button
        onClick={toggleRotation}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: isRotating ? '#1e293b' : '#2563eb',
          color: isRotating ? '#94a3b8' : '#ffffff',
          border: `1px solid ${isRotating ? '#334155' : '#3b82f6'}`,
          borderRadius: 2,
          padding: '5px 12px',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 10,
          transition: 'all 0.2s',
        }}
      >
        {isRotating ? '⏸ Pause' : '▶ Rotate'}
      </button>
    </div>
  );
}
