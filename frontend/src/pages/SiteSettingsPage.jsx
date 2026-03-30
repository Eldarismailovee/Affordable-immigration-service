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
      <div className="text-sm font-medium text-white">{label}</div>

      {value ? (
        <img
          src={value}
          alt={label}
          className="h-32 w-full rounded-2xl border border-white/10 object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
          No image selected
        </div>
      )}

      <input
        type="text"
        name={fieldName}
        value={value || ""}
        onChange={onChange}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
        placeholder={`${label} URL`}
      />

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-amber-400/40 hover:text-amber-300">
        <input
          type="file"
          accept="image/*"
          className="hidden"
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
      <div className="mx-auto max-w-6xl">
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
            <input
              name="firm_name"
              value={form.firm_name || ""}
              onChange={handleChange}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
              placeholder="Firm name"
            />
            <input
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
              placeholder="Phone"
            />
            <input
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
              placeholder="Email"
            />
            <input
              name="office_mode"
              value={form.office_mode || ""}
              onChange={handleChange}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
              placeholder="Zoom / phone only"
            />
            <input
              name="address"
              value={form.address || ""}
              onChange={handleChange}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 md:col-span-2"
              placeholder="Address"
            />

            <select
              name="language_mode"
              value={form.language_mode || "english"}
              onChange={handleChange}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 md:col-span-2"
            >
              <option value="english">English only</option>
              <option value="bilingual">Bilingual</option>
            </select>
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
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
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
      </div>
    </div>
  );
}
