import { Outlet } from "react-router-dom";

export default function IntakeLayout() {
  return (
    <div className="min-h-screen bg-[#040816] text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8">
          <a
            href="/"
            className="text-sm font-medium text-amber-400 hover:text-amber-300"
          >
            ← Back to home
          </a>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Start your intake
          </h1>
          <p className="mt-3 text-slate-300">
            Complete each step to begin your immigration matter.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}