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
      title: "Attorney Filing",
      price: "$2,000–$2,500",
      text: "Attorney-prepared and attorney-filed package.",
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
      <div className="text-sm uppercase tracking-[0.18em] text-amber-400">Step 1</div>
      <h2 id="package-step-title" className="mt-2 text-3xl font-semibold">
        Choose your package
      </h2>
      <p className="mt-3 text-slate-300">Select the level of attorney support you need.</p>

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
                  ? "border-amber-400/50 bg-amber-400/10"
                  : "border-white/10 bg-slate-950/40 hover:border-white/20"
              }`}
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-amber-400">{item.price}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.text}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/intake/client")}
          className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
