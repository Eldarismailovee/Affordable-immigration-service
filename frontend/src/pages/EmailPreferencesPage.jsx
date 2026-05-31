import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEmailPreferences, updateEmailPreferences } from "../services/api";

export default function EmailPreferencesPage() {
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getEmailPreferences();
        setMarketingConsent(Boolean(data.user?.marketingConsent));
        setNewsletterConsent(Boolean(data.user?.newsletterConsent));
      } catch (err) {
        setError(err.message || "Failed to load email preferences");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const data = await updateEmailPreferences({
        marketingConsent,
        newsletterConsent,
      });
      setMarketingConsent(Boolean(data.user?.marketingConsent));
      setNewsletterConsent(Boolean(data.user?.newsletterConsent));
      setMessage("Your email preferences have been saved.");
    } catch (err) {
      setError(err.message || "Failed to save email preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <main id="main-content" className="mx-auto max-w-2xl">
        <Link to="/account" className="text-sm text-amber-400 hover:text-amber-300">
          ← Back to account
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Email preferences</h1>
        <p className="mt-3 text-slate-300">
          Choose whether you want marketing and newsletter emails. You can change these settings at
          any time. Security and account emails are sent separately when needed.
        </p>

        {loading ? (
          <p className="mt-8 text-slate-400">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start gap-3">
              <input
                id="email-prefs-marketing"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
              />
              <label htmlFor="email-prefs-marketing" className="cursor-pointer">
                <span className="font-medium">Marketing emails</span>
                <span className="mt-1 block text-sm text-slate-400">
                  Updates about services and announcements. Off by default until you opt in.
                </span>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="email-prefs-newsletter"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                checked={newsletterConsent}
                onChange={(event) => setNewsletterConsent(event.target.checked)}
              />
              <label htmlFor="email-prefs-newsletter" className="cursor-pointer">
                <span className="font-medium">Newsletter</span>
                <span className="mt-1 block text-sm text-slate-400">
                  Periodic newsletter content. You can unsubscribe at any time.
                </span>
              </label>
            </div>

            {error ? (
              <p id="email-prefs-error" role="alert" className="text-sm text-red-200">
                {error}
              </p>
            ) : null}
            {message ? (
              <p id="email-prefs-success" role="status" className="text-sm text-emerald-200">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-amber-500 px-6 py-3 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save preferences"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
