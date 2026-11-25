import { cn } from "@/components/ui/cn";

export function Field({
  label,
  error,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          "h-11 w-full rounded-lg border bg-subtle px-3 text-[15px] outline-none transition placeholder:text-muted/70",
          "focus:border-accent focus:bg-bg focus:ring-2 focus:ring-accent/25",
          error ? "border-like" : "border-line",
        )}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-like">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
