import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "./ui/Button";
import { useCookieConsent } from "../context/CookieConsentContext";

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

export default function CookieConsentBanner() {
  const { showBanner, previousOptionalChoices, acceptAll, rejectOptional, savePreferences } =
    useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(previousOptionalChoices.analytics);
  const [marketing, setMarketing] = useState(previousOptionalChoices.marketing);

  if (!showBanner) {
    return null;
  }

  function handleSavePreferences() {
    savePreferences({ analytics, marketing, source: "banner" });
    setShowPreferences(false);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur md:p-6"
      role="region"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div>
          <h2 id="cookie-consent-title" className="text-lg font-semibold text-white">
            Cookie preferences
          </h2>
          <p id="cookie-consent-description" className="mt-2 text-sm leading-7 text-slate-300">
            We use strictly necessary cookies to make this site work. With your permission, we may
            also use analytics and marketing cookies to understand site usage and improve outreach.
            You can accept all, reject optional cookies, or manage preferences.
          </p>
        </div>

        {showPreferences ? (
          <div className="space-y-3">
            <ConsentToggle
              id="banner-strictly-necessary"
              label="Strictly necessary"
              description="Required for authentication, security, and saving your cookie choices."
              checked
              disabled
              onChange={() => {}}
            />
            <ConsentToggle
              id="banner-analytics"
              label="Analytics"
              description="Help us understand how the site is used so we can improve it."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ConsentToggle
              id="banner-marketing"
              label="Marketing"
              description="Support outreach and measure campaign effectiveness."
              checked={marketing}
              onChange={setMarketing}
            />
            <div className="flex flex-wrap gap-3 pt-1">
              <Button type="button" onClick={handleSavePreferences}>
                Save preferences
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowPreferences(false)}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="button" onClick={acceptAll} className="w-full sm:w-auto">
              Accept all
            </Button>
            <Button type="button" variant="secondary" onClick={rejectOptional} className="w-full sm:w-auto">
              Reject optional
            </Button>
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="rounded-full px-5 py-3 text-sm font-semibold text-slate-200 underline decoration-white/30 underline-offset-4 transition hover:text-amber-300"
            >
              Manage preferences
            </button>
            <Link
              to="/privacy"
              className="text-sm text-slate-300 transition hover:text-amber-300 sm:ml-auto"
            >
              Privacy Policy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
