import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer id="contact" className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr_0.85fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-400">
              Contact / Consultation Booking
            </div>
            <h3 className="mt-3 text-3xl font-semibold text-white">
              {settings?.firm_name || "Immigration Law Firm"}
            </h3>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Contact details live in the footer to keep the conversion path clean while still making help easy to find.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-200">
                <Phone className="h-5 w-5 text-amber-400" />
                <span>{settings?.phone || "(555) 123-4567"}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <Mail className="h-5 w-5 text-amber-400" />
                <span>{settings?.email || "info@immigrationfirm.com"}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <Clock3 className="h-5 w-5 text-amber-400" />
                <span>Mon–Fri · 9:00 AM–6:00 PM</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <MapPin className="h-5 w-5 text-amber-400" />
                <span>{settings?.address || settings?.office_mode || "Zoom / phone only"}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold text-white">Quick links</div>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <a href="#services" className="transition hover:text-amber-300">Family Petitions / Services</a>
              <a href="#pricing" className="transition hover:text-amber-300">Pricing / Packages</a>
              <a href="#faq" className="transition hover:text-amber-300">FAQ</a>
              <Link to="/start" className="transition hover:text-amber-300">Start Now / Intake</Link>
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold text-white">Terms / Disclaimer / Privacy</div>
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              <p>Website use does not create an attorney-client relationship.</p>
              <p>Engagement starts only after the first lawyer consultation and confirmation that submitted documents are adequate.</p>
              <p>Filing fees are separate from legal fees. Payment information may be collected online and processed manually by the office.</p>
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/terms" className="transition hover:text-amber-300">Terms</Link>
                <Link to="/privacy" className="transition hover:text-amber-300">Privacy Policy</Link>
                <Link to="/disclaimer" className="transition hover:text-amber-300">Disclaimer</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-500">
          © 2026 {settings?.firm_name || "Immigration Law Firm"}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
