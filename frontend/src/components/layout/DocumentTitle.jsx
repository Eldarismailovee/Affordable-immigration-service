import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "Immigration Law";

const ROUTE_TITLES = [
  ["/", "Home"],
  ["/login", "Sign in"],
  ["/register", "Create account"],
  ["/account", "Your dashboard"],
  ["/start", "Start intake"],
  ["/intake/package", "Intake — Choose package"],
  ["/intake/client", "Intake — Client information"],
  ["/intake/case", "Intake — Case details"],
  ["/intake/addons", "Intake — Add-ons"],
  ["/intake/agreement-preview", "Intake — Agreement preview"],
  ["/intake/booking", "Intake — Consultation and payment"],
  ["/intake/success", "Intake submitted"],
  ["/admin/users", "Admin — Users and roles"],
  ["/admin/settings", "Admin — Site settings"],
  ["/admin", "Admin — Leads dashboard"],
  ["/terms", "Terms of Service"],
  ["/privacy", "Privacy Policy"],
  ["/cookie-preferences", "Cookie Preferences"],
  ["/disclaimer", "Legal Disclaimer"],
  ["/availability", "State & Jurisdiction Availability"],
];

function getPageTitle(pathname) {
  const exact = ROUTE_TITLES.find(([path]) => path === pathname);
  if (exact) {
    return exact[1];
  }

  if (pathname.startsWith("/admin/leads/")) {
    return "Admin — Lead detail";
  }

  if (pathname.startsWith("/agreement/")) {
    return "Fee agreement";
  }

  if (pathname.startsWith("/onboarding/")) {
    return "Onboarding packet";
  }

  if (pathname.startsWith("/intake")) {
    return "Start your intake";
  }

  return SITE_NAME;
}

export default function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = getPageTitle(pathname);
    document.title =
      pageTitle === SITE_NAME ? SITE_NAME : `${pageTitle} | ${SITE_NAME}`;
  }, [pathname]);

  return null;
}
