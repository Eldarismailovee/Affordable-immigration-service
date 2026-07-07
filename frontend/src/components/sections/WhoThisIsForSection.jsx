import { ArrowRight } from "lucide-react";
import SectionTitle from "../layout/SectionTitle";
import Button from "../ui/Button";
import {
  familyMatterTypes,
  whoThisIsForCopy,
} from "../../constants/familyMatterTypes.js";
import { unavailableMatters } from "../../constants/jurisdictionAvailability.js";
import { cardInsetClass, sectionLightClass } from "../../constants/themeClasses.js";

export default function WhoThisIsForSection() {
  return (
    <section
      id="who-this-is-for"
      className={sectionLightClass}
      aria-labelledby="who-this-is-for-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionTitle
          eyebrow={whoThisIsForCopy.eyebrow}
          title={whoThisIsForCopy.title}
          accent={whoThisIsForCopy.accent}
          subtitle={whoThisIsForCopy.subtitle}
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {familyMatterTypes.map((matter) => (
            <article
              key={matter.key}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-950">{matter.title}</h3>
              <p className="mt-2 text-base leading-7 text-slate-600">{matter.description}</p>
            </article>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-base leading-7 text-slate-600" role="note">
          {whoThisIsForCopy.disclaimer}
        </p>

        <p className="mt-3 text-sm font-medium text-blue-900">
          {whoThisIsForCopy.subjectToReview}
        </p>

        {unavailableMatters.length > 0 ? (
          <div className={`mt-10 ${cardInsetClass} p-6`}>
            <h3 className="text-lg font-semibold text-slate-950">
              {whoThisIsForCopy.notAvailableHeading}
            </h3>
            <p className="mt-2 text-base leading-7 text-slate-600">
              {whoThisIsForCopy.notAvailableIntro}
            </p>
            <ul className="mt-4 space-y-2 text-base leading-7 text-slate-600">
              {unavailableMatters.map((matter) => (
                <li key={matter.key}>
                  <span className="font-medium text-slate-900">{matter.label}</span>
                  {" — "}
                  {matter.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {whoThisIsForCopy.notSureHelper}
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Button to="/case-review">
              Start case review
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button href="#pricing" variant="secondary">
              View pricing
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
