import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CookieConsentBanner from "./components/CookieConsentBanner";
import DocumentTitle from "./components/layout/DocumentTitle";
import SkipLink from "./components/layout/SkipLink";
import { AuthProvider } from "./context/AuthContext";
import { CookieConsentProvider } from "./context/CookieConsentContext";
import { IntakeProvider } from "./context/IntakeContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

import HomePage from "./pages/HomePage";
import CaseReviewPage from "./pages/CaseReviewPage";
import StartPage from "./pages/StartPage";
import LoginPage from "./pages/LoginPage";
import MfaVerifyPage from "./pages/MfaVerifyPage";
import MfaEnrollmentPage from "./pages/MfaEnrollmentPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ChangeEmailPage from "./pages/ChangeEmailPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import AdminDsarPage from "./pages/AdminDsarPage";
import AdminDsarDetailPage from "./pages/AdminDsarDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import AgreementPage from "./pages/AgreementPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiePreferencesPage from "./pages/CookiePreferencesPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import AccessibilityPage from "./pages/AccessibilityPage";
import UnsubscribePage from "./pages/UnsubscribePage";
import EmailPreferencesPage from "./pages/EmailPreferencesPage";
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
      <SkipLink />
      <DocumentTitle />
      <SiteSettingsProvider>
        <AuthProvider>
          <CookieConsentProvider>
            <IntakeProvider>
              <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/case-review" element={<CaseReviewPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/mfa/verify" element={<MfaVerifyPage />} />
              <Route path="/mfa/enroll" element={<MfaEnrollmentPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/verify-email"
                element={
                  <ProtectedRoute requireVerifiedEmail={false}>
                    <VerifyEmailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/change-email"
                element={
                  <ProtectedRoute requireVerifiedEmail={false}>
                    <ChangeEmailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/start"
                element={
                  <ProtectedRoute>
                    <StartPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/intake"
                element={
                  <ProtectedRoute>
                    <IntakeLayout />
                  </ProtectedRoute>
                }
              >
              <Route index element={<Navigate to="package" replace />} />
              <Route path="package" element={<PackageStepPage />} />
              <Route path="client" element={<ClientStepPage />} />
              <Route path="case" element={<CaseStepPage />} />
              <Route path="addons" element={<AddonsStepPage />} />
              <Route path="agreement-preview" element={<AgreementPreviewPage />} />
              <Route path="booking" element={<BookingStepPage />} />
              <Route path="success" element={<SuccessPage />} />
            </Route>

              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin", "attorney"]}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/privacy-requests"
                element={
                  <ProtectedRoute roles={["admin", "attorney"]}>
                    <AdminDsarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/privacy-requests/:requestId"
                element={
                  <ProtectedRoute roles={["admin", "attorney"]}>
                    <AdminDsarDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <SiteSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/leads/:leadId"
                element={
                  <ProtectedRoute roles={["admin", "attorney"]}>
                    <LeadDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agreement/:leadId"
                element={
                  <ProtectedRoute>
                    <AgreementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding/:leadId"
                element={
                  <ProtectedRoute>
                    <OnboardingPacketPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookie-preferences" element={<CookiePreferencesPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route
                path="/email-preferences"
                element={
                  <ProtectedRoute>
                    <EmailPreferencesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/accessibility" element={<AccessibilityPage />} />
            </Routes>
            <CookieConsentBanner />
          </IntakeProvider>
        </CookieConsentProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}
