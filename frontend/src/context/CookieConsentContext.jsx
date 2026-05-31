import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { logCookieConsent } from "../services/api";
import {
  applyConsentedScripts,
  detectGlobalPrivacyControl,
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
    gpcActive: consent.gpcActive,
    regionHint: consent.regionHint,
    source: consent.source,
    anonymousId: consent.anonymousId,
  }).catch(() => {});
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => getConsent());
  const [showBanner, setShowBanner] = useState(() => needsConsentPrompt());
  const gpcActive = detectGlobalPrivacyControl();

  useEffect(() => {
    const unsubscribe = onConsentChange((nextConsent) => {
      setConsent(nextConsent);
      setShowBanner(false);
    });

    if (gpcActive) {
      const current = getConsent();

      if (!current) {
        const next = saveConsent({
          analytics: false,
          marketing: false,
          source: "gpc",
          gpcActive: true,
        });
        logConsentBestEffort(next);
      } else if (current.analytics || current.marketing || !current.gpcActive) {
        const next = saveConsent({
          analytics: false,
          marketing: false,
          source: "gpc",
          gpcActive: true,
        });
        logConsentBestEffort(next);
      }
    }

    applyConsentedScripts();

    return unsubscribe;
  }, [gpcActive]);

  const value = useMemo(
    () => ({
      consent,
      showBanner,
      gpcActive,
      previousOptionalChoices: getPreviousOptionalChoices(),
      acceptAll: () => {
        const next = saveConsent({
          analytics: gpcActive ? false : true,
          marketing: gpcActive ? false : true,
          source: "banner",
          gpcActive,
        });
        logConsentBestEffort(next);
      },
      rejectOptional: () => {
        const next = saveConsent({
          analytics: false,
          marketing: false,
          source: "banner",
          gpcActive,
        });
        logConsentBestEffort(next);
      },
      savePreferences: ({ analytics, marketing, source = "preferences" }) => {
        const next = saveConsent({ analytics, marketing, source, gpcActive });
        logConsentBestEffort(next);
        return next;
      },
      reopenBanner: () => {
        if (!gpcActive) {
          setShowBanner(true);
        }
      },
    }),
    [consent, showBanner, gpcActive]
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
