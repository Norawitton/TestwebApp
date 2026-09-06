"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "navy" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ag-blue text-white active:bg-[#0f6fd1] shadow-[0_6px_16px_rgba(22,137,245,0.28)]",
  navy: "bg-ag-navy text-white active:bg-[#001a2e]",
  secondary: "bg-ag-yellow text-ag-navy active:bg-[#f5c530]",
  ghost: "bg-ag-grayblue text-ag-text active:bg-[#dbe7f0]",
  danger: "bg-ag-coral text-white active:bg-[#df5b4e]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-transform active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100",
        size === "lg" ? "h-14 px-6 text-base" : "h-12 px-5 text-sm",
        fullWidth && "w-full",
        VARIANT_CLASSES[variant],
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
