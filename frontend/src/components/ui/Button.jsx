import { Link } from "react-router-dom";

function getVariantClasses(variant) {
  if (variant === "secondary") {
    return "border border-white/15 bg-white/5 text-white hover:border-amber-400/40 hover:text-amber-300";
  }

  return "bg-amber-400 text-slate-950 hover:bg-amber-300";
}

export default function Button({
  children,
  href,
  to,
  type = "button",
  onClick,
  variant = "primary",
  className = "",
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold transition ${getVariantClasses(
    variant
  )} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
