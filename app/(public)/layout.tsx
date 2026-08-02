export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-1 flex-col bg-ink text-white">{children}</div>;
}
