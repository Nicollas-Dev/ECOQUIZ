import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/ui";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 text-eco-950", compact && "gap-1.5")}>
      <span className="flex size-9 items-center justify-center rounded-lg bg-eco-700 text-white">
        <Leaf size={20} strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span className={cn("font-black tracking-normal", compact ? "text-lg" : "text-xl")}>ECOQUIZ</span>
    </Link>
  );
}
