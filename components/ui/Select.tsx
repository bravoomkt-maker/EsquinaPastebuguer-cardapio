import { cn } from "@/lib/utils/cn";
import { useId, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({
  label,
  error,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "h-11 rounded-lg border border-ink/15 bg-white px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand",
          error && "border-brand",
          className
        )}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-brand">{error}</span>}
    </div>
  );
}
