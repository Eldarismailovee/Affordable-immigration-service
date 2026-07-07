export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[2rem] border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
