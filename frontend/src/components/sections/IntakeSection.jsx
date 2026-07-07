import { ArrowRight } from "lucide-react";
import SectionTitle from "../layout/SectionTitle";
import Button from "../ui/Button";
import { availabilityDisclaimers } from "../../constants/jurisdictionAvailability.js";
import { cardSurfaceClass, sectionLightClass } from "../../constants/themeClasses.js";

export default function IntakeSection() {
  return (
    <section id="intake" className={`${sectionLightClass} mx-auto max-w-7xl px-4 md:px-6 lg:px-8`}>
      <div className={`${cardSurfaceClass} p-8 md:p-10`}>
        <SectionTitle
          eyebrow="Ready to continue?"
          title="Start your"
          accent="full intake"
          subtitle="After reviewing how the process works and viewing pricing, continue with the guided intake to choose a package, enter details, preview your agreement, and request consultation."
        />

        <p className="mt-8 max-w-3xl text-base leading-7 text-slate-600" role="note">
          {availabilityDisclaimers.attorneyReviewRequired}
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button to="/start">
            Start intake
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button to="/case-review" variant="secondary">
            Back to case review
          </Button>
        </div>

        <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600" role="note">
          Submitting information does not create an attorney-client relationship. Your
          matter must be reviewed and accepted by the firm before legal advice or
          representation is provided.
        </p>
      </div>
    </section>
  );
}
