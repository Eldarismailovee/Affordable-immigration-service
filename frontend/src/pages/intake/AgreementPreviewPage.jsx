import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import { generateAgreementPreview } from "../../services/api";
import { sanitizeDocumentHtml } from "../../utils/sanitizeDocumentHtml";
import { cardSurfaceClass } from "../../constants/themeClasses.js";

export default function AgreementPreviewPage() {
  const navigate = useNavigate();
  const { intake, setAgreementPreview } = useIntake();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const previewPayload = useMemo(
    () => ({
      selectedPackage: intake.selectedPackage,
      firstName: intake.firstName,
      lastName: intake.lastName,
      email: intake.email,
      phone: intake.phone,
      caseType: intake.caseType,
      notes: intake.notes || "",
      additionalI130Count: Number(intake.additionalI130Count || 0),
      expedited: Boolean(intake.expedited),
    }),
    [
      intake.selectedPackage,
      intake.firstName,
      intake.lastName,
      intake.email,
      intake.phone,
      intake.caseType,
      intake.notes,
      intake.additionalI130Count,
      intake.expedited,
    ]
  );

  useEffect(() => {
    let ignore = false;

    async function loadPreview() {
      setLoading(true);
      setError("");

      try {
        const result = await generateAgreementPreview(previewPayload);

        if (!ignore) {
          setAgreementPreview(result);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to generate agreement preview");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      ignore = true;
    };
  }, [previewPayload, setAgreementPreview]);

  return (
    <div>
      <div className="font-mono text-sm uppercase tracking-[0.18em] text-blue-900">Step 5</div>
      <h2 className="mt-2 text-3xl font-semibold text-slate-950">Fee agreement preview</h2>
      <p className="mt-3 text-slate-600">Review the generated agreement summary.</p>

      {loading ? (
        <div className={`mt-8 p-6 text-slate-600 ${cardSurfaceClass}`}>
          Generating preview...
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
          {error}
        </div>
      ) : null}

      {!loading && !error && intake.agreementPreview ? (
        <div
          className={`prose mt-8 max-w-none p-6 text-slate-700 ${cardSurfaceClass}`}
          dangerouslySetInnerHTML={{
            __html: sanitizeDocumentHtml(intake.agreementPreview.html),
          }}
        />
      ) : null}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/addons")}
          className="text-slate-600 hover:text-slate-950"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => navigate("/intake/booking")}
          className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
