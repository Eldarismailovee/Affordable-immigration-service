import { ChevronDown } from "lucide-react";

export default function FaqItem({ id, question, answer, open, onClick }) {
  const panelId = `${id}-panel`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h3 className="m-0">
        <button
          type="button"
          id={id}
          onClick={onClick}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="text-base font-medium text-slate-950 md:text-lg">{question}</span>
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-blue-900 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={id}
          className="border-t border-slate-200 px-5 py-4 text-base leading-7 text-slate-600"
        >
          {answer}
        </div>
      ) : null}
    </div>
  );
}
