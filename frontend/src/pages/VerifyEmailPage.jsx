import { useCallback, useEffect, useMemo, useState } from "react";
import { sanitizeReturnPath } from "../utils/safeReturnPath.js";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import {
  confirmEmailVerification,
  requestEmailVerification,
  resendEmailVerification,
} from "../services/api";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, refreshUser, applySessionFromVerification, logout } = useAuth();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const returnTo = sanitizeReturnPath(searchParams.get("returnTo")) || "/account";

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      return;
    }

    let cancelled = false;

    async function verifyToken() {
      setStatus("verifying");

      try {
        const result = await confirmEmailVerification(token);

        if (cancelled) {
          return;
        }

        applySessionFromVerification?.(result);
        setStatus("success");
        setMessage("Your email has been verified.");
        setSearchParams({}, { replace: true });
        await refreshUser();
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setMessage(error.message || "Verification failed.");
        setSearchParams({}, { replace: true });
      }
    }

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [applySessionFromVerification, refreshUser, searchParams, setSearchParams]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    setStatus("resending");

    try {
      const result = user
        ? await requestEmailVerification()
        : await resendEmailVerification(user?.email || "");

      setDeliveryStatus(result.deliveryStatus ?? null);
      setMessage(result.message);
      setStatus("resent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not resend verification email.");
    }
  }, [user]);

  const providerMessage = useMemo(() => {
    if (deliveryStatus === "not_configured") {
      return "Email delivery is not configured in this environment. Contact support if you need help verifying your account.";
    }

    return null;
  }, [deliveryStatus]);

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-16 text-white">
      <div className="mx-auto max-w-xl">
        <Card className="space-y-6 p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Account security</p>
            <h1 className="mt-2 text-3xl font-semibold">Verify your email</h1>
            <p className="mt-3 text-slate-300">
              Sensitive account actions require a verified email address.
              {user?.email ? ` We sent instructions to ${user.email}.` : ""}
            </p>
          </div>

          {status === "verifying" ? (
            <p className="text-slate-300">Confirming your verification link...</p>
          ) : null}

          {message ? <p className="text-slate-200">{message}</p> : null}
          {providerMessage ? <p className="text-amber-200">{providerMessage}</p> : null}

          {user?.pendingEmail ? (
            <p className="text-slate-300">
              Pending email change: <strong>{user.pendingEmail}</strong>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || status === "verifying"}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
            </Button>
            {status === "success" ? (
              <Button type="button" variant="secondary" onClick={() => navigate(returnTo)}>
                Continue
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => logout()}>
              Sign out
            </Button>
          </div>

          <p className="text-sm text-slate-400">
            Need to fix your email?{" "}
            <Link className="text-white underline" to="/account/change-email">
              Change email address
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
