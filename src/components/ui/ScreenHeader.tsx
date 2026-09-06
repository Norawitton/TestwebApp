"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export function ScreenHeader({
  title,
  onBack,
  right,
  transparent = false,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
}) {
  const router = useRouter();
  return (
    <div
      className={`sticky top-0 z-30 flex h-14 items-center justify-between px-4 ${
        transparent ? "" : "bg-ag-offwhite/95 backdrop-blur"
      }`}
    >
      <button
        onClick={() => (onBack ? onBack() : router.back())}
        aria-label="ย้อนกลับ"
        className="flex h-10 w-10 items-center justify-center rounded-full active:bg-ag-grayblue"
      >
        <ChevronLeft size={24} color="#102A3A" />
      </button>
      <h1 className="text-base font-bold text-ag-text">{title}</h1>
      <div className="flex h-10 w-10 items-center justify-center">{right}</div>
    </div>
  );
}
