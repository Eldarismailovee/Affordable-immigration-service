import {
  CalendarDays,
  FileText,
  ShieldCheck,
  Upload,
} from "lucide-react";
import SectionTitle from "../layout/SectionTitle";

const steps = [
  {
    icon: FileText,
    title: "Choose your package",
    text: "Pick the level of attorney support that fits your case and see pricing upfront.",
  },
  {
    icon: Upload,
    title: "Complete intake & upload docs",
    text: "Submit your onboarding details, document checklist, and case information online.",
  },
  {
    icon: CalendarDays,
    title: "Book a 15-minute consultation",
    text: "Your engagement begins only after the first Zoom or phone call and document review.",
  },
  {
    icon: ShieldCheck,
    title: "Get prepared to file",
    text: "Once all required documents are received, your matter is filed within two weeks.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8"
    >
      <SectionTitle
        eyebrow="How it works"
        title="A streamlined"
        accent="a la carte flow"
        subtitle="Clients can choose a package, complete onboarding, review the fee agreement, submit payment information for manual processing, and schedule the first call in one guided experience."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Step {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {step.text}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}