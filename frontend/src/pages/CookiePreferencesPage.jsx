import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { useCookieConsent } from "../context/CookieConsentContext";
import { getConsent } from "../lib/cookieConsent";
import { cardInsetClass, cardSurfaceClass, pageSurfaceClass } from "../constants/themeClasses.js";

function ConsentToggle({ id, label, description, checked, disabled, onChange }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-4 ${
        disabled ? `${cardInsetClass} opacity-80` : cardInsetClass
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
      />
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold text-slate-950">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
      </label>
    </div>
  );
}

export default function CookiePreferencesPage() {
  const { consent, gpcActive, savePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const current = consent || getConsent();

    if (current) {
      // Sync editable toggles when stored consent loads or changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors external consent storage
      setAnalytics(Boolean(current.analytics));
      setMarketing(Boolean(current.marketing));
    }
  }, [consent]);

  function handleSave() {
    savePreferences({ analytics, marketing, source: "preferences" });
    setSavedMessage("Your cookie preferences have been saved.");
  }

  function handleWithdrawOptional() {
    setAnalytics(false);
    setMarketing(false);
    savePreferences({ analytics: false, marketing: false, source: "preferences" });
    setSavedMessage("Optional cookies have been turned off.");
  }

  return (
    <div className={`${pageSurfaceClass} px-4 py-10 md:px-6 lg:px-8`}>
      <main id="main-content" className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-900">
              Privacy
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              Cookie Preferences
            </h1>
            <p className="mt-3 text-slate-600">
              Choose which optional cookies we may use. You can change or withdraw consent at any
              time.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:border-slate-400 hover:bg-slate-50"
          >
            Back home
          </Link>
        </div>

        <div className={`space-y-4 p-8 ${cardSurfaceClass}`}>
          <ConsentToggle
            id="preferences-strictly-necessary"
            label="Strictly necessary"
            description="Always enabled. Includes authentication, security, and your saved cookie choices."
            checked
            disabled
            onChange={() => {}}
          />
          <ConsentToggle
            id="preferences-analytics"
            label="Analytics"
            description="Optional. Helps us understand site usage and improve the experience."
            checked={analytics}
            disabled={gpcActive}
            onChange={setAnalytics}
          />
          <ConsentToggle
            id="preferences-marketing"
            label="Marketing"
            description="Optional. Supports outreach and measures campaign effectiveness."
            checked={marketing}
            disabled={gpcActive}
            onChange={setMarketing}
          />

          {gpcActive ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-base leading-7 text-amber-950">
              Your browser is sending a Global Privacy Control signal. Marketing and
              analytics tracking related to sale/share is disabled.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" onClick={handleSave}>
              Save preferences
            </Button>
            <Button type="button" variant="secondary" onClick={handleWithdrawOptional}>
              Withdraw optional cookies
            </Button>
          </div>

          {savedMessage ? (
            <p className="text-sm text-emerald-700" role="status">
              {savedMessage}
            </p>
          ) : null}

          <p className="text-base leading-7 text-slate-600">
            Read more in our{" "}
            <Link to="/privacy" className="text-blue-900 hover:text-blue-800">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="text-base leading-7 text-slate-600">
            Cookie banner text, consent categories, and geo/legal assumptions are subject to privacy
            counsel review before production launch.
          </p>
        </div>
      </main>
    </div>
  );
}
