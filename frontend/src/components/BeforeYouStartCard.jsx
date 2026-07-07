import { Clock, CreditCard, FileText, Scale } from "lucide-react";
import { beforeYouStartPoints } from "../constants/trustSignals.js";

const icons = {
  time: Clock,
  documents: FileText,
  pricing: CreditCard,
  attorney: Scale,
};

export default function BeforeYouStartCard() {
  return (
    <aside
      className="rounded-[1.75rem] border border-amber-400/20 bg-amber-400/5 p-6"
      aria-labelledby="before-you-start-heading"
    >
      <h2 id="before-you-start-heading" className="text-lg font-semibold text-white">
        Before you start
      </h2>
      <ul className="mt-4 space-y-4">
        {beforeYouStartPoints.map((point) => {
          const Icon = icons[point.icon] || FileText;

          return (
            <li key={point.text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-base leading-7 text-slate-200">{point.text}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
