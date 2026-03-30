import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import navigation from "../../data/navigation";
import Button from "../ui/Button";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings } = useSiteSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.firm_name || "Logo"}
              className="h-10 w-10 rounded-2xl object-cover border border-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          )}

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-400">
              {settings?.firm_name || "Immigration Law"}
            </div>
            <div className="text-sm text-slate-300">
              Flat-fee family petitions
            </div>
          </div>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-200 transition hover:text-amber-400"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="secondary" href="#contact">
            Contact
          </Button>
          <Button to="/start">Start Now</Button>
        </div>

        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 lg:hidden">
          <div className="grid gap-3">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-slate-200 transition hover:border-amber-400/40 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <Button to="/start" className="rounded-xl">
              Start Your Process
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
