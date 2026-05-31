import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updateSiteSettings, uploadImage } from "../services/api";
import { useSiteSettings } from "../context/SiteSettingsContext";

function ImageField({
  label,
  fieldName,
  value,
  uploadingField,
  onChange,
  onUpload,
}) {
  const isUploading = uploadingField === fieldName;

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <label htmlFor={`${fieldName}-url`} className="block text-sm font-medium text-white">
        {label}
      </label>

      {value ? (
        <img
          src={value}
          alt=""
          className="h-32 w-full rounded-2xl border border-white/10 object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-400">
          No image selected
        </div>
      )}

      <input
        id={`${fieldName}-url`}
        type="text"
        name={fieldName}
        value={value || ""}
        onChange={onChange}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
        placeholder={`${label} URL`}
      />

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-amber-400/40 hover:text-amber-300">
        <span className="sr-only">{label} file upload</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onUpload(fieldName, file);
            }
            event.target.value = "";
          }}
        />
        {isUploading ? "Uploading..." : "Upload image"}
      </label>
    </div>
  );
}

export default function SiteSettingsPage() {
  const { settings, refreshSettings, loading } = useSiteSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpload(fieldName, file) {
    setUploadingField(fieldName);
    setMessage("");
    setError("");

    try {
      const result = await uploadImage(file);
      const uploadedUrl = result?.file?.url || "";

      setForm((prev) => ({
        ...prev,
        [fieldName]: uploadedUrl,
      }));

      setMessage(`${fieldName} uploaded successfully.`);
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingField("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await updateSiteSettings(form);
      await refreshSettings();
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="min-h-screen bg-[#040816] px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 p-8">
          Loading site settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <main id="main-content" className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Admin
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Site settings
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              to="/admin"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
            >
              Back to admin
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="settings-firm-name" className="mb-1.5 block text-sm font-medium text-slate-200">
                Firm name
              </label>
              <input
                id="settings-firm-name"
                name="firm_name"
                value={form.firm_name || ""}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="settings-phone" className="mb-1.5 block text-sm font-medium text-slate-200">
                Phone
              </label>
              <input
                id="settings-phone"
                name="phone"
                type="tel"
                value={form.phone || ""}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="settings-email" className="mb-1.5 block text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                id="settings-email"
                name="email"
                type="email"
                value={form.email || ""}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="settings-office-mode" className="mb-1.5 block text-sm font-medium text-slate-200">
                Office mode
              </label>
              <input
                id="settings-office-mode"
                name="office_mode"
                value={form.office_mode || ""}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                placeholder="Zoom / phone only"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="settings-address" className="mb-1.5 block text-sm font-medium text-slate-200">
                Address
              </label>
              <input
                id="settings-address"
                name="address"
                value={form.address || ""}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                autoComplete="street-address"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="settings-language-mode" className="mb-1.5 block text-sm font-medium text-slate-200">
                Language mode
              </label>
              <select
                id="settings-language-mode"
                name="language_mode"
                value={form.language_mode || "english"}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
              >
                <option value="english">English only</option>
                <option value="bilingual">Bilingual</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ImageField
              label="Logo"
              fieldName="logo_url"
              value={form.logo_url}
              uploadingField={uploadingField}
              onChange={handleChange}
              onUpload={handleUpload}
            />

            <ImageField
              label="Hero image"
              fieldName="hero_image_url"
              value={form.hero_image_url}
              uploadingField={uploadingField}
              onChange={handleChange}
              onUpload={handleUpload}
            />

            <ImageField
              label="Services image"
              fieldName="services_image_url"
              value={form.services_image_url}
              uploadingField={uploadingField}
              onChange={handleChange}
              onUpload={handleUpload}
            />

            <ImageField
              label="Office image"
              fieldName="office_image_url"
              value={form.office_image_url}
              uploadingField={uploadingField}
              onChange={handleChange}
              onUpload={handleUpload}
            />
          </div>

          {message ? (
            <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              {message}
            </div>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </form>
      </main>
    </div>
  );
}
