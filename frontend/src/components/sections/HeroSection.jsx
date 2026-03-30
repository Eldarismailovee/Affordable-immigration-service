import { ArrowRight, Check, Globe } from "lucide-react";
import Button from "../ui/Button";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function HeroSection() {
  const { settings } = useSiteSettings();

  const highlights = [
    "15-minute Zoom or phone review",
    "Filed within 2 weeks after complete docs",
    "Manual payment processing by office",
  ];

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('${settings?.hero_image_url || "/images/la-skyline.jpg"}')` }}
      />
      <div className="absolute inset-0 -z-10 bg-[#020617]/70" />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 md:px-6 md:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300">
            <Globe className="h-4 w-4" />
            Affordable flat-fee immigration support
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-white md:text-7xl">
            Affordable <span className="text-amber-400">immigration</span>
            <br />
            services made <span className="text-amber-400">simple</span>.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            A clean, conversion-focused experience for family petitions with
            transparent packages, online intake, document collection, fee
            agreement automation, and consultation booking.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="#pricing">
              View pricing
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button to="/start" variant="secondary">
              Start your process
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-amber-400/15 p-2 text-amber-400">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-slate-200">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-end">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Start now
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Quick intake preview
              </h3>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                Choose a package, complete intake, upload documents, preview
                your fee agreement, and book the first consultation — all in one
                streamlined flow.
              </div>

              <Button to="/start" className="mt-6 w-full rounded-2xl">
                Continue to intake
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
