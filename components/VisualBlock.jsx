"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

const VISUAL_BLOCK = /\[\[VISUAL\]\]([\s\S]*?)\[\[\/VISUAL\]\]/g;

// Splits raw message text into an array of { type: "text" | "visual", content }
// so the caller can render plain text and visuals inline, in order.
export function splitVisuals(rawText) {
  const parts = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(VISUAL_BLOCK);
  while ((match = re.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: rawText.slice(lastIndex, match.index) });
    }
    try {
      const data = JSON.parse(match[1].trim());
      parts.push({ type: "visual", content: data });
    } catch {
      // Malformed JSON from the model — show it as text rather than crash.
      parts.push({ type: "text", content: match[0] });
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < rawText.length) {
    parts.push({ type: "text", content: rawText.slice(lastIndex) });
  }
  return parts;
}

const CHART_COLORS = ["#4C9A6A", "#F2C14E", "#B5482F", "#3E6E92", "#8A5FBF", "#D97B4F"];

export default function VisualBlock({ data }) {
  if (!data || !data.type) return null;

  if (data.type === "table") {
    return (
      <div className="visual-block">
        {data.title && <div className="visual-title">{data.title}</div>}
        <table className="data-table">
          <thead>
            <tr>
              {(data.headers || []).map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.rows || []).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.type === "shape") {
    return (
      <div className="visual-block">
        {data.title && <div className="visual-title">{data.title}</div>}
        <ShapeSVG shape={data.shape} labels={data.shapeLabels || {}} />
      </div>
    );
  }

  if (["bar", "line", "pie"].includes(data.type)) {
    const chartData = {
      labels: data.labels || [],
      datasets: (data.datasets || []).map((ds, i) => ({
        label: ds.label || `Series ${i + 1}`,
        data: ds.data || [],
        backgroundColor:
          data.type === "pie"
            ? CHART_COLORS
            : CHART_COLORS[i % CHART_COLORS.length] + "cc",
        borderColor: CHART_COLORS[i % CHART_COLORS.length],
        borderWidth: 2,
      })),
    };
    const options = {
      responsive: true,
      plugins: {
        legend: { display: (data.datasets || []).length > 1 || data.type === "pie" },
        title: { display: false },
      },
    };
    return (
      <div className="visual-block">
        {data.title && <div className="visual-title">{data.title}</div>}
        <div style={{ maxWidth: 480 }}>
          {data.type === "bar" && <Bar data={chartData} options={options} />}
          {data.type === "line" && <Line data={chartData} options={options} />}
          {data.type === "pie" && <Pie data={chartData} options={options} />}
        </div>
      </div>
    );
  }

  return null;
}

function ShapeSVG({ shape, labels }) {
  const common = { viewBox: "0 0 220 180", width: 220, height: 180 };
  const stroke = "#1F3A2E";
  const fill = "#F2C14E33";

  if (shape === "right-triangle") {
    return (
      <svg {...common}>
        <polygon points="20,160 20,20 200,160" fill={fill} stroke={stroke} strokeWidth="3" />
        <rect x="20" y="140" width="16" height="16" fill="none" stroke={stroke} strokeWidth="2" />
        {labels.a && <text x="4" y="95" fontSize="13">{labels.a}</text>}
        {labels.b && <text x="90" y="175" fontSize="13">{labels.b}</text>}
        {labels.c && <text x="95" y="80" fontSize="13">{labels.c}</text>}
      </svg>
    );
  }
  if (shape === "triangle") {
    return (
      <svg {...common}>
        <polygon points="110,20 20,160 200,160" fill={fill} stroke={stroke} strokeWidth="3" />
        {labels.a && <text x="55" y="95" fontSize="13">{labels.a}</text>}
        {labels.b && <text x="150" y="95" fontSize="13">{labels.b}</text>}
        {labels.c && <text x="95" y="175" fontSize="13">{labels.c}</text>}
      </svg>
    );
  }
  if (shape === "circle") {
    return (
      <svg {...common}>
        <circle cx="110" cy="90" r="70" fill={fill} stroke={stroke} strokeWidth="3" />
        <line x1="110" y1="90" x2="180" y2="90" stroke={stroke} strokeWidth="2" />
        {labels.radius && <text x="120" y="85" fontSize="13">{labels.radius}</text>}
      </svg>
    );
  }
  if (shape === "rectangle") {
    return (
      <svg {...common}>
        <rect x="30" y="40" width="160" height="100" fill={fill} stroke={stroke} strokeWidth="3" />
        {labels.width && <text x="90" y="35" fontSize="13">{labels.width}</text>}
        {labels.height && <text x="200" y="95" fontSize="13">{labels.height}</text>}
      </svg>
    );
  }
  return null;
}
