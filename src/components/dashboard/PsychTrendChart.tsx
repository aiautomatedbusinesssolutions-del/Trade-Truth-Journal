"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TradePoint {
  date: string;
  mood: number;
  energy: number;
  confidence: number;
}

interface PsychTrendChartProps {
  data: TradePoint[];
}

export default function PsychTrendChart({ data }: PsychTrendChartProps) {
  if (data.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Psychology Trends
        </h2>
        <p className="text-slate-400 text-sm">
          Close at least 2 trades to see your psychology trends over time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Psychology Trends
      </h2>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#475569"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              width={25}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              name="Mood"
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              name="Energy"
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              name="Confidence"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-sky-400 rounded" />
          <span className="text-xs text-slate-500">Mood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-violet-400 rounded" />
          <span className="text-xs text-slate-500">Energy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-emerald-400 rounded" />
          <span className="text-xs text-slate-500">Confidence</span>
        </div>
      </div>
    </div>
  );
}
