import { useMemo } from "react";
import {
  AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function TrafficGraph({ points = [], height = 120 }) {
  const data = useMemo(() => {
    return points.map(p => ({
      t: p.t,
      down: Number(p.down || 0),
      up: Number(p.up || 0),
    }));
  }, [points]);

  const fmt = (v) => `${Number(v || 0).toFixed(0)} Mbps`;

  return (
    <div style={{
      height,
      minHeight: height,
      width: "100%",
      minWidth: 0,
      marginTop: 8,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.10)",
      background: "rgba(255,255,255,.03)",
      overflow: "hidden"
    }}>
      
        <AreaChart width="100%" height={height} data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="downFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,255,200,.35)" />
              <stop offset="100%" stopColor="rgba(0,255,200,0)" />
            </linearGradient>
          </defs>

          <XAxis dataKey="t" hide />
          <YAxis hide domain={["auto", "auto"]} />

          <Tooltip
            formatter={(value, name) => [fmt(value), name === "down" ? "Download" : "Upload"]}
            labelFormatter={() => ""}
            contentStyle={{
              background: "rgba(10,12,18,.92)",
              border: "1px solid rgba(255,255,255,.16)",
              borderRadius: 12,
              color: "rgba(255,255,255,.92)"
            }}
          />

          <Area
            type="monotone"
            dataKey="down"
            stroke="rgba(0,255,200,.95)"
            fill="url(#downFill)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          <Line
            type="monotone"
            dataKey="up"
            stroke="rgba(120,160,255,.95)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      
    </div>
  );
}











