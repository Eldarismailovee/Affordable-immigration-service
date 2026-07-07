import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "./ui/Button";
import { useCookieConsent } from "../context/CookieConsentContext";
import { cardInsetClass } from "../constants/themeClasses.js";

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
        <span className="mt-1 block text-base leading-7 text-slate-600">{description}</span>
      </label>
    </div>
  );
}

export default function CookieConsentBanner() {
  const { showBanner, gpcActive, previousOptionalChoices, acceptAll, rejectOptional, savePreferences } =
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur md:p-6"
      role="region"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div>
          <h2 id="cookie-consent-title" className="text-lg font-semibold text-slate-950">
            Cookie preferences
          </h2>
          <p id="cookie-consent-description" className="mt-2 text-base leading-7 text-slate-600">
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
              disabled={gpcActive}
              onChange={setAnalytics}
            />
            <ConsentToggle
              id="banner-marketing"
              label="Marketing"
              description="Support outreach and measure campaign effectiveness."
              checked={marketing}
              disabled={gpcActive}
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
              className="rounded-full px-5 py-3 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-blue-900"
            >
              Manage preferences
            </button>
            <Link
              to="/privacy"
              className="text-sm text-slate-600 transition hover:text-blue-900 sm:ml-auto"
            >
              Privacy Policy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
