/**
 * Circular consistency ring — the hero element on Home, modeled on Whoop's
 * recovery ring. Shows the share of the last 7 days the user checked in, filling
 * in volt as it completes, with the percentage large in the center (Geist Mono).
 * Driven entirely by Stack's own data — no biometrics.
 */
export function ConsistencyRing({
  value,
  percent,
  label,
  sublabel,
}: {
  value: number; // 0..1
  percent: number; // 0..100, shown in the center
  label: string;
  sublabel?: string;
}) {
  const SIZE = 184;
  const STROKE = 16;
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const offset = c * (1 - v);

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          className="text-surface-2"
          stroke="currentColor"
        />
        {/* Progress */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="text-volt"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono nums leading-none tracking-tight">
          <span className="text-[44px] font-bold text-text">{percent}</span>
          <span className="text-h2 text-text-muted">%</span>
        </span>
        <span className="mt-1 max-w-[7rem] text-center text-caption text-text-dim">
          {label}
        </span>
        {sublabel && (
          <span className="mt-0.5 font-mono text-caption text-volt">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
