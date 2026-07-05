"use client";

type LineChartProps = {
  data: { date: string; count: number }[];
  height?: number;
};

export function VisitsLineChart({ data, height = 200 }: LineChartProps) {
  if (data.length === 0) {
    return <p className="admin-empty">Sin datos todavía</p>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 640;
  const h = height;
  const padX = 28;
  const padY = 24;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padY + innerH - (d.count / max) * innerH;
    return { x, y, ...d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${points[0]?.x ?? padX},${padY + innerH} ${line} ${points[points.length - 1]?.x ?? padX},${padY + innerH}`;

  const labelStep = data.length > 20 ? 5 : data.length > 12 ? 3 : 2;

  return (
    <div className="admin-chart admin-chart--line">
      <svg viewBox={`0 0 ${w} ${h}`} className="admin-chart__svg" aria-hidden>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              className="admin-chart__grid-line"
            />
          );
        })}
        <polygon points={area} className="admin-chart__area" />
        <polyline points={line} className="admin-chart__line" fill="none" />
        {points.map((p, i) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r={p.count > 0 ? 4 : 2.5} className="admin-chart__dot" />
            {i % labelStep === 0 || i === points.length - 1 ? (
              <text x={p.x} y={h - 4} textAnchor="middle" className="admin-chart__axis-label">
                {p.date.slice(5).replace("-", "/")}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <ul className="admin-chart__legend">
        {points
          .filter((p) => p.count > 0)
          .slice(-5)
          .reverse()
          .map((p) => (
            <li key={p.date}>
              <strong>{p.date.slice(5).replace("-", "/")}</strong>: {p.count} visitas
            </li>
          ))}
      </ul>
    </div>
  );
}

type DonutProps = {
  items: { label: string; count: number; color: string }[];
};

export function DonutChart({ items }: DonutProps) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return <p className="admin-empty">Sin datos todavía</p>;

  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="admin-chart admin-chart--donut">
      <svg viewBox="0 0 140 140" className="admin-chart__donut-svg" aria-hidden>
        <circle cx="70" cy="70" r={r} className="admin-chart__donut-bg" />
        {items.map((item) => {
          const frac = item.count / total;
          const dash = frac * c;
          const el = (
            <circle
              key={item.label}
              cx="70"
              cy="70"
              r={r}
              className="admin-chart__donut-segment"
              stroke={item.color}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" className="admin-chart__donut-total">
          {total}
        </text>
        <text x="70" y="82" textAnchor="middle" className="admin-chart__donut-sub">
          visitas
        </text>
      </svg>
      <ul className="admin-chart__donut-legend">
        {items.map((item) => (
          <li key={item.label}>
            <span className="admin-chart__swatch" style={{ background: item.color }} />
            {item.label} · {item.count} ({Math.round((item.count / total) * 100)}%)
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HorizontalBarChart({
  items,
  limit = 10,
}: {
  items: { key: string; count: number }[];
  limit?: number;
}) {
  if (items.length === 0) return <p className="admin-empty">Sin datos todavía</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="admin-hbars">
      {items.slice(0, limit).map((item) => (
        <div key={item.key} className="admin-hbar">
          <span className="admin-hbar__label" title={item.key}>
            {item.key}
          </span>
          <div className="admin-hbar__track">
            <div
              className="admin-hbar__fill"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
            <span className="admin-hbar__value">{item.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniBarChart({
  items,
}: {
  items: { key: string; count: number }[];
}) {
  if (items.length === 0) return <p className="admin-empty">Sin datos</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="admin-minibars">
      {items.map((item) => (
        <div key={item.key} className="admin-minibar">
          <div
            className="admin-minibar__col"
            style={{ height: `${Math.max(8, (item.count / max) * 100)}%` }}
            title={`${item.key}: ${item.count}`}
          />
          <span className="admin-minibar__label">{item.key}</span>
        </div>
      ))}
    </div>
  );
}
