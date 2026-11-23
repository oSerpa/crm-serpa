export default function PageHeader({ titulo, sub, children }: { titulo: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="mr-auto">
        <h1 className="page-title">{titulo}</h1>
        {sub && <p className="page-sub mt-1">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
