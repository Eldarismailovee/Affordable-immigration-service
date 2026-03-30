import { Check } from "lucide-react";
import SectionTitle from "../layout/SectionTitle";
import services from "../../data/services";

export default function ServicesSection() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <SectionTitle
            eyebrow="Family Petitions / Services"
            title="Family-based"
            accent="immigration support"
            subtitle="Built for clients who want a simple, guided way to start family petition matters online."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div className="mt-0.5 rounded-full bg-amber-400/15 p-1.5 text-amber-400">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div className="text-sm leading-6 text-slate-200">{service}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="grid h-full gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-semibold text-white">
                What the website handles
              </h3>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                <p>Clear service pricing and package selection.</p>
                <p>Client onboarding with intake questions and document checklist.</p>
                <p>Auto-populated fee agreement preview based on the selected package.</p>
                <p>Payment-information collection for manual office processing.</p>
                <p>Consultation scheduling and contact capture in one flow.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="overflow-hidden rounded-[1.75rem] border border-white/10">
                <img
                  src="/images/family-immigration.jpg"
                  alt="Family immigration support"
                  className="h-56 w-full object-cover"
                />
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  Integration area
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  Docketwise block
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Reserve this section for intake launch, portal access,
                  engagement-letter logic, and document-sharing entry points.
                </p>
                <div className="mt-6 rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-200">
                  Intake form, engagement letter, and client portal buttons can be
                  connected here.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}