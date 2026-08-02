export function PromoBanner({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-3">
      <div className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white">
        {text}
      </div>
    </div>
  );
}
