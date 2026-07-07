import {
  ClipboardCheck,
  Scale,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import SectionTitle from "../layout/SectionTitle";
import { caseReviewProcessSteps } from "../../constants/trustSignals.js";
import { sectionAltClass } from "../../constants/themeClasses.js";

const stepIcons = [ClipboardCheck, SearchCheck, Scale, Sparkles];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className={`${sectionAltClass} mx-auto max-w-7xl px-4 md:px-6 lg:px-8`}>
      <SectionTitle
        eyebrow="How the review works"
        title="What happens after you"
        accent="start a case review?"
        subtitle="The first step is a low-pressure fit check. Sensitive documents and payment details come later, after scope and next steps are explained."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {caseReviewProcessSteps.map((step, index) => {
          const Icon = stepIcons[index] || ClipboardCheck;

          return (
            <div
              key={step.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Step {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{step.text}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-10 max-w-3xl text-base leading-7 text-slate-600" role="note">
        Sensitive documents are requested only when needed. Uploads are handled through
        authenticated flows and access is limited to authorized team members.
      </p>
    </section>
  );
}
