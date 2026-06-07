import React from "react";
import { riskColor, riskLabel } from "../utils/helpers";

export default function RiskGauge({ score = 0, size = 180 }) {
  const radius = 70;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const circumference = Math.PI * radius; // half circle
  const pct = Math.min(score, 100) / 100;
  const offset = circumference * (1 - pct);
  const color = riskColor(score);
  const label = riskLabel(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="risk-gauge-path"
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
        {/* Score */}
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="32" fontWeight="700" fontFamily="DM Sans, sans-serif">
          {score}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle"
          fill="rgba(255,255,255,0.4)" fontSize="12" fontFamily="DM Sans, sans-serif">
          / 100
        </text>
      </svg>
      <span className="label-tag mt-1" style={{ background: `${color}22`, color }}>
        {label}
      </span>
    </div>
  );
}
