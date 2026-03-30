import { Link } from "react-router-dom";

export default function StartPage() {
  return (
    <div className="min-h-screen bg-[#040816] px-4 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
          Start now
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Begin your immigration intake
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          You’ll choose a package, enter your information, review pricing,
          preview your agreement, and request your consultation.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            to="/intake/package"
            className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
          >
            Start intake
          </Link>

          <Link
            to="/"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}