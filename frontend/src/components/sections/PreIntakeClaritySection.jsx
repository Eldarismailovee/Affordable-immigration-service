import { CreditCard, FileText } from "lucide-react";
import { preIntakeClarityCopy } from "../../constants/trustSignals.js";
import { sectionAltClass } from "../../constants/themeClasses.js";

export default function PreIntakeClaritySection() {
  return (
    <section
      id="pre-intake-clarity"
      className={sectionAltClass}
      aria-labelledby="pre-intake-clarity-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <h2 id="pre-intake-clarity-heading" className="sr-only">
          What you need before starting
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  {preIntakeClarityCopy.documents.title}
                </h3>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  {preIntakeClarityCopy.documents.text}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  {preIntakeClarityCopy.payment.title}
                </h3>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  {preIntakeClarityCopy.payment.text}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
