import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/ui";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export const buttonStyles = ({
  variant = "primary",
  size = "md",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-eco-200",
    size === "sm" && "min-h-9 px-3 text-sm",
    size === "md" && "min-h-11 px-4 text-sm",
    size === "lg" && "min-h-12 px-5 text-base",
    variant === "primary" && "bg-eco-700 text-white shadow-soft hover:bg-eco-950",
    variant === "secondary" && "border border-eco-200 bg-white text-eco-950 hover:border-eco-500 hover:bg-eco-100",
    variant === "ghost" && "text-eco-700 hover:bg-eco-100",
    variant === "danger" && "bg-[#D6604D] text-white hover:bg-[#B94534]",
    className
  );

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function Button({ variant, size, icon, className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonStyles({ variant, size, className })} {...props}>
      {icon}
      {children}
    </button>
  );
}
