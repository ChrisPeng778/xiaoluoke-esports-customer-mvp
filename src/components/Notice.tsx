export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-rock-gold/30 bg-amber-50 px-3 py-3 text-sm font-medium leading-6 text-amber-800">
      {children}
    </div>
  );
}
