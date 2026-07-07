export default function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <div className="readable-prose mt-3 space-y-3">{children}</div>
    </section>
  );
}
