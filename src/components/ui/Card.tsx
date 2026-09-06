import { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, className, padded = true, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[22px] bg-white",
        padded && "p-5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
