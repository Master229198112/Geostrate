import React, { useState } from 'react';
import { FileText, Presentation, X, Key, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import pptxgen from 'pptxgenjs';

interface PresentationDeckProps {
  results: any;
  problem?: string;
  onClose: () => void;
}

// ===== COLORS =====
const BLUE = '2563EB';
const DARK = '1E293B';
const GRAY = '64748B';
const LIGHT_BG = 'F8FAFC';
const WHITE = 'FFFFFF';
const ROSE = 'EF4444';
const AMBER = 'F59E0B';
const EMERALD = '10B981';

// ===== LOGO HELPER =====
async function loadLogoAsBase64(): Promise<string> {
  const response = await fetch('/logo.png');
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// ===== HELPER: Split array into chunks =====
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ===== PPT GENERATION =====
async function generatePPT(results: any, problem?: string) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Geostrate CIPF v4.0';
  pptx.title = 'Geopolitical Intelligence Report';

  const logoBase64 = await loadLogoAsBase64();
  const parsed = results.parsedData || {};
  const exec = parsed.executiveSummary || {};

  function addLogo(slide: any) {
    slide.addImage({ data: logoBase64, x: 8.2, y: 0.2, w: 1.5, h: 0.6 });
  }

  function addFooter(slide: any, num: number) {
    slide.addText('Confidential & Proprietary Intelligence', { x: 0.5, y: 5.2, w: 5, h: 0.3, fontSize: 7, color: GRAY, fontFace: 'Arial' });
    slide.addText(`Slide ${num}`, { x: 8.5, y: 5.2, w: 1, h: 0.3, fontSize: 7, color: GRAY, fontFace: 'Arial', align: 'right' });
  }

  let slideNum = 1;

  // --- SLIDE 1: TITLE ---
  {
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };
    addLogo(slide);
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.0, w: 1.5, h: 0.06, fill: { color: BLUE } });
    slide.addText('Geopolitical Intelligence\n& Strategic Assessment', { x: 0.5, y: 2.2, w: 7, h: 1.8, fontSize: 32, bold: true, color: DARK, fontFace: 'Arial', lineSpacingMultiple: 1.1 });
    slide.addText('High-impact risk analysis and scenario projection for executive decision-making.', { x: 0.5, y: 4.0, w: 7, h: 0.5, fontSize: 14, color: GRAY, fontFace: 'Arial' });
    slide.addText('Strategic Advisory Group — Geostrate', { x: 0.5, y: 4.6, w: 7, h: 0.4, fontSize: 11, color: BLUE, fontFace: 'Arial', bold: true });
    addFooter(slide, slideNum++);
  }

  // --- SLIDE: STRATEGIC TARGET INPUT (Correction 5) ---
  if (problem) {
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };
    addLogo(slide);
    slide.addText('Strategic Target Input', { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 1.2, h: 0.04, fill: { color: BLUE } });
    slide.addText('The following strategic input was provided for analysis:', { x: 0.5, y: 1.1, w: 9, h: 0.3, fontSize: 11, color: GRAY, fontFace: 'Arial' });
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 9, h: 3.2, fill: { color: LIGHT_BG }, line: { color: 'CBD5E1', width: 0.5 } });
    const truncatedProblem = problem.length > 2000 ? problem.slice(0, 2000) + '...' : problem;
    slide.addText(truncatedProblem, { x: 0.7, y: 1.7, w: 8.6, h: 2.8, fontSize: 11, color: DARK, fontFace: 'Arial', valign: 'top', wrap: true, lineSpacingMultiple: 1.3 });
    addFooter(slide, slideNum++);
  }

  // --- SLIDE 2: EXECUTIVE SUMMARY ---
  {
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };
    addLogo(slide);
    slide.addText('Executive Summary', { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

    // Risk Indicator
    slide.addText('Geostrate RISK INDICATOR', { x: 6.5, y: 1.1, w: 3, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial', align: 'center' });
    slide.addText(`${(exec.globalRiskIndicator * 100 || 0).toFixed(1)}%`, { x: 6.5, y: 1.4, w: 3, h: 0.8, fontSize: 42, bold: true, color: AMBER, fontFace: 'Arial', align: 'center' });

    // Top Insights
    const insights = exec.top10Insights || [];
    slide.addText('TOP STRATEGIC INSIGHTS', { x: 0.5, y: 1.1, w: 5.5, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });
    insights.slice(0, 5).forEach((insight: string, i: number) => {
      slide.addText(`[${i + 1}]  ${insight}`, { x: 0.5, y: 1.5 + i * 0.5, w: 5.8, h: 0.45, fontSize: 10, color: DARK, fontFace: 'Arial', valign: 'top' });
    });

    // Decision Triggers
    const triggers = exec.keyDecisionTriggers || [];
    slide.addText('KEY DECISION TRIGGERS', { x: 0.5, y: 4.1, w: 5.5, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });
    const triggerText = triggers.map((t: string) => `• ${t}`).join('\n');
    slide.addText(triggerText, { x: 0.5, y: 4.4, w: 9, h: 0.7, fontSize: 9, color: DARK, fontFace: 'Arial' });

    addFooter(slide, slideNum++);
  }

  // --- SLIDE 3: ESCALATION TIMELINE ---
  if (exec.escalationTimeline?.length > 0) {
    const timeline = exec.escalationTimeline;
    const chunks = chunkArray(timeline, 8);
    chunks.forEach((chunk: any[], ci: number) => {
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addLogo(slide);
      slide.addText(`Escalation Timeline${chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ''}`, { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

      chunk.forEach((evt: any, i: number) => {
        const y = 1.1 + i * 0.5;
        slide.addShape(pptx.ShapeType.ellipse, { x: 0.65, y: y + 0.08, w: 0.15, h: 0.15, fill: { color: BLUE } });
        slide.addText(evt.date || '', { x: 1.0, y, w: 2, h: 0.35, fontSize: 9, bold: true, color: BLUE, fontFace: 'Arial' });
        slide.addText(evt.event || '', { x: 3.0, y, w: 6.5, h: 0.35, fontSize: 10, color: DARK, fontFace: 'Arial' });
      });
      addFooter(slide, slideNum++);
    });
  }

  // --- SLIDE 4+: SITUATION ASSESSMENT ---
  if (parsed.part1_SituationAssessment) {
    const data = parsed.part1_SituationAssessment;
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };
    addLogo(slide);
    slide.addText('PART I — Situation Assessment', { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

    // Conflict Timeline
    slide.addText('CONFLICT TIMELINE', { x: 0.5, y: 1.1, w: 4, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });
    (data.conflictTimeline || []).slice(0, 6).forEach((evt: any, i: number) => {
      slide.addText(`${evt.date}: ${evt.event}`, { x: 0.5, y: 1.5 + i * 0.4, w: 4.5, h: 0.35, fontSize: 9, color: DARK, fontFace: 'Arial' });
    });

    // Power Balance
    slide.addText('POWER BALANCE', { x: 5.5, y: 1.1, w: 4, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });
    (data.powerBalance || []).slice(0, 6).forEach((pb: any, i: number) => {
      slide.addText(`${pb.actor}: ${(pb.powerScore * 100).toFixed(0)}%`, { x: 5.5, y: 1.5 + i * 0.4, w: 4, h: 0.35, fontSize: 10, color: DARK, fontFace: 'Arial' });
    });

    addFooter(slide, slideNum++);
  }

  // --- ACTOR ARCHITECTURE ---
  if (parsed.part2_ActorArchitecture?.actors?.length > 0) {
    const actors = parsed.part2_ActorArchitecture.actors;
    const chunks = chunkArray(actors, 6);
    chunks.forEach((chunk: any[], ci: number) => {
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addLogo(slide);
      slide.addText(`PART II — Actor Architecture${chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ''}`, { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

      // Table header
      const tableRows: any[][] = [
        [
          { text: 'Actor', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
          { text: 'Type', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
          { text: 'Capability', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
          { text: 'Influence', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
          { text: 'Intentions', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
        ]
      ];
      chunk.forEach((actor: any) => {
        tableRows.push([
          { text: actor.name || '', options: { fontSize: 9, color: DARK, bold: true } },
          { text: actor.type || '', options: { fontSize: 9, color: GRAY } },
          { text: `${((actor.capability || 0) * 100).toFixed(0)}%`, options: { fontSize: 9, color: BLUE } },
          { text: `${((actor.influence || 0) * 100).toFixed(0)}%`, options: { fontSize: 9, color: AMBER } },
          { text: actor.intentions || '', options: { fontSize: 8, color: DARK } },
        ]);
      });
      slide.addTable(tableRows, { x: 0.5, y: 1.1, w: 9, colW: [2, 1.2, 1, 1, 3.8], border: { pt: 0.5, color: 'E2E8F0' }, fontFace: 'Arial' });
      addFooter(slide, slideNum++);
    });

    // --- ACTOR POWER MATRIX SLIDE ---
    {
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addLogo(slide);
      slide.addText('Actor Power Matrix', { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

      // Left side: Actor data table (mini version)
      const matrixRows: any[][] = [
        [
          { text: 'Actor', options: { bold: true, fontSize: 8, color: GRAY, fill: { color: LIGHT_BG } } },
          { text: 'Type', options: { bold: true, fontSize: 8, color: GRAY, fill: { color: LIGHT_BG } } },
          { text: 'Capability', options: { bold: true, fontSize: 8, color: GRAY, fill: { color: LIGHT_BG }, align: 'center' } },
          { text: 'Influence', options: { bold: true, fontSize: 8, color: GRAY, fill: { color: LIGHT_BG }, align: 'center' } },
          { text: 'Stability', options: { bold: true, fontSize: 8, color: GRAY, fill: { color: LIGHT_BG }, align: 'center' } },
        ]
      ];
      actors.slice(0, 10).forEach((actor: any) => {
        matrixRows.push([
          { text: actor.name || '', options: { fontSize: 8, color: DARK, bold: true } },
          { text: actor.type || '', options: { fontSize: 8, color: actor.type === 'State' ? BLUE : actor.type === 'Military' ? ROSE : EMERALD } },
          { text: `${((actor.capability || 0) * 100).toFixed(0)}%`, options: { fontSize: 8, color: DARK, align: 'center' } },
          { text: `${((actor.influence || 0) * 100).toFixed(0)}%`, options: { fontSize: 8, color: DARK, align: 'center' } },
          { text: `${((actor.stability || 0) * 100).toFixed(0)}%`, options: { fontSize: 8, color: DARK, align: 'center' } },
        ]);
      });
      slide.addTable(matrixRows, { x: 0.4, y: 1.1, w: 5.2, colW: [1.6, 0.8, 0.8, 0.8, 0.8], border: { pt: 0.5, color: 'E2E8F0' }, fontFace: 'Arial', rowH: 0.3 });

      // Right side: Chart Legend & Explanation
      const legendX = 5.9;
      slide.addText('HOW TO READ THIS MATRIX', { x: legendX, y: 1.1, w: 3.8, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });

      // Axes explanation
      slide.addShape(pptx.ShapeType.rect, { x: legendX, y: 1.5, w: 3.8, h: 2.0, fill: { color: LIGHT_BG }, line: { color: 'E2E8F0', width: 0.5 } });

      slide.addText('X-Axis: Actor Influence / Structural Power', { x: legendX + 0.15, y: 1.6, w: 3.5, h: 0.25, fontSize: 9, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addText('Normalized 0–1. Higher values indicate greater structural leverage and raw power capability of the actor.', { x: legendX + 0.15, y: 1.85, w: 3.5, h: 0.35, fontSize: 7.5, color: GRAY, fontFace: 'Arial', wrap: true });

      slide.addText('Y-Axis: Strategic Alignment / Commitment', { x: legendX + 0.15, y: 2.25, w: 3.5, h: 0.25, fontSize: 9, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addText('Normalized 0–1. Higher values indicate stronger alignment with the scenario and willingness to act.', { x: legendX + 0.15, y: 2.5, w: 3.5, h: 0.35, fontSize: 7.5, color: GRAY, fontFace: 'Arial', wrap: true });

      slide.addText('Dot Size: Stability Score', { x: legendX + 0.15, y: 2.9, w: 3.5, h: 0.25, fontSize: 9, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addText('Larger dots = more stable actors. Smaller dots = volatile or fragile actors.', { x: legendX + 0.15, y: 3.1, w: 3.5, h: 0.25, fontSize: 7.5, color: GRAY, fontFace: 'Arial', wrap: true });

      // Color Legend
      slide.addText('DOT COLOR LEGEND', { x: legendX, y: 3.6, w: 3.8, h: 0.25, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });

      // State (Blue)
      slide.addShape(pptx.ShapeType.ellipse, { x: legendX + 0.15, y: 3.93, w: 0.18, h: 0.18, fill: { color: BLUE } });
      slide.addText('State actors — sovereign governments, national agencies', { x: legendX + 0.45, y: 3.85, w: 3.3, h: 0.3, fontSize: 8, color: DARK, fontFace: 'Arial' });

      // Military (Red)
      slide.addShape(pptx.ShapeType.ellipse, { x: legendX + 0.15, y: 4.23, w: 0.18, h: 0.18, fill: { color: ROSE } });
      slide.addText('Military actors — armed forces, defense organizations', { x: legendX + 0.45, y: 4.15, w: 3.3, h: 0.3, fontSize: 8, color: DARK, fontFace: 'Arial' });

      // Other (Green)
      slide.addShape(pptx.ShapeType.ellipse, { x: legendX + 0.15, y: 4.53, w: 0.18, h: 0.18, fill: { color: EMERALD } });
      slide.addText('Other actors — financial, tech, proxy, multilateral', { x: legendX + 0.45, y: 4.45, w: 3.3, h: 0.3, fontSize: 8, color: DARK, fontFace: 'Arial' });

      // Quadrant interpretation
      slide.addText('QUADRANT INTERPRETATION', { x: 0.4, y: 4.2, w: 5, h: 0.25, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });
      slide.addText(
        '• Top-Right: High power + High alignment → Key allies / dominant players\n' +
        '• Top-Left: Low power + High alignment → Willing but limited actors\n' +
        '• Bottom-Right: High power + Low alignment → Potential spoilers / blockers\n' +
        '• Bottom-Left: Low power + Low alignment → Marginal actors',
        { x: 0.4, y: 4.45, w: 5.2, h: 0.7, fontSize: 8, color: DARK, fontFace: 'Arial', lineSpacingMultiple: 1.3, wrap: true }
      );

      addFooter(slide, slideNum++);
    }
  }

  // --- MARKET IMPACT ---
  if (parsed.part3_MarketImpact?.assets?.length > 0) {
    const assets = parsed.part3_MarketImpact.assets;
    const chunks = chunkArray(assets, 4);
    chunks.forEach((chunk: any[], ci: number) => {
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addLogo(slide);
      slide.addText(`PART III — Market Impact${chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ''}`, { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

      chunk.forEach((asset: any, i: number) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.5 + col * 4.7;
        const y = 1.1 + row * 2.0;

        slide.addShape(pptx.ShapeType.rect, { x, y, w: 4.4, h: 1.8, fill: { color: LIGHT_BG }, line: { color: 'E2E8F0', width: 0.5 } });
        slide.addText(asset.class || '', { x: x + 0.2, y: y + 0.1, w: 2.5, h: 0.35, fontSize: 14, bold: true, color: DARK, fontFace: 'Arial' });

        const riskColor = asset.riskExposure === 'High' ? ROSE : asset.riskExposure === 'Medium' ? AMBER : EMERALD;
        slide.addText(`Risk: ${asset.riskExposure}`, { x: x + 3.0, y: y + 0.1, w: 1.2, h: 0.3, fontSize: 8, bold: true, color: riskColor, fontFace: 'Arial', align: 'center' });

        slide.addText(asset.shockProjection || '', { x: x + 0.2, y: y + 0.5, w: 4, h: 0.5, fontSize: 9, color: GRAY, fontFace: 'Arial' });
        slide.addText(`Volatility: ${((asset.volatility || 0) * 100).toFixed(0)}%`, { x: x + 0.2, y: y + 1.1, w: 2, h: 0.3, fontSize: 10, color: AMBER, fontFace: 'Arial', bold: true });
        slide.addText(`Liquidity Stress: ${((asset.liquidityStress || 0) * 100).toFixed(0)}%`, { x: x + 2.2, y: y + 1.1, w: 2, h: 0.3, fontSize: 10, color: BLUE, fontFace: 'Arial', bold: true });
      });
      addFooter(slide, slideNum++);
    });
  }

  // --- SCENARIOS ---
  if (parsed.part4_Scenarios?.length > 0) {
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };
    addLogo(slide);
    slide.addText('PART IV — Scenario Projections', { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

    parsed.part4_Scenarios.slice(0, 4).forEach((scenario: any, i: number) => {
      const x = 0.5 + i * 2.35;
      slide.addShape(pptx.ShapeType.rect, { x, y: 1.1, w: 2.2, h: 4.0, fill: { color: LIGHT_BG }, line: { color: 'E2E8F0', width: 0.5 } });
      slide.addText(`SCENARIO 0${i + 1}`, { x: x + 0.15, y: 1.2, w: 1.9, h: 0.25, fontSize: 8, bold: true, color: BLUE, fontFace: 'Arial' });
      slide.addText(scenario.name || '', { x: x + 0.15, y: 1.5, w: 1.9, h: 0.5, fontSize: 12, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addText(`${((scenario.probability || 0) * 100).toFixed(0)}%`, { x: x + 0.15, y: 2.1, w: 1.9, h: 0.5, fontSize: 28, bold: true, color: BLUE, fontFace: 'Arial' });
      slide.addText(scenario.description || '', { x: x + 0.15, y: 2.7, w: 1.9, h: 1.2, fontSize: 8, color: GRAY, fontFace: 'Arial', valign: 'top' });
      slide.addText(`Econ Shock: ${((scenario.economicShock || 0) * 100).toFixed(0)}%`, { x: x + 0.15, y: 4.0, w: 1.9, h: 0.25, fontSize: 8, bold: true, color: ROSE, fontFace: 'Arial' });
      slide.addText(`Recovery: ${scenario.recoveryTimeline || 'N/A'}`, { x: x + 0.15, y: 4.3, w: 1.9, h: 0.25, fontSize: 8, color: DARK, fontFace: 'Arial' });
    });
    addFooter(slide, slideNum++);
  }

  // --- SECTOR DECISION ---
  if (parsed.part5_SectorDecision?.sectors?.length > 0) {
    const sectors = parsed.part5_SectorDecision.sectors;
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };
    addLogo(slide);
    slide.addText('PART V — Sector Decision Matrices', { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

    const tableRows: any[][] = [[
      { text: 'Sector', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
      { text: 'Shock Vuln.', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
      { text: 'Opportunity', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
      { text: 'Resilience', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
      { text: 'Supply Chain Risk', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
    ]];
    sectors.forEach((s: any) => {
      tableRows.push([
        { text: s.name || '', options: { fontSize: 9, color: DARK, bold: true } },
        { text: `${((s.shockVulnerability || 0) * 100).toFixed(0)}%`, options: { fontSize: 9, color: ROSE } },
        { text: `${((s.opportunityScore || 0) * 100).toFixed(0)}%`, options: { fontSize: 9, color: EMERALD } },
        { text: `${((s.resilienceScore || 0) * 100).toFixed(0)}%`, options: { fontSize: 9, color: BLUE } },
        { text: s.supplyChainVulnerability || '', options: { fontSize: 8, color: DARK } },
      ]);
    });
    slide.addTable(tableRows, { x: 0.5, y: 1.1, w: 9, colW: [1.8, 1.2, 1.2, 1.2, 3.6], border: { pt: 0.5, color: 'E2E8F0' }, fontFace: 'Arial' });
    addFooter(slide, slideNum++);
  }

  // --- GEOGRAPHIC IMPACT ---
  if (parsed.part6_GeographicImpact?.regions?.length > 0) {
    const regions = parsed.part6_GeographicImpact.regions;
    const chunks = chunkArray(regions, 3);
    chunks.forEach((chunk: any[], ci: number) => {
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addLogo(slide);
      slide.addText(`PART VI — Geographic Impact${chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ''}`, { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

      chunk.forEach((region: any, i: number) => {
        const x = 0.5 + i * 3.15;
        slide.addShape(pptx.ShapeType.rect, { x, y: 1.1, w: 2.95, h: 3.9, fill: { color: LIGHT_BG }, line: { color: 'E2E8F0', width: 0.5 } });
        slide.addText(region.name || '', { x: x + 0.15, y: 1.2, w: 2.6, h: 0.4, fontSize: 14, bold: true, color: DARK, fontFace: 'Arial' });
        slide.addText(`Econ Shock: ${((region.economicShockIndex || 0) * 100).toFixed(0)}%`, { x: x + 0.15, y: 1.7, w: 2.6, h: 0.3, fontSize: 10, color: ROSE, fontFace: 'Arial', bold: true });
        slide.addText(`Trade Dep.: ${((region.tradeDependency || 0) * 100).toFixed(0)}%`, { x: x + 0.15, y: 2.0, w: 2.6, h: 0.3, fontSize: 10, color: AMBER, fontFace: 'Arial', bold: true });
        slide.addText('Strategic Impact:', { x: x + 0.15, y: 2.5, w: 2.6, h: 0.2, fontSize: 8, bold: true, color: GRAY, fontFace: 'Arial' });
        slide.addText(region.strategicImpact || '', { x: x + 0.15, y: 2.7, w: 2.6, h: 0.9, fontSize: 8, color: DARK, fontFace: 'Arial', valign: 'top' });
        slide.addText('Military Hotspot:', { x: x + 0.15, y: 3.7, w: 2.6, h: 0.2, fontSize: 8, bold: true, color: GRAY, fontFace: 'Arial' });
        slide.addText(region.militaryHotspot || '', { x: x + 0.15, y: 3.9, w: 2.6, h: 0.8, fontSize: 8, color: DARK, fontFace: 'Arial', valign: 'top' });
      });
      addFooter(slide, slideNum++);
    });
  }

  // --- ORDER EFFECTS ---
  if (parsed.part7_OrderEffects) {
    const data = parsed.part7_OrderEffects;
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };
    addLogo(slide);
    slide.addText('PART VII — Second & Third Order Effects', { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

    // Domino Effects
    slide.addText('DOMINO EFFECTS', { x: 0.5, y: 1.1, w: 4, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });
    (data.dominoEffects || []).slice(0, 5).forEach((effect: string, i: number) => {
      slide.addText(`• ${effect}`, { x: 0.5, y: 1.5 + i * 0.45, w: 4.5, h: 0.4, fontSize: 9, color: DARK, fontFace: 'Arial' });
    });

    // Black Swan
    slide.addText('BLACK SWAN PROBABILITIES', { x: 5.3, y: 1.1, w: 4, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });
    (data.blackSwanProbabilities || []).slice(0, 4).forEach((swan: any, i: number) => {
      slide.addText(`${swan.event}  (P: ${((swan.probability || 0) * 100).toFixed(0)}%, I: ${((swan.impact || 0) * 100).toFixed(0)}%)`, { x: 5.3, y: 1.5 + i * 0.45, w: 4.2, h: 0.4, fontSize: 9, color: DARK, fontFace: 'Arial' });
    });

    // Institutional Stress
    slide.addText('INSTITUTIONAL STRESS', { x: 0.5, y: 4.0, w: 4, h: 0.3, fontSize: 9, bold: true, color: GRAY, fontFace: 'Arial' });
    (data.institutionalStress || []).forEach((inst: any, i: number) => {
      slide.addText(`${inst.institution}: ${((inst.stressLevel || 0) * 100).toFixed(0)}%`, { x: 0.5 + i * 2.5, y: 4.4, w: 2.3, h: 0.3, fontSize: 10, color: AMBER, fontFace: 'Arial', bold: true });
    });

    addFooter(slide, slideNum++);
  }

  // --- STRATEGIC Q&A ---
  if (parsed.part8_StrategicQA?.length > 0) {
    const qas = parsed.part8_StrategicQA;
    const chunks = chunkArray(qas, 3);
    chunks.forEach((chunk: any[], ci: number) => {
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addLogo(slide);
      slide.addText(`PART VIII — Strategic Q&A${chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ''}`, { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

      chunk.forEach((qa: any, i: number) => {
        const y = 1.1 + i * 1.3;
        slide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 9, h: 1.15, fill: { color: LIGHT_BG }, line: { color: 'E2E8F0', width: 0.5 } });
        slide.addText(`Q: ${qa.question || ''}`, { x: 0.7, y: y + 0.08, w: 8.6, h: 0.3, fontSize: 11, bold: true, color: BLUE, fontFace: 'Arial' });
        slide.addText(`A: ${qa.analyticalAnswer || ''}`, { x: 0.7, y: y + 0.4, w: 7, h: 0.45, fontSize: 9, color: DARK, fontFace: 'Arial', valign: 'top' });
        slide.addText(`Confidence: ${((qa.confidenceLevel || 0) * 100).toFixed(0)}%`, { x: 7.8, y: y + 0.4, w: 1.5, h: 0.3, fontSize: 10, bold: true, color: EMERALD, fontFace: 'Arial', align: 'right' });
      });
      addFooter(slide, slideNum++);
    });
  }

  // --- DECISION ARCHITECTURE ---
  if (parsed.part9_DecisionArchitecture?.stakeholders?.length > 0) {
    const stakeholders = parsed.part9_DecisionArchitecture.stakeholders;
    const chunks = chunkArray(stakeholders, 3);
    chunks.forEach((chunk: any[], ci: number) => {
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addLogo(slide);
      slide.addText(`PART IX — Decision Architecture${chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ''}`, { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

      chunk.forEach((sh: any, i: number) => {
        const x = 0.5 + i * 3.15;
        slide.addShape(pptx.ShapeType.rect, { x, y: 1.1, w: 2.95, h: 3.9, fill: { color: LIGHT_BG }, line: { color: 'E2E8F0', width: 0.5 } });
        slide.addText(sh.type || '', { x: x + 0.15, y: 1.2, w: 2.6, h: 0.4, fontSize: 13, bold: true, color: DARK, fontFace: 'Arial' });
        slide.addText('Action Framework:', { x: x + 0.15, y: 1.7, w: 2.6, h: 0.2, fontSize: 8, bold: true, color: BLUE, fontFace: 'Arial' });

        const actions = (sh.actionFramework || []).slice(0, 4).map((a: string) => `▸ ${a}`).join('\n');
        slide.addText(actions, { x: x + 0.15, y: 1.95, w: 2.6, h: 1.3, fontSize: 8, color: DARK, fontFace: 'Arial', valign: 'top' });

        slide.addText('Risk Mitigation:', { x: x + 0.15, y: 3.3, w: 2.6, h: 0.2, fontSize: 8, bold: true, color: EMERALD, fontFace: 'Arial' });
        const risks = (sh.riskMitigation || []).slice(0, 4).map((r: string) => `▸ ${r}`).join('\n');
        slide.addText(risks, { x: x + 0.15, y: 3.55, w: 2.6, h: 1.3, fontSize: 8, color: DARK, fontFace: 'Arial', valign: 'top' });
      });
      addFooter(slide, slideNum++);
    });
  }

  // --- APPENDIX: VARIABLE MAPPING ---
  if (parsed.variableExplanations?.length > 0) {
    const vars = parsed.variableExplanations;
    const chunks = chunkArray(vars, 10);
    chunks.forEach((chunk: any[], ci: number) => {
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addLogo(slide);
      slide.addText(`Appendix — CIPF Variable Scores${chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ''}`, { x: 0.5, y: 0.3, w: 7, h: 0.5, fontSize: 22, bold: true, color: DARK, fontFace: 'Arial' });
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: 'E2E8F0' } });

      const tableRows: any[][] = [[
        { text: 'Variable', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
        { text: 'Value', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
        { text: 'Explanation', options: { bold: true, fontSize: 9, color: GRAY, fill: { color: LIGHT_BG } } },
      ]];
      chunk.forEach((v: any) => {
        tableRows.push([
          { text: v.variable || '', options: { fontSize: 9, color: BLUE, bold: true } },
          { text: Number(v.value || 0).toFixed(2), options: { fontSize: 9, color: DARK } },
          { text: v.explanation || '', options: { fontSize: 8, color: DARK } },
        ]);
      });
      slide.addTable(tableRows, { x: 0.5, y: 1.1, w: 9, colW: [1.2, 0.8, 7], border: { pt: 0.5, color: 'E2E8F0' }, fontFace: 'Arial' });
      addFooter(slide, slideNum++);
    });
  }

  await pptx.writeFile({ fileName: 'Geostrate_Intelligence_Report.pptx' });
}

// ===== PDF GENERATION =====
async function generatePDF(results: any) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;
  const M = 15; // margin
  const CW = W - 2 * M; // content width
  const parsed = results.parsedData || {};
  const exec = parsed.executiveSummary || {};

  // Load logo
  const logoBase64 = await loadLogoAsBase64();

  function addHeader(title: string) {
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, W, 20, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.text(title, M, 13);
    pdf.addImage(logoBase64, 'PNG', W - M - 30, 3, 28, 12);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(M, 20, W - M, 20);
  }

  function addFooter(page: number) {
    pdf.setFontSize(6);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Confidential & Proprietary Intelligence', M, H - 5);
    pdf.text(`Page ${page}`, W - M, H - 5, { align: 'right' });
  }

  let page = 1;

  // --- PAGE 1: TITLE ---
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, W, H, 'F');
  pdf.addImage(logoBase64, 'PNG', W - M - 30, 15, 28, 12);
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(1.5);
  pdf.line(M, 70, M + 40, 70);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(30, 41, 59);
  pdf.text('Geopolitical Intelligence', M, 85);
  pdf.text('& Strategic Assessment', M, 98);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(100, 116, 139);
  pdf.text('High-impact risk analysis and scenario projection', M, 115);
  pdf.text('for executive decision-making.', M, 123);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(37, 99, 235);
  pdf.text('Strategic Advisory Group — Geostrate', M, 145);
  addFooter(page++);

  // --- PAGE 2: EXECUTIVE SUMMARY ---
  pdf.addPage();
  addHeader('Executive Summary');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Geostrate RISK INDICATOR', W - M - 50, 30);
  pdf.setFontSize(36);
  pdf.setTextColor(245, 158, 11);
  pdf.text(`${(exec.globalRiskIndicator * 100 || 0).toFixed(1)}%`, W - M - 50, 50);

  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('TOP STRATEGIC INSIGHTS', M, 30);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(30, 41, 59);
  let yPos = 37;
  (exec.top10Insights || []).slice(0, 6).forEach((insight: string, i: number) => {
    const lines = pdf.splitTextToSize(`[${i + 1}] ${insight}`, CW * 0.6);
    pdf.text(lines, M, yPos);
    yPos += lines.length * 5 + 2;
  });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('KEY DECISION TRIGGERS', M, yPos + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(30, 41, 59);
  yPos += 12;
  (exec.keyDecisionTriggers || []).forEach((t: string) => {
    const lines = pdf.splitTextToSize(`• ${t}`, CW);
    pdf.text(lines, M, yPos);
    yPos += lines.length * 4.5 + 1;
  });
  addFooter(page++);

  // --- PAGE 3+: ESCALATION TIMELINE ---
  if (exec.escalationTimeline?.length > 0) {
    pdf.addPage();
    addHeader('Escalation Timeline');
    yPos = 28;
    exec.escalationTimeline.forEach((evt: any, i: number) => {
      if (yPos > H - 25) {
        addFooter(page++);
        pdf.addPage();
        addHeader('Escalation Timeline (cont.)');
        yPos = 28;
      }
      pdf.setFillColor(37, 99, 235);
      pdf.circle(M + 2, yPos + 1.5, 1.5, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(37, 99, 235);
      pdf.text(evt.date || '', M + 7, yPos + 2);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59);
      pdf.text(evt.event || '', M + 45, yPos + 2);
      yPos += 8;
    });
    addFooter(page++);
  }

  // --- ACTOR ARCHITECTURE ---
  if (parsed.part2_ActorArchitecture?.actors?.length > 0) {
    pdf.addPage();
    addHeader('PART II — Actor Architecture');
    yPos = 28;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Actor', M, yPos); pdf.text('Type', M + 55, yPos); pdf.text('Cap.', M + 95, yPos); pdf.text('Infl.', M + 115, yPos); pdf.text('Intentions', M + 135, yPos);
    yPos += 5;
    pdf.setDrawColor(226, 232, 240); pdf.line(M, yPos, W - M, yPos); yPos += 3;

    parsed.part2_ActorArchitecture.actors.forEach((actor: any) => {
      if (yPos > H - 25) { addFooter(page++); pdf.addPage(); addHeader('Actor Architecture (cont.)'); yPos = 28; }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(30, 41, 59);
      pdf.text((actor.name || '').substring(0, 25), M, yPos);
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139);
      pdf.text(actor.type || '', M + 55, yPos);
      pdf.setTextColor(37, 99, 235); pdf.text(`${((actor.capability || 0) * 100).toFixed(0)}%`, M + 95, yPos);
      pdf.setTextColor(245, 158, 11); pdf.text(`${((actor.influence || 0) * 100).toFixed(0)}%`, M + 115, yPos);
      pdf.setTextColor(30, 41, 59);
      const intentLines = pdf.splitTextToSize(actor.intentions || '', 120);
      pdf.text(intentLines.slice(0, 2), M + 135, yPos);
      yPos += Math.max(intentLines.length, 1) * 4.5 + 2;
    });
    addFooter(page++);
  }

  // --- MARKET IMPACT ---
  if (parsed.part3_MarketImpact?.assets?.length > 0) {
    pdf.addPage();
    addHeader('PART III — Market Impact');
    yPos = 28;
    parsed.part3_MarketImpact.assets.forEach((asset: any) => {
      if (yPos > H - 35) { addFooter(page++); pdf.addPage(); addHeader('Market Impact (cont.)'); yPos = 28; }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(30, 41, 59);
      pdf.text(asset.class || '', M, yPos);

      const riskCol = asset.riskExposure === 'High' ? [239, 68, 68] : asset.riskExposure === 'Medium' ? [245, 158, 11] : [16, 185, 129];
      pdf.setFontSize(8); pdf.setTextColor(riskCol[0], riskCol[1], riskCol[2]);
      pdf.text(`Risk: ${asset.riskExposure}`, M + 60, yPos);

      yPos += 6;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
      const projLines = pdf.splitTextToSize(asset.shockProjection || '', CW);
      pdf.text(projLines, M, yPos);
      yPos += projLines.length * 4 + 2;

      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
      pdf.setTextColor(245, 158, 11); pdf.text(`Volatility: ${((asset.volatility || 0) * 100).toFixed(0)}%`, M, yPos);
      pdf.setTextColor(37, 99, 235); pdf.text(`Liquidity Stress: ${((asset.liquidityStress || 0) * 100).toFixed(0)}%`, M + 50, yPos);
      yPos += 10;
      pdf.setDrawColor(226, 232, 240); pdf.line(M, yPos - 3, W - M, yPos - 3);
    });
    addFooter(page++);
  }

  // --- SCENARIOS ---
  if (parsed.part4_Scenarios?.length > 0) {
    pdf.addPage();
    addHeader('PART IV — Scenario Projections');
    const colW = CW / Math.min(parsed.part4_Scenarios.length, 4);
    parsed.part4_Scenarios.slice(0, 4).forEach((s: any, i: number) => {
      const x = M + i * colW;
      pdf.setFillColor(248, 250, 252); pdf.rect(x + 1, 25, colW - 2, H - 50, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(37, 99, 235);
      pdf.text(`SCENARIO 0${i + 1}`, x + 3, 32);
      pdf.setFontSize(11); pdf.setTextColor(30, 41, 59);
      pdf.text(s.name || '', x + 3, 40);
      pdf.setFontSize(24); pdf.setTextColor(37, 99, 235);
      pdf.text(`${((s.probability || 0) * 100).toFixed(0)}%`, x + 3, 56);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139);
      const descLines = pdf.splitTextToSize(s.description || '', colW - 8);
      pdf.text(descLines.slice(0, 8), x + 3, 64);
      const descH = Math.min(descLines.length, 8) * 3.5;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
      pdf.setTextColor(239, 68, 68); pdf.text(`Econ Shock: ${((s.economicShock || 0) * 100).toFixed(0)}%`, x + 3, 66 + descH + 5);
      pdf.setTextColor(30, 41, 59); pdf.text(`Recovery: ${s.recoveryTimeline || 'N/A'}`, x + 3, 66 + descH + 12);
    });
    addFooter(page++);
  }

  // --- STRATEGIC Q&A ---
  if (parsed.part8_StrategicQA?.length > 0) {
    pdf.addPage();
    addHeader('PART VIII — Strategic Q&A');
    yPos = 28;
    parsed.part8_StrategicQA.forEach((qa: any) => {
      if (yPos > H - 40) { addFooter(page++); pdf.addPage(); addHeader('Strategic Q&A (cont.)'); yPos = 28; }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(37, 99, 235);
      const qLines = pdf.splitTextToSize(`Q: ${qa.question || ''}`, CW - 40);
      pdf.text(qLines, M, yPos);
      yPos += qLines.length * 4.5 + 2;

      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(30, 41, 59);
      const aLines = pdf.splitTextToSize(`A: ${qa.analyticalAnswer || ''}`, CW - 40);
      pdf.text(aLines.slice(0, 6), M, yPos);
      yPos += Math.min(aLines.length, 6) * 4 + 2;

      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(16, 185, 129);
      pdf.text(`Confidence: ${((qa.confidenceLevel || 0) * 100).toFixed(0)}%`, W - M - 40, yPos - 4);

      yPos += 6;
      pdf.setDrawColor(226, 232, 240); pdf.line(M, yPos - 2, W - M, yPos - 2);
    });
    addFooter(page++);
  }

  // --- VARIABLE APPENDIX ---
  if (parsed.variableExplanations?.length > 0) {
    pdf.addPage();
    addHeader('Appendix — CIPF Variable Scores');
    yPos = 28;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
    pdf.text('Variable', M, yPos); pdf.text('Value', M + 25, yPos); pdf.text('Explanation', M + 45, yPos);
    yPos += 4; pdf.setDrawColor(226, 232, 240); pdf.line(M, yPos, W - M, yPos); yPos += 3;

    parsed.variableExplanations.forEach((v: any) => {
      if (yPos > H - 25) { addFooter(page++); pdf.addPage(); addHeader('Variable Scores (cont.)'); yPos = 28; }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(37, 99, 235);
      pdf.text(v.variable || '', M, yPos);
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(30, 41, 59);
      pdf.text(Number(v.value || 0).toFixed(2), M + 25, yPos);
      const expLines = pdf.splitTextToSize(v.explanation || '', CW - 50);
      pdf.text(expLines.slice(0, 2), M + 45, yPos);
      yPos += Math.max(Math.min(expLines.length, 2), 1) * 4 + 2;
    });
    addFooter(page++);
  }

  pdf.save('Geostrate_Intelligence_Report.pdf');
}

// ===== MAIN COMPONENT: DOWNLOAD MODAL =====
import PaywallModal from './PaywallModal';
import { useUser } from '../context/UserContext';

export default function PresentationDeck({ results, problem, onClose }: PresentationDeckProps) {
  const { user, requestDownload } = useUser();
  const [isDownloading, setIsDownloading] = useState<'ppt' | 'pdf' | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<'ppt' | 'pdf' | null>(null);
  const [downloadError, setDownloadError] = useState('');
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');

  const handlePromoValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    setPromoError('');
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      
      // Store access token
      sessionStorage.setItem('geostrate_access', JSON.stringify({ type: 'promo', features: data.features }));
      setShowLoginPrompt(false);
      
      // Auto-trigger the pending download if there was one
      if (pendingDownload) {
        checkAccessAndDownload(pendingDownload);
        setPendingDownload(null);
      }
    } catch (err: any) {
      setPromoError(err.message);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const checkAccessAndDownload = async (type: 'ppt' | 'pdf') => {
    setDownloadError('');

    // 1. If user is logged in and has a plan → ALWAYS use server-side gating
    if (user && user.plan) {
      const result = await requestDownload(type);
      if (!result.success) {
        setDownloadError(result.error || 'Download not permitted');
        return;
      }
      await doDownload(type);
      return;
    }

    // 2. Check promo code access (only for non-logged-in users or users without a plan)
    const accessStr = sessionStorage.getItem('geostrate_access');
    if (accessStr) {
      try {
        const access = JSON.parse(accessStr);
        if (access.features?.[type]) {
          await doDownload(type);
          return;
        }
      } catch { /* invalid session data, ignore */ }
    }

    // 3. User not logged in → prompt login
    if (!user) {
      setShowLoginPrompt(true);
      setPendingDownload(type);
      return;
    }

    // 4. User logged in but no plan → show error
    setDownloadError('No active subscription. Please purchase a plan from your profile.');
  };

  const doDownload = async (type: 'ppt' | 'pdf') => {
    setIsDownloading(type);
    try {
      if (type === 'ppt') await generatePPT(results, problem);
      if (type === 'pdf') await generatePDF(results);
    } catch (err) {
      console.error(`${type.toUpperCase()} generation failed:`, err);
      alert(`Failed to generate ${type.toUpperCase()}. Please try again.`);
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Executive Briefing Export</h2>
            <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 text-xl">&times;</button>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Download the complete intelligence report with all sections, charts data, and analysis. Landscape format with Woxsen University branding.
          </p>

          {downloadError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-sm">
              {downloadError}
            </div>
          )}

          {showLoginPrompt && !user && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Login Required</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Please <strong>login or register</strong> to purchase a subscription plan for downloading reports.
              </p>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-slate-400 font-medium uppercase tracking-wider">Or Use Promo Code</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>

              {promoError && (
                <div className="mt-2 mb-3 p-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-sm flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{promoError}</span>
                </div>
              )}

              <form onSubmit={handlePromoValidate} className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter Code (e.g. WOXSEN2026)"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isValidatingPromo || !promoCode}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isValidatingPromo ? '...' : 'Apply'}
                </button>
              </form>
            </div>
          )}

          {user && user.plan && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs rounded-sm flex items-center justify-between">
              <span>Plan: <strong>{user.plan}</strong></span>
              <span className="font-mono">{user.downloadsUsed} / {user.downloadsAllowed} used</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => checkAccessAndDownload('ppt')}
              disabled={isDownloading !== null}
              className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Presentation className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-bold">
                  {isDownloading === 'ppt' ? 'Generating PPT...' : 'Download PowerPoint'}
                </div>
                <div className="text-xs text-blue-200">Landscape .pptx with logo and all slides</div>
              </div>
              {isDownloading === 'ppt' && <div className="ml-auto w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            </button>

            <button
              onClick={() => checkAccessAndDownload('pdf')}
              disabled={isDownloading !== null}
              className="w-full flex items-center gap-3 bg-slate-700 hover:bg-slate-600 text-white px-5 py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-bold">
                  {isDownloading === 'pdf' ? 'Generating PDF...' : 'Download PDF Report'}
                </div>
                <div className="text-xs text-slate-400">Landscape A4 with logo and pagination</div>
              </div>
              {isDownloading === 'pdf' && <div className="ml-auto w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-600 text-center">
            <p className="text-xs text-slate-400">
              Reports include: Executive Summary, Situation Assessment, Actor Architecture, Market Impact, Scenarios, Sector Analysis, Geographic Impact, Q&A, Decision Architecture, and CIPF Variables.
            </p>
          </div>
        </div>
      </div>

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          onSuccess={() => {
            setShowPaywall(false);
            if (pendingDownload) checkAccessAndDownload(pendingDownload);
          }}
        />
      )}
    </>
  );
}
