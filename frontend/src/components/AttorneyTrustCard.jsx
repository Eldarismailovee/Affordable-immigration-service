import { ArrowRight, Scale } from "lucide-react";
import Button from "./ui/Button";
import { getPublicResponsibleAttorneyProfile } from "../constants/responsibleAttorney.js";

export default function AttorneyTrustCard() {
  const profile = getPublicResponsibleAttorneyProfile();

  if (profile.configured) {
    return (
      <article className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-400">
              <Scale className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.2em] text-slate-400">
                Responsible attorney
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{profile.name}</h2>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm text-slate-300">
            {profile.jurisdiction ? (
              <div>
                <dt className="font-medium text-slate-400">Licensed jurisdiction</dt>
                <dd>{profile.jurisdiction}</dd>
              </div>
            ) : null}
            {profile.barNumber ? (
              <div>
                <dt className="font-medium text-slate-400">Bar number</dt>
                <dd>{profile.barNumber}</dd>
              </div>
            ) : null}
            {profile.contactEmail ? (
              <div>
                <dt className="font-medium text-slate-400">Contact</dt>
                <dd>
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    className="text-amber-300 underline hover:text-amber-200"
                  >
                    {profile.contactEmail}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          <p className="mt-6 text-base leading-7 text-slate-300">{profile.publicText}</p>

          <Button to="/availability" variant="secondary" tone="dark" className="mt-6 w-full rounded-2xl">
            View availability
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-400">
            <Scale className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.2em] text-slate-400">
              Before representation begins
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Attorney review before acceptance
            </h2>
          </div>
        </div>

        <p className="mt-6 text-base leading-7 text-slate-300">
          Your matter is reviewed for conflicts, jurisdiction availability, and fit before the firm
          accepts representation or provides legal advice.
        </p>
        <p className="mt-4 text-base leading-7 text-slate-400">{profile.publicText}</p>

        <Button to="/availability" variant="secondary" tone="dark" className="mt-6 w-full rounded-2xl">
          View availability
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
