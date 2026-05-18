'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ActivityNode {
  /** Unique key (entry id or composite). */
  key: string;
  /** Area display name. */
  areaName: string;
  /** Score 1-10. */
  score: number;
  /** ISO date string (yyyy-mm-dd) or full ISO. */
  date: string;
  /** Hex color of the area. */
  color: string;
}

interface RecentActivityConstellationProps {
  nodes: ActivityNode[];
}

/**
 * Recent activity rendered as a constellation, not a list.
 *
 * Each entry is a glowing dot in its area's color, positioned along the
 * X axis chronologically (oldest left, newest right) and along the Y axis
 * by score (10 on top, 1 on bottom). Adjacent dots are connected by a
 * soft gold line, the whole thing reading as a star map of where the user
 * has been recently rather than a spreadsheet of rows.
 *
 * Hovering a dot lifts it, brightens its halo, and reveals a small label
 * with the area name, date, and score. Below the chart, a compact legend
 * keeps the raw data accessible.
 */
export function RecentActivityConstellation({
  nodes,
}: RecentActivityConstellationProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  if (nodes.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border-sub bg-black-3/40 p-12 text-center">
        <p className="font-display text-xl italic text-silver">Nothing here yet.</p>
        <p className="mt-2 text-sm text-muted">
          Once you start logging progress, your timeline will show up here.
        </p>
      </div>
    );
  }

  // SVG viewport in design units. The viewBox keeps things crisp at any
  // rendered width.
  const W = 800;
  const H = 260;
  const padX = 56;
  const padY = 40;

  const n = nodes.length;
  const points = nodes.map((node, i) => {
    const x =
      n === 1
        ? W / 2
        : padX + (i / (n - 1)) * (W - padX * 2);
    const y =
      H - padY - ((node.score - 1) / 9) * (H - padY * 2);
    return { ...node, x, y };
  });

  // Build a smooth curve through the points using catmull-rom-ish midpoints
  // for a slightly organic feel, not a sharp polyline.
  const pathStr = buildSmoothPath(points);

  return (
    <div className="overflow-hidden rounded-sm border border-border-sub bg-black-3 p-6">
      {/* SVG constellation */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Soft blur filter for the glow */}
            <filter id="cf-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Faint gradient for the connecting curve */}
            <linearGradient id="cf-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c9a548" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#c9a548" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e4c97a" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* Faint reference grid: top/middle/bottom dotted lines */}
          {[0.2, 0.5, 0.8].map((p) => (
            <line
              key={p}
              x1={padX}
              y1={H * p}
              x2={W - padX}
              y2={H * p}
              stroke="rgba(201,165,72,0.06)"
              strokeDasharray="2 6"
            />
          ))}

          {/* Score labels at left edge */}
          <text
            x={padX - 10}
            y={padY + 4}
            textAnchor="end"
            className="fill-muted"
            style={{ fontSize: 10, letterSpacing: '0.16em' }}
          >
            10
          </text>
          <text
            x={padX - 10}
            y={H - padY + 4}
            textAnchor="end"
            className="fill-muted"
            style={{ fontSize: 10, letterSpacing: '0.16em' }}
          >
            1
          </text>

          {/* Connecting curve */}
          <motion.path
            d={pathStr}
            fill="none"
            stroke="url(#cf-line)"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#cf-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Dots */}
          {points.map((p, i) => {
            const isHovered = hoveredKey === p.key;
            const baseR = 3.5 + (p.score / 10) * 3.5;
            const haloR = baseR * 3;
            return (
              <g key={p.key}>
                {/* Outer halo */}
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  fill={p.color}
                  initial={{ opacity: 0, r: 0 }}
                  animate={{
                    opacity: isHovered ? 0.45 : 0.18,
                    r: isHovered ? haloR * 1.3 : haloR,
                  }}
                  transition={{ duration: 0.4, delay: 0.05 * i, type: 'spring', damping: 18 }}
                />
                {/* Inner solid dot */}
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  fill={p.color}
                  filter="url(#cf-glow)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredKey(p.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  initial={{ opacity: 0, r: 0 }}
                  animate={{
                    opacity: 1,
                    r: isHovered ? baseR * 1.5 : baseR,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.08 * i + 0.2,
                    type: 'spring',
                    stiffness: 250,
                    damping: 18,
                  }}
                />

                {/* Hover label */}
                {isHovered && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect
                      x={p.x - 70}
                      y={p.y - 48}
                      width={140}
                      height={32}
                      rx={3}
                      fill="rgba(6, 9, 8, 0.9)"
                      stroke={p.color}
                      strokeOpacity={0.7}
                      strokeWidth={1}
                    />
                    <text
                      x={p.x}
                      y={p.y - 32}
                      textAnchor="middle"
                      className="fill-ivory"
                      style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em' }}
                    >
                      {p.areaName}
                    </text>
                    <text
                      x={p.x}
                      y={p.y - 21}
                      textAnchor="middle"
                      className="fill-muted"
                      style={{ fontSize: 9, letterSpacing: '0.12em' }}
                    >
                      {formatShort(p.date)} · {p.score} / 10
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Compact legend below the chart. Keeps the raw data accessible
          without falling back into the boring list shape. */}
      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border-sub pt-4 text-xs">
        {points.map((p) => {
          const isHovered = hoveredKey === p.key;
          return (
            <li
              key={`legend-${p.key}`}
              onMouseEnter={() => setHoveredKey(p.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={cn(
                'flex items-center gap-2 transition-opacity',
                hoveredKey && !isHovered ? 'opacity-40' : 'opacity-100',
              )}
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}aa` }}
              />
              <span className="text-ivory">{p.areaName}</span>
              <span className="text-muted">{formatShort(p.date)}</span>
              <span className="font-display text-base font-light text-gold-lt">
                {p.score}
                <span className="ml-0.5 text-[10px] text-muted">/10</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============================================================
   Build a smooth path through the points using midpoint
   smoothing. Simple and avoids the SVG <path> jagginess of a
   plain polyline.
   ============================================================ */

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const cmds: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    cmds.push(`Q ${prev.x} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`);
    cmds.push(`T ${curr.x} ${curr.y}`);
  }
  return cmds.join(' ');
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
