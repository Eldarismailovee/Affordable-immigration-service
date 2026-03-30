import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { IntakeProvider } from "./context/IntakeContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

import HomePage from "./pages/HomePage";
import StartPage from "./pages/StartPage";
import AdminPage from "./pages/AdminPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import AgreementPage from "./pages/AgreementPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import OnboardingPacketPage from "./pages/OnboardingPacketPage";
import SiteSettingsPage from "./pages/SiteSettingsPage";

import IntakeLayout from "./pages/intake/IntakeLayout";
import PackageStepPage from "./pages/intake/PackageStepPage";
import ClientStepPage from "./pages/intake/ClientStepPage";
import CaseStepPage from "./pages/intake/CaseStepPage";
import AddonsStepPage from "./pages/intake/AddonsStepPage";
import AgreementPreviewPage from "./pages/intake/AgreementPreviewPage";
import BookingStepPage from "./pages/intake/BookingStepPage";
import SuccessPage from "./pages/intake/SuccessPage";

export default function App() {
  return (
    <BrowserRouter>
      <SiteSettingsProvider>
        <IntakeProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/start" element={<StartPage />} />

            <Route path="/intake" element={<IntakeLayout />}>
              <Route index element={<Navigate to="package" replace />} />
              <Route path="package" element={<PackageStepPage />} />
              <Route path="client" element={<ClientStepPage />} />
              <Route path="case" element={<CaseStepPage />} />
              <Route path="addons" element={<AddonsStepPage />} />
              <Route path="agreement-preview" element={<AgreementPreviewPage />} />
              <Route path="booking" element={<BookingStepPage />} />
              <Route path="success" element={<SuccessPage />} />
            </Route>

            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/settings" element={<SiteSettingsPage />} />
            <Route path="/admin/leads/:leadId" element={<LeadDetailPage />} />
            <Route path="/agreement/:leadId" element={<AgreementPage />} />
            <Route path="/onboarding/:leadId" element={<OnboardingPacketPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
          </Routes>
        </IntakeProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}