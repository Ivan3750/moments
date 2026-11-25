import { cn } from "@/components/ui/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold transition",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "h-8 px-3 text-sm",
    size === "md" && "h-9 px-4 text-sm",
    size === "lg" && "h-11 px-5 text-base",
    variant === "primary" && "bg-accent text-accent-fg hover:brightness-110",
    variant === "secondary" && "bg-subtle text-fg hover:brightness-95 dark:hover:brightness-125",
    variant === "ghost" && "text-fg hover:bg-subtle",
    variant === "danger" && "bg-like text-white hover:brightness-110",
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
