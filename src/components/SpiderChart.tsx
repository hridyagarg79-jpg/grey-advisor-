"use client";

import { useEffect, useRef } from "react";

interface SpiderChartProps {
  scores: Record<string, number>; // e.g. { Walkability: 8, Transit: 7, Schools: 9, Safety: 6 }
  maxValue?: number;
  size?: number;
  color?: string;
}

export default function SpiderChart({
  scores,
  maxValue = 10,
  size = 160,
  color = "#B45309",
}: SpiderChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const axes = Object.keys(scores);
  const values = axes.map((k) => scores[k]);
  const n = axes.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const levels = 4;

  // Angle for each axis (start at top = -π/2)
  const angleFor = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;

  // Point for a given radius ratio and axis
  const pt = (ratio: number, i: number): [number, number] => {
    const a = angleFor(i);
    return [cx + radius * ratio * Math.cos(a), cy + radius * ratio * Math.sin(a)];
  };

  // Grid levels (concentric polygons)
  const levelPolygons = Array.from({ length: levels }, (_, l) => {
    const ratio = (l + 1) / levels;
    return axes.map((_, i) => pt(ratio, i)).map((p) => p.join(",")).join(" ");
  });

  // Data polygon
  const dataPoints = values.map((v, i) => pt(Math.min(v, maxValue) / maxValue, i));
  const dataPolygon = dataPoints.map((p) => p.join(",")).join(" ");

  // Label positions (slightly beyond radius)
  const labelOffset = 1.28;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
    >
      {/* Grid polygons */}
      {levelPolygons.map((pts, l) => (
        <polygon
          key={l}
          points={pts}
          fill="none"
          stroke="#E5E0D8"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const [x, y] = pt(1, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#E5E0D8"
            strokeWidth="1"
          />
        );
      })}

      {/* Data fill polygon */}
      <polygon
        points={dataPolygon}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 500,
          strokeDashoffset: 500,
          animation: "spider-draw 0.8s ease forwards",
        }}
      />

      {/* Data points (dots) */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={color} />
      ))}

      {/* Axis labels */}
      {axes.map((axis, i) => {
        const [x, y] = pt(labelOffset, i);
        const anchor =
          x < cx - 4 ? "end" : x > cx + 4 ? "start" : "middle";
        const dy = y < cy - 4 ? "-0.4em" : y > cy + 4 ? "1em" : "0.35em";
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dy={dy}
            fontSize={9}
            fontWeight="600"
            fill="#78716C"
            fontFamily="system-ui"
          >
            {axis}
          </text>
        );
      })}

      {/* Score values at data points */}
      {dataPoints.map((p, i) => (
        <text
          key={i}
          x={p[0]}
          y={p[1] - 6}
          textAnchor="middle"
          fontSize={8}
          fontWeight="700"
          fill={color}
          fontFamily="system-ui"
        >
          {values[i]}
        </text>
      ))}

      <style>{`
        @keyframes spider-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}
