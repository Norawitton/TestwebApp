import { CategoryId } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { ICON_MAP } from "@/lib/iconMap";

export function CategoryIcon({
  category,
  size = 44,
  iconSize = 20,
}: {
  category: CategoryId;
  size?: number;
  iconSize?: number;
}) {
  const cat = CATEGORIES[category];
  const Icon = ICON_MAP[cat.icon] ?? ICON_MAP.MoreHorizontal;
  const isLight = cat.color === "#EAF1F7" || cat.color === "#FFD64F";
  const iconColor =
    cat.color === "#EAF1F7" ? "#71818E" : cat.color === "#FFD64F" ? "#00233D" : cat.color;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size, background: isLight ? cat.color : `${cat.color}1F` }}
    >
      <Icon size={iconSize} color={iconColor} strokeWidth={2.2} />
    </div>
  );
}
