import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { logCookieConsent } from "../services/api";
import {
  applyConsentedScripts,
  getConsent,
  getPreviousOptionalChoices,
  needsConsentPrompt,
  onConsentChange,
  saveConsent,
} from "../lib/cookieConsent";

const CookieConsentContext = createContext(null);

function logConsentBestEffort(consent) {
  logCookieConsent({
    consentVersion: consent.version,
    strictlyNecessary: consent.strictlyNecessary,
    analytics: consent.analytics,
    marketing: consent.marketing,
    source: consent.source,
    anonymousId: consent.anonymousId,
  }).catch(() => {});
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => getConsent());
  const [showBanner, setShowBanner] = useState(() => needsConsentPrompt());

  useEffect(() => {
    applyConsentedScripts();

    return onConsentChange((nextConsent) => {
      setConsent(nextConsent);
      setShowBanner(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      consent,
      showBanner,
      previousOptionalChoices: getPreviousOptionalChoices(),
      acceptAll: () => {
        const next = saveConsent({
          analytics: true,
          marketing: true,
          source: "banner",
        });
        logConsentBestEffort(next);
      },
      rejectOptional: () => {
        const next = saveConsent({
          analytics: false,
          marketing: false,
          source: "banner",
        });
        logConsentBestEffort(next);
      },
      savePreferences: ({ analytics, marketing, source = "preferences" }) => {
        const next = saveConsent({ analytics, marketing, source });
        logConsentBestEffort(next);
        return next;
      },
      reopenBanner: () => setShowBanner(true),
    }),
    [consent, showBanner]
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }

  return context;
}
