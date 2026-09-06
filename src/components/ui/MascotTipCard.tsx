import { Mascot, MascotPose } from "@/components/mascot/Mascot";
import { clsx } from "clsx";

interface MascotTipCardProps {
  message: string;
  pose?: MascotPose;
  tone?: "info" | "warning" | "success" | "encourage";
  action?: { label: string; onClick: () => void };
  actions?: { label: string; onClick: () => void }[];
  className?: string;
}

const TONE_BG: Record<string, string> = {
  info: "bg-ag-grayblue",
  warning: "bg-[#FDE4DE]",
  success: "bg-[#DCF5E9]",
  encourage: "bg-ag-yellow-soft",
};

export function MascotTipCard({
  message,
  pose = "point",
  tone = "info",
  action,
  actions,
  className,
}: MascotTipCardProps) {
  const allActions = actions ?? (action ? [action] : []);
  return (
    <div className={clsx("flex items-start gap-3 rounded-[22px] p-4", TONE_BG[tone], className)}>
      <div className="shrink-0">
        <Mascot pose={pose} size={56} />
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm font-medium leading-relaxed text-ag-text">{message}</p>
        {allActions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {allActions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="text-sm font-bold text-ag-blue active:opacity-60"
              >
                {a.label} →
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
