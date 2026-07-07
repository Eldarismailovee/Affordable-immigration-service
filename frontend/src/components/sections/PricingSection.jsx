import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import SectionTitle from "../layout/SectionTitle";
import pricing from "../../data/pricing";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { cardInsetClass, sectionLightClass } from "../../constants/themeClasses.js";

function renderPrice(item) {
  if (item.flatFee) return `+$${item.flatFee}`;
  return `$${item.minPrice}–$${item.maxPrice}`;
}

export default function PricingSection() {
  return (
    <section id="pricing" className={`${sectionLightClass} mx-auto max-w-7xl px-4 md:px-6 lg:px-8`}>
      <SectionTitle
        eyebrow="Pricing / Packages"
        title="Transparent"
        accent="flat-fee pricing"
        subtitle="Transparent flat-fee options for family-based immigration support. Final scope, eligibility, and next steps are confirmed after conflict check and attorney review."
      />

      <div className="mt-12 grid gap-6 xl:grid-cols-3">
        {pricing.map((item) => (
          <Card
            key={item.id}
            className={`relative overflow-hidden p-7 ${
              item.featured
                ? "border-blue-200 bg-gradient-to-b from-blue-50 to-white ring-1 ring-blue-100"
                : ""
            }`}
          >
            <div className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-900">
              {item.badge}
            </div>

            <div className="pr-24">
              <h3 className="text-2xl font-semibold text-slate-950">{item.name}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {item.description}
              </p>
            </div>

            <div className="mt-8 font-mono text-4xl font-semibold tabular-nums tracking-tight text-blue-900">
              {renderPrice(item)}
            </div>
            <div className="mt-1 text-sm text-slate-500">Attorney/service fees</div>

            <div className="mt-8 space-y-4">
              {item.bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-blue-50 p-1.5 text-blue-900">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-base leading-7 text-slate-700">{bullet}</p>
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

      <p className="mt-8 max-w-3xl text-base leading-7 text-slate-600">
        <span className="font-semibold text-slate-950">Excluded costs:</span>{" "}
        Prices shown are attorney/service fees unless expressly stated. USCIS filing fees,
        government fees, translations, medical exams, mailing/courier costs, and third-party
        provider costs are separate and are not included.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`p-5 text-base leading-7 text-slate-600 ${cardInsetClass}`}>
          <span className="font-semibold text-slate-950">Attorney review and acceptance:</span>{" "}
          All services are subject to conflict check, jurisdiction availability, attorney review,
          and written acceptance by the firm. Paid legal services begin only after the scope and
          engagement terms are confirmed in writing.
        </div>

        <div className={`p-5 text-base leading-7 text-slate-600 ${cardInsetClass}`}>
          <span className="font-semibold text-slate-950">Preparation target:</span>{" "}
          Internal preparation target: within 2 weeks after all required documents and
          information are received and the matter is accepted. This is an internal preparation
          target, not a guarantee of filing date, USCIS acceptance, approval, or government
          processing time.
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600">
        <span className="font-semibold text-slate-950">No guarantee of outcome:</span>{" "}
        No fee or package guarantees USCIS approval, a filing date, or government processing
        time. Government agencies decide applications and petitions based on law, evidence, and
        case facts.{" "}
        <Link to="/terms" className="text-blue-900 underline underline-offset-2 hover:text-blue-800">
          See Terms for refund and cancellation details
        </Link>
        .
      </p>
    </section>
  );
}
