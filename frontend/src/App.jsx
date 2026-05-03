import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { IntakeProvider } from "./context/IntakeContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

import HomePage from "./pages/HomePage";
import StartPage from "./pages/StartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import AdminUsersPage from "./pages/AdminUsersPage";
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
        <AuthProvider>
          <IntakeProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
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
                  <ProtectedRoute roles={["admin"]}>
                    <AdminPage />
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
                  <ProtectedRoute roles={["admin"]}>
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
              <Route path="/disclaimer" element={<DisclaimerPage />} />
            </Routes>
          </IntakeProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}
