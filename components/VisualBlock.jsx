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

  if (data.type === "diagram") {
    return (
      <div className="visual-block">
        {data.title && <div className="visual-title">{data.title}</div>}
        <DiagramSVG nodes={data.nodes || []} edges={data.edges || []} />
      </div>
    );
  }

  if (data.type === "function-graph") {
    const chartData = {
      datasets: [
        {
          label: data.title || "f(x)",
          data: (data.points || []).map((p) => ({ x: p.x, y: p.y })),
          borderColor: CHART_COLORS[0],
          backgroundColor: CHART_COLORS[0] + "33",
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
    const options = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { type: "linear", title: { display: !!data.xLabel, text: data.xLabel || "" } },
        y: { title: { display: !!data.yLabel, text: data.yLabel || "" } },
      },
    };
    return (
      <div className="visual-block">
        {data.title && <div className="visual-title">{data.title}</div>}
        <div style={{ maxWidth: 480 }}>
          <Line data={chartData} options={options} />
        </div>
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

function wrapLabel(label, maxChars = 14) {
  if (!label || label.length <= maxChars) return [label];
  const words = label.split(" ");
  if (words.length === 1) return [label];
  let line1 = "";
  let i = 0;
  while (i < words.length && (line1 + words[i]).length <= maxChars) {
    line1 += (line1 ? " " : "") + words[i];
    i++;
  }
  const line2 = words.slice(i).join(" ");
  return line2 ? [line1, line2] : [line1];
}

function DiagramSVG({ nodes, edges }) {
  if (!nodes || nodes.length === 0) return null;
  const boxW = 130;
  const boxH = 56;
  const gapX = 46;
  const gapY = 64;
  const perRow = Math.min(nodes.length, 4) || 1;

  const positions = {};
  nodes.forEach((n, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    positions[n.id] = {
      x: col * (boxW + gapX) + boxW / 2 + 10,
      y: row * (boxH + gapY) + boxH / 2 + 10,
    };
  });

  const rows = Math.ceil(nodes.length / perRow);
  const width = perRow * (boxW + gapX) - gapX + 20;
  const height = rows * (boxH + gapY) - gapY + 20;

  const stroke = "#1F3A2E";
  const fill = "#F2C14E33";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: 560, height: "auto" }}>
      <defs>
        <marker id="diagram-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={stroke} />
        </marker>
      </defs>
      {(edges || []).map((e, i) => {
        const from = positions[e.from];
        const to = positions[e.to];
        if (!from || !to) return null;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return (
          <g key={i}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={stroke}
              strokeWidth="2"
              markerEnd="url(#diagram-arrow)"
            />
            {e.label && (
              <text x={midX} y={midY - 6} fontSize="11" textAnchor="middle" fill={stroke}>
                {e.label}
              </text>
            )}
          </g>
        );
      })}
      {nodes.map((n) => {
        const pos = positions[n.id];
        const lines = wrapLabel(n.label);
        return (
          <g key={n.id}>
            <rect
              x={pos.x - boxW / 2}
              y={pos.y - boxH / 2}
              width={boxW}
              height={boxH}
              rx="10"
              fill={fill}
              stroke={stroke}
              strokeWidth="2"
            />
            {lines.map((line, li) => (
              <text
                key={li}
                x={pos.x}
                y={pos.y + (li - (lines.length - 1) / 2) * 15 + 4}
                fontSize="13"
                textAnchor="middle"
                fill={stroke}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
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
