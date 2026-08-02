import { cn } from "@/lib/utils/cn";

type Tone = "brand" | "accent" | "ink" | "success" | "muted";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand text-white",
  accent: "bg-accent-orange text-white",
  ink: "bg-ink text-white",
  success: "bg-accent-green text-white",
  muted: "bg-ink/10 text-ink",
};

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
