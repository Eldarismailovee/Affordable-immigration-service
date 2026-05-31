export default function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3 leading-8">{children}</div>
    </section>
  );
}
