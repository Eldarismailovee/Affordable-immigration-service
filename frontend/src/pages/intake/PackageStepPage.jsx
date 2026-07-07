import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";

export default function PackageStepPage() {
  const navigate = useNavigate();
  const { intake, updateField } = useIntake();

  const packages = [
    {
      id: "guidance",
      title: "Attorney Guidance",
      price: "$1,000–$1,500",
      text: "Attorney-reviewed guidance for family petitions. Client files.",
    },
    {
      id: "filing",
      title: "Attorney-prepared filing package",
      price: "$2,000–$2,500",
      text: "Attorney-reviewed and prepared filing package for accepted matters. Subject to attorney review.",
    },
  ];

  function handlePackageKeyDown(event, packageId) {
    const index = packages.findIndex((item) => item.id === packageId);
    if (index === -1) {
      return;
    }

    let nextIndex = index;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (index + 1) % packages.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (index - 1 + packages.length) % packages.length;
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      updateField("selectedPackage", packageId);
      return;
    } else {
      return;
    }

    const nextId = packages[nextIndex].id;
    updateField("selectedPackage", nextId);
    document.getElementById(`package-option-${nextId}`)?.focus();
  }

  return (
    <div>
      <div className="font-mono text-sm uppercase tracking-[0.18em] text-blue-900">Step 1</div>
      <h2 id="package-step-title" className="mt-2 text-3xl font-semibold text-slate-950">
        Choose your package
      </h2>
      <p className="mt-3 text-slate-600">Select the level of attorney support you need.</p>

      <div
        role="radiogroup"
        aria-labelledby="package-step-title"
        className="mt-8 grid gap-4 md:grid-cols-2"
      >
        {packages.map((item) => {
          const selected = intake.selectedPackage === item.id;

          return (
            <button
              key={item.id}
              id={`package-option-${item.id}`}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => updateField("selectedPackage", item.id)}
              onKeyDown={(event) => handlePackageKeyDown(event, item.id)}
              className={`rounded-3xl border p-5 text-left transition ${
                selected
                  ? "border-blue-300 bg-blue-50 ring-1 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 font-mono text-blue-900">{item.price}</p>
              <p className="mt-3 text-base leading-7 text-slate-600">{item.text}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/intake/client")}
          className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
