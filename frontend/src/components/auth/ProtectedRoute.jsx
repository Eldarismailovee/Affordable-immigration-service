import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const { loading, user } = useAuth();

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

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/account" replace />;
  }

  return children;
}
