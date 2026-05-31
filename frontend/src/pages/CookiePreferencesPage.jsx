import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { useCookieConsent } from "../context/CookieConsentContext";
import { getConsent } from "../lib/cookieConsent";

function ConsentToggle({ id, label, description, checked, disabled, onChange }) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${
        disabled ? "border-white/10 bg-white/5 opacity-80" : "border-white/15 bg-slate-950/40"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 text-amber-400 focus:ring-amber-400"
      />
      <span>
        <span className="block font-semibold text-white">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-300">{description}</span>
      </span>
    </label>
  );
}

export default function CookiePreferencesPage() {
  const { consent, savePreferences } = useCookieConsent();
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
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <main id="main-content" className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Privacy
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Cookie Preferences</h1>
            <p className="mt-3 text-slate-300">
              Choose which optional cookies we may use. You can change or withdraw consent at any
              time.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
          >
            Back home
          </Link>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-8">
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
            onChange={setAnalytics}
          />
          <ConsentToggle
            id="preferences-marketing"
            label="Marketing"
            description="Optional. Supports outreach and measures campaign effectiveness."
            checked={marketing}
            onChange={setMarketing}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" onClick={handleSave}>
              Save preferences
            </Button>
            <Button type="button" variant="secondary" onClick={handleWithdrawOptional}>
              Withdraw optional cookies
            </Button>
          </div>

          {savedMessage ? (
            <p className="text-sm text-emerald-300" role="status">
              {savedMessage}
            </p>
          ) : null}

          <p className="text-sm leading-7 text-slate-300">
            Read more in our{" "}
            <Link to="/privacy" className="text-amber-300 hover:text-amber-200">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm leading-7 text-amber-100">
            TODO: Have cookie banner text, consent categories, and geo/legal assumptions reviewed
            by privacy counsel before production launch.
          </p>
        </div>
      </main>
    </div>
  );
}
