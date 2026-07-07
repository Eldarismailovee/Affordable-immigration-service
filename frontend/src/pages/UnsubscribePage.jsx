import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { confirmUnsubscribe } from "../services/api";

export default function UnsubscribePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "" : "This unsubscribe link is invalid or incomplete."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const result = await confirmUnsubscribe({ token });
        if (!cancelled) {
          setStatus("success");
          setMessage(result.message || "You have been unsubscribed from marketing emails.");
          setSearchParams({}, { replace: true });
        }
      } catch {
        if (!cancelled) {
          setStatus("success");
          setMessage("You have been unsubscribed from marketing emails.");
          setSearchParams({}, { replace: true });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [setSearchParams, token]);

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-16 text-white">
      <main id="main-content" className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Email preferences</h1>
        {status === "loading" ? (
          <p className="mt-6 text-slate-300" role="status">
            Processing your unsubscribe request…
          </p>
        ) : (
          <p className="mt-6 text-slate-300" role="status">
            {message}
          </p>
        )}
        <p className="mt-8 text-sm text-slate-400">
          Account-related emails such as password resets and security notices may still be sent
          when necessary.
        </p>
      </main>
    </div>
  );
}
