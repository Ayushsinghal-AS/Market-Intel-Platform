export default function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-black/5 dark:bg-white/10 rounded ${className}`} />;
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChartBlock({ height = "h-80" }) {
  return <Skeleton className={`w-full ${height}`} />;
}

export function SkeletonTableRows({ rows = 6, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
