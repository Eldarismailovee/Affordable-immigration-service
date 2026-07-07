import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PRIVILEGED_ROLES = ["admin", "attorney"];

export default function ProtectedRoute({ children, roles, requireVerifiedEmail = true }) {
  const location = useLocation();
  const { loading, user, hasToken, mfaChallenge, isEmailVerified } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040816] px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
          Checking access...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const needsPrivilegedMfa =
    PRIVILEGED_ROLES.includes(user.role) && !hasToken;

  if (needsPrivilegedMfa) {
    if (mfaChallenge?.enrollmentRequired) {
      return <Navigate to="/mfa/enroll" replace state={{ from: location.pathname }} />;
    }
    return <Navigate to="/mfa/verify" replace state={{ from: location.pathname }} />;
  }

  if (requireVerifiedEmail && !isEmailVerified) {
    return (
      <Navigate
        to="/verify-email"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/account" replace />;
  }

  return children;
}
