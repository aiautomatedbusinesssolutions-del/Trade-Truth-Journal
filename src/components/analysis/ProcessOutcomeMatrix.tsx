import type { MatrixLabel } from "@/types/analysis";

const MATRIX_CONFIG: Record<
  MatrixLabel,
  { title: string; color: string; bgColor: string; borderColor: string; position: string }
> = {
  textbook: {
    title: "Textbook Trade",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    position: "top-right",
  },
  lucky: {
    title: "Lucky — Don't Rely on This",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    position: "top-left",
  },
  right_process: {
    title: "Right Process, Bad Outcome",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    position: "bottom-right",
  },
  learning: {
    title: "Learning Opportunity",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    position: "bottom-left",
  },
};

interface ProcessOutcomeMatrixProps {
  activeLabel: MatrixLabel;
  message: string;
}

export default function ProcessOutcomeMatrix({
  activeLabel,
  message,
}: ProcessOutcomeMatrixProps) {
  const active = MATRIX_CONFIG[activeLabel];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        Process vs Outcome
      </h3>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Top row: Won */}
        <div
          className={`rounded-lg p-3 border text-center ${
            activeLabel === "lucky"
              ? `${active.bgColor} ${active.borderColor}`
              : "bg-slate-800/50 border-slate-800"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              activeLabel === "lucky" ? "text-amber-400" : "text-slate-600"
            }`}
          >
            Won + Bad Process
          </p>
          <p
            className={`text-sm mt-1 ${
              activeLabel === "lucky" ? "text-amber-300" : "text-slate-700"
            }`}
          >
            Lucky
          </p>
        </div>
        <div
          className={`rounded-lg p-3 border text-center ${
            activeLabel === "textbook"
              ? `${active.bgColor} ${active.borderColor}`
              : "bg-slate-800/50 border-slate-800"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              activeLabel === "textbook" ? "text-emerald-400" : "text-slate-600"
            }`}
          >
            Won + Good Process
          </p>
          <p
            className={`text-sm mt-1 ${
              activeLabel === "textbook" ? "text-emerald-300" : "text-slate-700"
            }`}
          >
            Textbook
          </p>
        </div>

        {/* Bottom row: Lost */}
        <div
          className={`rounded-lg p-3 border text-center ${
            activeLabel === "learning"
              ? `${active.bgColor} ${active.borderColor}`
              : "bg-slate-800/50 border-slate-800"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              activeLabel === "learning" ? "text-rose-400" : "text-slate-600"
            }`}
          >
            Lost + Bad Process
          </p>
          <p
            className={`text-sm mt-1 ${
              activeLabel === "learning" ? "text-rose-300" : "text-slate-700"
            }`}
          >
            Learning
          </p>
        </div>
        <div
          className={`rounded-lg p-3 border text-center ${
            activeLabel === "right_process"
              ? `${active.bgColor} ${active.borderColor}`
              : "bg-slate-800/50 border-slate-800"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              activeLabel === "right_process" ? "text-sky-400" : "text-slate-600"
            }`}
          >
            Lost + Good Process
          </p>
          <p
            className={`text-sm mt-1 ${
              activeLabel === "right_process" ? "text-sky-300" : "text-slate-700"
            }`}
          >
            Right Process
          </p>
        </div>
      </div>

      {/* Active label callout */}
      <div className={`${active.bgColor} border ${active.borderColor} rounded-xl p-4`}>
        <p className={`font-semibold ${active.color}`}>{active.title}</p>
        <p className="text-slate-300 text-sm mt-1">{message}</p>
      </div>
    </div>
  );
}
