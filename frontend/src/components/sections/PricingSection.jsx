import { ArrowRight, Check } from "lucide-react";
import SectionTitle from "../layout/SectionTitle";
import pricing from "../../data/pricing";
import Card from "../ui/Card";
import Button from "../ui/Button";

function renderPrice(item) {
  if (item.flatFee) return `+$${item.flatFee}`;
  return `$${item.minPrice}–$${item.maxPrice}`;
}

export default function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Pricing / Packages"
        title="Transparent"
        accent="flat-fee pricing"
        subtitle="Choose the package that matches your level of support. Each additional I-130 is billed separately, and expedited internal processing is available as an add-on."
      />

      <div className="mt-12 grid gap-6 xl:grid-cols-3">
        {pricing.map((item) => (
          <Card
            key={item.id}
            className={`relative overflow-hidden p-7 ${
              item.featured
                ? "border-amber-400/40 bg-gradient-to-b from-amber-400/10 to-white/5"
                : ""
            }`}
          >
            <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              {item.badge}
            </div>

            <div className="pr-24">
              <h3 className="text-2xl font-semibold text-white">{item.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {item.description}
              </p>
            </div>

            <div className="mt-8 text-4xl font-semibold tracking-tight text-amber-400">
              {renderPrice(item)}
            </div>
            <div className="mt-1 text-sm text-slate-400">Flat-fee structure</div>

            <div className="mt-8 space-y-4">
              {item.bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-amber-400/15 p-1.5 text-amber-400">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-6 text-slate-200">{bullet}</p>
                </div>
              ))}
            </div>

            <Button
              to="/start"
              variant={item.featured ? "primary" : "secondary"}
              className="mt-8"
            >
              Select plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300">
          <span className="font-semibold text-white">Important:</span> Engagements
          are not formally initiated until the first 15-minute Zoom or phone call
          confirms the adequacy of the submitted documents.
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300">
          <span className="font-semibold text-white">Processing promise:</span>{" "}
          The matter will be filed within two weeks of receiving all required client
          documents. Expedited firm processing is available for an additional $500.
        </div>
      </div>
    </section>
  );
}
