import { useNavigate } from "react-router-dom";
import { CalendarDays, CreditCard, FileText, ArrowRight } from "lucide-react";
import SectionTitle from "../layout/SectionTitle";
import Button from "../ui/Button";

export default function IntakeSection() {
  const navigate = useNavigate();

  return (
    <section id="intake" className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <SectionTitle
            eyebrow="Start Now / Intake"
            title="Start your"
            accent="online intake"
            subtitle="Begin with a guided multi-step flow that collects your package, case details, agreement preview, and consultation request."
          />

          <div className="mt-8 space-y-4">
            {[
              {
                icon: FileText,
                title: "Onboarding document",
                text: "Collect client basics, family-petition facts, and required document checklist items.",
              },
              {
                icon: CreditCard,
                title: "Payment information",
                text: "Capture payment preferences for manual office processing.",
              },
              {
                icon: CalendarDays,
                title: "Book consultation",
                text: "Request the required 15-minute Zoom or phone call.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-300">
                      {item.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <h3 className="text-2xl font-semibold text-white">
            Continue to guided intake
          </h3>
          <p className="mt-4 text-slate-300 leading-7">
            The full intake now happens in a dedicated step-by-step workflow.
            You’ll choose a package, enter client details, add case information,
            review your fee agreement preview, and request your consultation.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-7 text-slate-300">
            Engagement is not formally initiated until the first lawyer consultation
            confirms the adequacy of the submitted documents.
          </div>

          <Button
            type="button"
            className="mt-6 w-full rounded-2xl"
            onClick={() => navigate("/start")}
          >
            Continue to onboarding
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
