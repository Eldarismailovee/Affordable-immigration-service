import { heroTrustSignals } from "../constants/trustSignals.js";

export default function HeroTrustBadges() {
  return (
    <ul
      className="mt-8 flex flex-wrap gap-2"
      aria-label="Trust and service highlights"
    >
      {heroTrustSignals.map((signal) => (
        <li key={signal.label}>
          <span
            className="inline-flex rounded-full border border-amber-400/25 bg-amber-400/10 px-3.5 py-2 text-sm font-medium text-amber-100"
            title={signal.description}
          >
            {signal.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
