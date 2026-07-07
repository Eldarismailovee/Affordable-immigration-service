import { Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import navigation from "../../data/navigation";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings } = useSiteSettings();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header
      id="top"
      className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5 px-4 md:px-6 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.firm_name || "Logo"}
              className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-800/30 bg-blue-50 text-blue-900">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0">
            <div className="max-w-[190px] truncate text-sm font-semibold text-blue-900">
              {settings?.firm_name || "Immigration Law"}
            </div>
            <div className="hidden max-w-[190px] truncate text-sm text-slate-600 sm:block">
              Flat-fee family petitions
            </div>
          </div>
        </a>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 lg:flex"
        >
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <Button
                variant="secondary"
                to={isAdmin ? "/admin" : "/account"}
                className="px-4 py-2.5"
              >
                {isAdmin ? "Admin" : "Account"}
              </Button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Sign in
              </Link>
            </>
          )}
          <Button to="/case-review" className="px-5 py-2.5">
            Start case review
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="mobile-navigation"
          role="navigation"
          aria-label="Mobile"
          className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden"
        >
          <div className="mx-auto grid max-w-7xl gap-2">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-slate-800 transition hover:bg-slate-50"
              >
                {item.label}
              </a>
            ))}
            {isAuthenticated ? (
              <>
                <Button to={isAdmin ? "/admin" : "/account"} variant="secondary" className="rounded-xl">
                  {isAdmin ? "Admin" : "Account"}
                </Button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Button to="/login" variant="secondary" className="rounded-xl">
                  Sign in
                </Button>
                <Button to="/register" className="rounded-xl">
                  Register
                </Button>
              </>
            )}
            <Button to="/case-review" className="rounded-xl">
              Start case review
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
