interface DecisionQualityGaugeProps {
  score: number;
  goodProcessCount: number;
  totalCount: number;
}

export default function DecisionQualityGauge({
  score,
  goodProcessCount,
  totalCount,
}: DecisionQualityGaugeProps) {
  const getColor = () => {
    if (score < 40) return { text: "text-rose-400", bg: "bg-rose-500", label: "Needs Work" };
    if (score <= 70) return { text: "text-amber-400", bg: "bg-amber-500", label: "Getting There" };
    return { text: "text-emerald-400", bg: "bg-emerald-500", label: "Strong" };
  };

  const color = getColor();

  // SVG arc gauge
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = 60;
  const circumference = Math.PI * radius; // half circle
  const filled = (clampedScore / 100) * circumference;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Decision Quality
      </h2>

      {totalCount === 0 ? (
        <p className="text-slate-400 text-sm">
          Close some trades to see your decision quality score.
        </p>
      ) : (
        <div className="flex flex-col items-center">
          {/* Gauge */}
          <div className="relative w-40 h-24">
            <svg
              viewBox="0 0 140 80"
              className="w-full h-full"
            >
              {/* Background arc */}
              <path
                d="M 10 70 A 60 60 0 0 1 130 70"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                className="text-slate-800"
              />
              {/* Filled arc */}
              <path
                d="M 10 70 A 60 60 0 0 1 130 70"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference}`}
                className={color.text}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <p className={`text-3xl font-bold ${color.text}`}>{score}</p>
            </div>
          </div>

          <p className={`font-medium mt-2 ${color.text}`}>{color.label}</p>
          <p className="text-xs text-slate-500 mt-1">
            {goodProcessCount} of {totalCount} trades followed good process
          </p>
        </div>
      )}
    </div>
  );
}
