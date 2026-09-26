// File: frontend/src/pages/Signup.js

import React from "react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Database,
  Fingerprint,
  GraduationCap,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

/* ============================================================
   SIGNUP
============================================================ */

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* BRAND */}

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <ShieldCheck
                size={21}
                strokeWidth={2.2}
              />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="text-[17px] font-bold tracking-tight text-slate-950">
                  EcoSeat
                </span>

                <span className="text-[17px] font-bold tracking-tight text-blue-600">
                  AI
                </span>
              </div>

              <p className="hidden text-[10px] font-medium tracking-wide text-slate-500 sm:block">
                Examination Management Platform
              </p>
            </div>
          </button>

          {/* RIGHT */}

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 md:block">
              Already registered?
            </span>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              Sign in

              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="relative overflow-hidden">
        {/* BACKGROUND */}

        <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-blue-100/60 blur-3xl" />

        <div className="pointer-events-none absolute -right-40 bottom-10 h-[420px] w-[420px] rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-[1440px] grid-cols-1 gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-12 lg:py-16">
          {/* =================================================
              LEFT INFORMATION
          ================================================== */}

          <section className="mx-auto w-full max-w-[500px] lg:mx-0">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />

              Back to sign in
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2">
              <GraduationCap
                size={14}
                className="text-blue-600"
              />

              <span className="text-xs font-semibold text-blue-700">
                Student access
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">
              Your student account is
              <span className="block text-blue-600">
                already managed for you.
              </span>
            </h1>

            <p className="mt-5 max-w-[470px] text-base leading-7 text-slate-600">
              EcoSeat AI student accounts are created and managed
              through the classroom allocation system. Students do
              not need to create a separate account manually.
            </p>

            {/* BENEFITS */}

            <div className="mt-9 space-y-5">
              <FeatureRow
                icon={<Database size={18} />}
                title="Classroom allocation database"
                description="Your student profile is obtained from the examination and classroom allocation records."
              />

              <FeatureRow
                icon={<Fingerprint size={18} />}
                title="Existing student identity"
                description="Use your allocated student credentials to securely access your examination workspace."
              />

              <FeatureRow
                icon={<BookOpen size={18} />}
                title="Examination information"
                description="After sign in, you can access your assigned room, seat and examination information."
              />
            </div>

            {/* TRUST CARD */}

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Database-managed student access
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Student information remains linked with the
                    official classroom and examination allocation
                    data maintained by the institution.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              STUDENT ACCESS CARD
          ================================================== */}

          <section className="mx-auto w-full max-w-[650px] lg:mx-0 lg:ml-auto">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_70px_-25px_rgba(15,23,42,0.20)]">
              {/* CARD HEADER */}

              <div className="border-b border-slate-100 px-7 py-7 sm:px-9">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <User size={23} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                      Student account access
                    </h2>

                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      No separate student registration is required.
                    </p>
                  </div>
                </div>
              </div>

              {/* BODY */}

              <div className="px-7 py-8 sm:px-9">
                {/* IMPORTANT INFORMATION */}

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Database size={20} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-blue-900">
                        Student accounts are managed through the
                        classroom allocation system
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-blue-700">
                        Your student record is created from the
                        institution's classroom and examination
                        allocation data. Manual student account
                        creation is disabled.
                      </p>
                    </div>
                  </div>
                </div>

                {/* HOW TO ACCESS */}

                <div className="mt-7">
                  <p className="text-sm font-bold text-slate-900">
                    How to access your account
                  </p>

                  <div className="mt-4 space-y-3">
                    <AccessStep
                      number="1"
                      title="Open Sign in"
                      description="Go to the EcoSeat AI sign-in page."
                    />

                    <AccessStep
                      number="2"
                      title="Select Student"
                      description="Choose Student from the available account roles."
                    />

                    <AccessStep
                      number="3"
                      title="Enter your allocated credentials"
                      description="Use the student credentials available in the classroom allocation database."
                    />

                    <AccessStep
                      number="4"
                      title="Complete verification"
                      description="Complete the authentication process to open your student workspace."
                    />
                  </div>
                </div>

                {/* DATABASE STATUS */}

                <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        No manual registration required
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        If your student record has been included in
                        the classroom allocation system, use those
                        credentials directly on the sign-in page.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SIGN IN BUTTON */}

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  Go to Student Sign in

                  <ArrowRight size={17} />
                </button>

                {/* HELP */}

                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex items-start gap-3">
                    <Building2
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <p className="text-xs leading-5 text-slate-500">
                      If your student record is not available, contact
                      the examination administrator so your classroom
                      allocation information can be checked.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECURITY */}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Lock size={12} />

                Controlled access
              </div>

              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

              <div className="flex items-center gap-1.5">
                <Building2 size={12} />

                Institutional data
              </div>

              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} />

                EcoSeat AI
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

/* ============================================================
   FEATURE ROW
============================================================ */

const FeatureRow = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 max-w-[390px] text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
};

/* ============================================================
   ACCESS STEP
============================================================ */

const AccessStep = ({
  number,
  title,
  description,
}) => {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
        {number}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
};

export default Signup;