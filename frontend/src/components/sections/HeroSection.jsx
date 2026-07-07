import { ArrowRight } from "lucide-react";
import Button from "../ui/Button";
import HeroTrustBadges from "../HeroTrustBadges";
import BeforeYouStartCard from "../BeforeYouStartCard";
import AttorneyTrustCard from "../AttorneyTrustCard";
import DocumentSecurityTrustBlock from "../DocumentSecurityTrustBlock";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { heroCopy } from "../../constants/trustSignals.js";
import { heroSurfaceClass } from "../../constants/themeClasses.js";

export default function HeroSection() {
  const { settings } = useSiteSettings();

  return (
    <section id="top" className={heroSurfaceClass}>
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('${settings?.hero_image_url || "/images/la-skyline.jpg"}')` }}
      />
      <div className="absolute inset-0 -z-10 bg-[#020617]/70" />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-12 pt-16 md:px-6 md:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-16">
        <div>
          <p className="mb-6 inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300">
            {heroCopy.eyebrow}
          </p>

          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {heroCopy.headline}{" "}
            <span className="text-amber-400">{heroCopy.headlineAccent}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            {heroCopy.subheadline}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Button to={heroCopy.primaryCta.to} tone="dark">
              {heroCopy.primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button href={heroCopy.secondaryCta.to} variant="secondary" tone="dark">
              {heroCopy.secondaryCta.label}
            </Button>
          </div>

          <p
            className="mt-6 max-w-2xl text-base leading-7 text-slate-400"
            role="note"
          >
            {heroCopy.notice}
          </p>

          <HeroTrustBadges />
        </div>

        <div className="flex flex-col gap-5 lg:items-stretch">
          <BeforeYouStartCard />
          <AttorneyTrustCard />
          <DocumentSecurityTrustBlock compact />
        </div>
      </div>
    </section>
  );
}
