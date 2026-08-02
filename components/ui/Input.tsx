import { cn } from "@/lib/utils/cn";
import { useId, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-11 rounded-lg border border-ink/15 bg-white px-3.5 text-sm text-ink placeholder:text-ink/40 outline-none transition-colors focus:border-brand",
          error && "border-brand",
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="text-xs text-brand">{error}</span>}
    </div>
  );
}
