export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}