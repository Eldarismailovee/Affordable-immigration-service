import SectionTitle from "../layout/SectionTitle";
import DocumentSecurityTrustBlock from "../DocumentSecurityTrustBlock";
import { afterSubmitSteps, whyTrustCards } from "../../constants/trustSignals.js";
import { cardInsetClass, sectionLightClass } from "../../constants/themeClasses.js";

export default function WhyTrustUsSection() {
  return (
    <section id="why-trust-us" className={sectionLightClass}>
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Trust & process"
          title="Why families trust us"
          accent="with immigration documents"
          subtitle="This is not a generic lead form. Your intake is reviewed before the firm accepts representation or provides legal advice."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {whyTrustCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{card.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-2xl font-semibold text-slate-950">
            What happens after you start a case review
          </h3>
          <ol className="mt-6 space-y-4">
            {afterSubmitSteps.map((step, index) => (
              <li
                key={step}
                className={`flex items-start gap-4 p-4 text-base leading-7 text-slate-700 ${cardInsetClass}`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-sm font-semibold text-blue-900"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12">
          <DocumentSecurityTrustBlock />
        </div>
      </div>
    </section>
  );
}
