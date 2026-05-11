import { useMemo } from "react";

type Point = { x: number; y: number; label?: string };

export function LineChart({
  points,
  height = 160,
  width = 320,
  refBands,
  yLabel,
  className,
  color = "var(--color-primary)",
}: {
  points: Point[];
  height?: number;
  width?: number;
  refBands?: { min?: number; max?: number; color: string; label?: string }[];
  yLabel?: string;
  className?: string;
  color?: string;
}) {
  const padding = { top: 12, right: 12, bottom: 24, left: 36 };

  const { path, dots, yTicks, xTicks, scaleX, scaleY } = useMemo(() => {
    if (points.length === 0) {
      return { path: "", dots: [], yTicks: [], xTicks: [], scaleX: () => 0, scaleY: () => 0 };
    }
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    if (refBands) {
      refBands.forEach((b) => {
        if (b.min !== undefined) minY = Math.min(minY, b.min);
        if (b.max !== undefined) maxY = Math.max(maxY, b.max);
      });
    }
    const padY = Math.max((maxY - minY) * 0.15, 0.5);
    minY -= padY;
    maxY += padY;
    const w = width - padding.left - padding.right;
    const h = height - padding.top - padding.bottom;
    const sx = (x: number) =>
      maxX === minX ? padding.left + w / 2 : padding.left + ((x - minX) / (maxX - minX)) * w;
    const sy = (y: number) =>
      maxY === minY ? padding.top + h / 2 : padding.top + h - ((y - minY) / (maxY - minY)) * h;

    const d = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`)
      .join(" ");

    const yT = [minY, (minY + maxY) / 2, maxY].map((v) => ({ v, y: sy(v) }));
    const xT =
      points.length <= 1
        ? points.map((p) => ({ label: p.label ?? "", x: sx(p.x) }))
        : [points[0], points[points.length - 1]].map((p) => ({ label: p.label ?? "", x: sx(p.x) }));

    return {
      path: d,
      dots: points.map((p) => ({ cx: sx(p.x), cy: sy(p.y), v: p.y, label: p.label })),
      yTicks: yT,
      xTicks: xT,
      scaleX: sx,
      scaleY: sy,
    };
  }, [points, width, height, refBands]);

  if (points.length === 0) {
    return (
      <div className={className} style={{ height }}>
        <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Pas assez de données
        </p>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ width: "100%", height }}
      role="img"
      aria-label={yLabel ?? "graphique"}
    >
      {refBands?.map((b, i) => {
        if (b.min === undefined || b.max === undefined) return null;
        const y1 = scaleY(b.max);
        const y2 = scaleY(b.min);
        return (
          <rect
            key={i}
            x={padding.left}
            y={Math.min(y1, y2)}
            width={width - padding.left - padding.right}
            height={Math.abs(y2 - y1)}
            fill={b.color}
            opacity={0.12}
          />
        );
      })}
      {/* y axis */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={t.y}
            y2={t.y}
            stroke="var(--color-border)"
            strokeDasharray="3 3"
          />
          <text x={4} y={t.y + 3} fontSize={10} fill="var(--color-muted-foreground)">
            {t.v.toFixed(1)}
          </text>
        </g>
      ))}
      {/* x labels */}
      {xTicks.map((t, i) => (
        <text
          key={i}
          x={t.x}
          y={height - 6}
          fontSize={10}
          fill="var(--color-muted-foreground)"
          textAnchor={i === 0 ? "start" : "end"}
        >
          {t.label}
        </text>
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={3.5} fill={color} />
      ))}
    </svg>
  );
}

export function Sparkline({
  values,
  refMin,
  refMax,
  height = 36,
  width = 100,
  color = "var(--color-primary)",
}: {
  values: number[];
  refMin?: number;
  refMax?: number;
  height?: number;
  width?: number;
  color?: string;
}) {
  if (values.length < 2) {
    return <div style={{ width, height }} className="text-xs text-muted-foreground">—</div>;
  }
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  let scaleMin = Math.min(dataMin, refMin ?? dataMin);
  let scaleMax = Math.max(dataMax, refMax ?? dataMax);
  const padY = Math.max((scaleMax - scaleMin) * 0.12, 0.5);
  scaleMin -= padY;
  scaleMax += padY;
  const range = scaleMax - scaleMin;
  const sy = (v: number) => height - ((v - scaleMin) / range) * height;
  const step = width / (values.length - 1);
  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${sy(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      {refMin !== undefined && refMax !== undefined && (
        <rect
          x={0} y={sy(refMax)}
          width={width} height={sy(refMin) - sy(refMax)}
          fill="var(--color-accent)" opacity={0.12}
        />
      )}
      {refMax !== undefined && (
        <line x1={0} x2={width} y1={sy(refMax)} y2={sy(refMax)}
          stroke="var(--color-accent)" strokeWidth={0.8} strokeDasharray="3 2" opacity={0.7} />
      )}
      {refMin !== undefined && (
        <line x1={0} x2={width} y1={sy(refMin)} y2={sy(refMin)}
          stroke="var(--color-accent)" strokeWidth={0.8} strokeDasharray="3 2" opacity={0.7} />
      )}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}
