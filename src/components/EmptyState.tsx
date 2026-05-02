export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel grid min-h-40 place-items-center px-5 py-8 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-xs font-black text-amber-600">
          空
        </div>
        <p className="text-base font-black text-slate-800">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
