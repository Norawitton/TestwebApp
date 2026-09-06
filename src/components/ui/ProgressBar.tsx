export function ProgressBar({
  percent,
  height = 12,
  trackColor = "#EAF1F7",
  showThresholds = false,
}: {
  percent: number;
  height?: number;
  trackColor?: string;
  showThresholds?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color = clamped >= 100 ? "#F36B5F" : clamped >= 90 ? "#E78132" : clamped >= 70 ? "#FFD64F" : "#20B978";

  return (
    <div className="relative w-full rounded-full" style={{ height, backgroundColor: trackColor }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
      {showThresholds && (
        <>
          <div className="absolute top-0 h-full w-px bg-white/60" style={{ left: "70%" }} />
          <div className="absolute top-0 h-full w-px bg-white/60" style={{ left: "90%" }} />
        </>
      )}
    </div>
  );
}
