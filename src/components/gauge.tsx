import { cn } from "@/lib/utils";

export function Gauge({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className={cn("relative size-36", className)}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-border" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className="stroke-primary"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-4xl tabular-nums text-fg leading-none">{pct}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted mt-1">вероятность</div>
        </div>
      </div>
    </div>
  );
}
