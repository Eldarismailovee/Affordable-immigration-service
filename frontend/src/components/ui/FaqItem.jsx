import { ChevronDown } from "lucide-react";

export default function FaqItem({ question, answer, open, onClick }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-base font-medium text-white md:text-lg">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-amber-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-slate-300 md:text-base">
          {answer}
        </div>
      ) : null}
    </div>
  );
}