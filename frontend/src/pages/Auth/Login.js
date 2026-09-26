// File: frontend/src/pages/Login.js

import React, { useRef, useState } from "react";

import {
  ShieldCheck,
  User,
  Key,
  ArrowRight,
  Loader2,
  AlertCircle,
  Fingerprint,
  Mail,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  UserPlus,
  LogIn,
  ArrowLeft,
  LayoutDashboard,
  QrCode,
  BarChart3,
  Users,
  Sparkles,
  Lock,
  Building2,
  Database,
  Menu,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ============================================================
   API CONFIGURATION
============================================================ */

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8765";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================================================
   SHARED STYLES
============================================================ */

const inputClass =
  "h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

/* ============================================================
   LOGIN PAGE
============================================================ */

const Login = () => {
  const navigate = useNavigate();

  const homeRef = useRef(null);
  const platformRef = useRef(null);
  const workflowRef = useRef(null);
  const securityRef = useRef(null);

  const [authMode, setAuthMode] = useState("login");

  const [formData, setFormData] = useState({
    fullName: "",
    rollNo: "",
    secretKey: "",
    email: "",
    role: "student",
    otp: "",
  });

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ==========================================================
     PAGE NAVIGATION
  ========================================================== */

  const scrollToSection = (ref) => {
    if (!ref?.current) return;

    setMobileMenuOpen(false);

    window.scrollTo({
      top: ref.current.offsetTop - 72,
      behavior: "smooth",
    });
  };

  /* ==========================================================
     FORM HANDLING
  ========================================================== */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (successMsg) {
      setSuccessMsg("");
    }
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setError("");
    setSuccessMsg("");
    setStep(1);
    setShowPassword(false);

    setFormData((previous) => ({
      ...previous,

      // Student accounts are managed through classroom allocation.
      // Therefore Create Account defaults to Invigilator.
      role:
        mode === "signup" && previous.role === "student"
          ? "invigilator"
          : previous.role,

      otp: "",
    }));
  };

  /* ==========================================================
     SIGNUP
  ========================================================== */

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMsg("");

    /*
      Student registration is intentionally disabled.

      Student records are managed through the classroom
      allocation / StudentSeating database.
    */
    if (formData.role === "student") {
      setError(
        "Student accounts are managed through the classroom allocation system. Please use Sign in."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/register", {
        full_name: formData.fullName.trim(),
        username: formData.rollNo.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.secretKey.trim(),
        role: formData.role.toLowerCase(),
      });

      if (response.status === 200 || response.status === 201) {
        setSuccessMsg(
          "Account created successfully. You can now sign in."
        );

        setAuthMode("login");
        setStep(1);

        setFormData((previous) => ({
          ...previous,
          fullName: "",
          secretKey: "",
          otp: "",
        }));
      } else {
        setError(
          "Registration failed. Please check your information."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Registration failed. This account may already exist."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================================================
     REQUEST OTP
  ========================================================== */

  const handleRequestOTP = async (event) => {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await api.post("/api/auth/request-otp", {
        username: formData.rollNo.trim(),
        password: formData.secretKey.trim(),
        role: formData.role.toLowerCase(),
        email: formData.email.trim().toLowerCase(),
      });

      if (
        response.data?.status === "success" ||
        response.status === 200
      ) {
        setStep(2);
      } else {
        setError(
          "Unable to continue. Please verify your credentials."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Authentication failed. Please verify your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================================================
     VERIFY OTP
  ========================================================== */

  const handleVerifyOTP = async (event) => {
    event.preventDefault();

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/verify-otp", {
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp.trim(),
      });

      if (
        response.data?.status === "success" &&
        response.data?.token
      ) {
        executeSecureSessionRedirect(response.data);
      } else {
        setError(
          "Invalid verification code. Please try again."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "OTP verification failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================================================
     SESSION + REDIRECT
  ========================================================== */

  const executeSecureSessionRedirect = (authResponse) => {
    const {
      token,
      role,
      assigned_room,
      username,
    } = authResponse;

    const targetRole = (
      role || formData.role
    )
      .toLowerCase()
      .trim();

    const activeUsername =
      username || formData.rollNo.trim();

    /*
      IMPORTANT:
      Room is taken only from the backend.
      No room number is hardcoded here.
    */
    const activeRoom = assigned_room || "";

    localStorage.setItem("userRole", targetRole);
    localStorage.setItem("role", targetRole);

    localStorage.setItem(
      "userEmail",
      formData.email.trim().toLowerCase()
    );

    localStorage.setItem(
      "userRollNo",
      activeUsername
    );

    localStorage.setItem(
      "isLoggedIn",
      "true"
    );

    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "authToken",
      token
    );

    localStorage.setItem(
      "username",
      activeUsername
    );

    if (targetRole === "student" && activeRoom) {
      localStorage.setItem("assigned_room", activeRoom);
      localStorage.setItem("assignedRoomNo", activeRoom);
    } else {
      // Invigilator room is selected inside Invigilator Dashboard.
      localStorage.removeItem("assigned_room");
      localStorage.removeItem("assignedRoomNo");
      sessionStorage.removeItem("invigilator_selected_room");
    }

    window.dispatchEvent(
      new Event("authChange")
    );

    const routeMap = {
      admin: "/admin/dashboard",
      invigilator: "/invigilator/dashboard",
      student: "/student/dashboard",
    };

    navigate(
      routeMap[targetRole] ||
        "/student/dashboard",
      {
        replace: true,
      }
    );
  };

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div
      ref={homeRef}
      className="min-h-screen bg-white font-sans text-slate-900 antialiased"
    >
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="fixed left-0 top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">

          {/* BRAND */}

          <button
            type="button"
            onClick={() => scrollToSection(homeRef)}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
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

                <span className="text-[17px] font-bold tracking-tight text-indigo-600">
                  AI
                </span>
              </div>

              <p className="hidden text-[10px] font-medium tracking-wide text-slate-500 sm:block">
                Examination Management Platform
              </p>
            </div>
          </button>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-1 lg:flex">
            <NavButton
              onClick={() => scrollToSection(homeRef)}
            >
              Home
            </NavButton>

            <NavButton
              onClick={() => scrollToSection(platformRef)}
            >
              Platform
            </NavButton>

            <NavButton
              onClick={() => scrollToSection(workflowRef)}
            >
              How it works
            </NavButton>

            <NavButton
              onClick={() => scrollToSection(securityRef)}
            >
              Security
            </NavButton>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-semibold text-emerald-700">
                Platform Online
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen((previous) => !previous)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation"
            >
              {mobileMenuOpen ? (
                <X size={19} />
              ) : (
                <Menu size={19} />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE NAV */}

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-3 lg:hidden">
            <div className="mx-auto max-w-[1440px] space-y-1">
              <MobileNavButton
                onClick={() => scrollToSection(homeRef)}
              >
                Home
              </MobileNavButton>

              <MobileNavButton
                onClick={() => scrollToSection(platformRef)}
              >
                Platform
              </MobileNavButton>

              <MobileNavButton
                onClick={() => scrollToSection(workflowRef)}
              >
                How it works
              </MobileNavButton>

              <MobileNavButton
                onClick={() => scrollToSection(securityRef)}
              >
                Security
              </MobileNavButton>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ===================================================
            HERO
        ==================================================== */}

        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50/70 pt-[72px]">
          <div className="pointer-events-none absolute -left-32 top-32 h-[380px] w-[380px] rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="pointer-events-none absolute -right-32 top-20 h-[380px] w-[380px] rounded-full bg-blue-100/60 blur-3xl" />

          <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 py-14 sm:px-8 lg:min-h-[calc(100vh-72px)] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-12 lg:py-16">

            {/* HERO LEFT */}

            <div className="mx-auto w-full max-w-[680px] lg:mx-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-2">
                <Sparkles
                  size={14}
                  className="text-indigo-600"
                />

                <span className="text-xs font-semibold text-indigo-700">
                  Intelligent examination operations
                </span>
              </div>

              <h1 className="mt-6 max-w-[680px] text-[40px] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[58px]">
                Smarter examination
                <span className="block text-indigo-600">
                  management for campuses.
                </span>
              </h1>

              <p className="mt-6 max-w-[600px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Manage seating allocation, candidate
                verification and attendance from one
                connected examination platform.
              </p>

              {/* BENEFITS */}

              <div className="mt-8 grid max-w-[600px] grid-cols-1 gap-3 sm:grid-cols-2">
                <BenefitItem text="Intelligent seat allocation" />
                <BenefitItem text="Candidate verification" />
                <BenefitItem text="Attendance monitoring" />
                <BenefitItem text="Role-based workspaces" />
              </div>

              {/* MINI DASHBOARD */}

              <div className="mt-9 max-w-[610px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_15px_45px_-25px_rgba(15,23,42,0.28)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Examination operations
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Platform overview
                    </p>
                  </div>

                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-100">
                  <OverviewItem
                    label="Platform"
                    value="Online"
                  />

                  <OverviewItem
                    label="Verification"
                    value="OTP"
                  />

                  <OverviewItem
                    label="Workspaces"
                    value="3 Roles"
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                AUTHENTICATION CARD
            ================================================== */}

            <div className="flex w-full justify-center lg:justify-end">
              <div className="w-full max-w-[465px]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_65px_-30px_rgba(15,23,42,0.32)]">

                  {/* AUTH HEADER */}

                  <div className="border-b border-slate-100 px-6 pb-5 pt-6 sm:px-7">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        {step === 2 ? (
                          <Fingerprint size={22} />
                        ) : (
                          <ShieldCheck size={22} />
                        )}
                      </div>

                      <div>
                        <h2 className="text-[22px] font-bold tracking-tight text-slate-950">
                          {authMode === "signup"
                            ? "Create your account"
                            : step === 1
                            ? "Welcome back"
                            : "Verify your identity"}
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {authMode === "signup"
                            ? "Create an administrator or invigilator account."
                            : step === 1
                            ? "Sign in to your examination workspace."
                            : "Enter the verification code sent to your email."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AUTH BODY */}

                  <div className="px-6 py-6 sm:px-7">

                    {/* MODE SWITCH */}

                    {step === 1 && (
                      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() =>
                            switchAuthMode("login")
                          }
                          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                            authMode === "login"
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <LogIn size={15} />
                          Sign in
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            switchAuthMode("signup")
                          }
                          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                            authMode === "signup"
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <UserPlus size={15} />
                          Create account
                        </button>
                      </div>
                    )}

                    {/* FORM */}

                    <form
                      className="space-y-4"
                      onSubmit={
                        authMode === "signup"
                          ? handleSignup
                          : step === 1
                          ? handleRequestOTP
                          : handleVerifyOTP
                      }
                    >

                      {/* FULL NAME */}

                      {authMode === "signup" && (
                        <FormField
                          label="Full name"
                          icon={<User size={17} />}
                        >
                          <input
                            type="text"
                            name="fullName"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            autoComplete="name"
                            className={inputClass}
                          />
                        </FormField>
                      )}

                      {/* LOGIN / REGISTRATION FIELDS */}

                      {(authMode === "signup" || step === 1) && (
                        <>
                          <FormField
                            label="Account role"
                            icon={<Shield size={17} />}
                          >
                            <select
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              className={`${inputClass} cursor-pointer appearance-none bg-white`}
                            >
                              {/* Student only appears while signing in */}
                              {authMode === "login" && (
                                <option value="student">
                                  Student
                                </option>
                              )}

                              <option value="invigilator">
                                Invigilator
                              </option>

                              <option value="admin">
                                Administrator
                              </option>
                            </select>
                          </FormField>

                          <FormField
                            label="Institutional email"
                            icon={<Mail size={17} />}
                          >
                            <input
                              type="email"
                              name="email"
                              placeholder="name@university.edu"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              autoComplete="email"
                              className={inputClass}
                            />
                          </FormField>

                          <FormField
                            label={
                              formData.role === "admin"
                                ? "Admin username"
                                : formData.role === "invigilator"
                                ? "Invigilator ID"
                                : "Roll number"
                            }
                            icon={<User size={17} />}
                          >
                            <input
                              type="text"
                              name="rollNo"
                              placeholder={
                                formData.role === "admin"
                                  ? "Enter admin username"
                                  : formData.role === "invigilator"
                                  ? "Enter invigilator ID"
                                  : "Enter university roll number"
                              }
                              value={formData.rollNo}
                              onChange={handleInputChange}
                              required
                              autoComplete="username"
                              className={inputClass}
                            />
                          </FormField>

                          <FormField
                            label={
                              formData.role === "student"
                                ? "Branch / Student Secret Key"
                                : "Password"
                            }
                            icon={<Key size={17} />}
                          >
                            <input
                              type={
                                showPassword
                                  ? "text"
                                  : "password"
                              }
                              name="secretKey"
                              placeholder={
                                formData.role === "student"
                                  ? "Enter your branch (example: Cybersecurity)"
                                  : authMode === "signup"
                                  ? "Create a secure password"
                                  : "Enter your password"
                              }
                              value={formData.secretKey}
                              onChange={handleInputChange}
                              required
                              autoComplete={
                                authMode === "signup"
                                  ? "new-password"
                                  : "current-password"
                              }
                              className={`${inputClass} pr-12`}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword(
                                  (previous) => !previous
                                )
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                              aria-label={
                                showPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </FormField>
                        </>
                      )}

                      {/* STUDENT REGISTRATION INFORMATION */}

                      {authMode === "signup" && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                          <div className="flex items-start gap-3">
                            <Database
                              size={18}
                              className="mt-0.5 shrink-0 text-blue-600"
                            />

                            <p className="text-sm leading-5 text-blue-700">
                              Student accounts are managed through the
                              classroom allocation system. Students
                              should use{" "}
                              <span className="font-semibold">
                                Sign in
                              </span>{" "}
                              with their allocated database
                              credentials.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* OTP */}

                      {authMode === "login" && step === 2 && (
                        <div>
                          <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                            <div className="flex gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                <Mail size={16} />
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500">
                                  Verification code sent to
                                </p>

                                <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                                  {formData.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Verification code
                          </label>

                          <input
                            type="text"
                            inputMode="numeric"
                            name="otp"
                            maxLength={6}
                            placeholder="000000"
                            value={formData.otp}
                            onChange={handleInputChange}
                            required
                            autoFocus
                            className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-center text-xl font-bold tracking-[0.4em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setStep(1);
                              setError("");

                              setFormData((previous) => ({
                                ...previous,
                                otp: "",
                              }));
                            }}
                            className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
                          >
                            <ArrowLeft size={15} />
                            Back to sign in
                          </button>
                        </div>
                      )}

                      {/* ERROR */}

                      {error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
                          <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0 text-red-600"
                          />

                          <p className="text-sm leading-5 text-red-700">
                            {error}
                          </p>
                        </div>
                      )}

                      {/* SUCCESS */}

                      {successMsg && (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                          <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />

                          <p className="text-sm leading-5 text-emerald-700">
                            {successMsg}
                          </p>
                        </div>
                      )}

                      {/* SUBMIT */}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? (
                          <>
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />

                            Processing...
                          </>
                        ) : (
                          <>
                            {authMode === "signup"
                              ? "Create account"
                              : step === 1
                              ? "Continue"
                              : "Verify & sign in"}

                            <ArrowRight size={17} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                      <Lock size={13} />

                      <span>
                        Protected institutional access
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={13} />
                  Authentication protected by EcoSeat AI
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            ROLE PLATFORM
        ==================================================== */}

        <section
          ref={platformRef}
          className="bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading
              eyebrow="Role-based platform"
              title="One platform for every examination role"
              description="Dedicated workspaces keep administration, invigilation and student access organized in one system."
            />

            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              <RoleCard
                icon={<LayoutDashboard size={22} />}
                title="Administrator"
                description="Manage examination rooms, seating allocation and operational monitoring."
                features={[
                  "Seating allocation",
                  "Room configuration",
                  "Examination analytics",
                ]}
              />

              <RoleCard
                icon={<QrCode size={22} />}
                title="Invigilator"
                description="Verify candidates and manage attendance for assigned examination rooms."
                features={[
                  "Candidate verification",
                  "Attendance tracking",
                  "Room operations",
                ]}
              />

              <RoleCard
                icon={<User size={22} />}
                title="Student"
                description="Access personal examination seating and room information from a dedicated workspace."
                features={[
                  "Seat allocation",
                  "Room information",
                  "Personal examination access",
                ]}
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            WORKFLOW
        ==================================================== */}

        <section
          ref={workflowRef}
          className="border-y border-slate-200 bg-slate-50 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading
              eyebrow="Platform workflow"
              title="A connected examination workflow"
              description="Prepare examination data, allocate seats, verify candidates and monitor attendance through a structured process."
            />

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <WorkflowCard
                number="01"
                icon={<Database size={20} />}
                title="Import data"
                text="Add candidate, examination and room information."
              />

              <WorkflowCard
                number="02"
                icon={<Sparkles size={20} />}
                title="Allocate seating"
                text="Process room capacity and examination seating requirements."
              />

              <WorkflowCard
                number="03"
                icon={<Fingerprint size={20} />}
                title="Verify candidates"
                text="Confirm candidate identity and record examination attendance."
              />

              <WorkflowCard
                number="04"
                icon={<BarChart3 size={20} />}
                title="Monitor operations"
                text="Review attendance and examination information from the administrative workspace."
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            SECURITY
        ==================================================== */}

        <section
          ref={securityRef}
          className="bg-white px-5 py-20 sm:px-8 lg:px-12"
        >
          <div className="mx-auto max-w-[1240px] rounded-3xl border border-slate-200 bg-white px-7 py-10 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.22)] sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                <ShieldCheck size={22} />
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Controlled access for examination operations
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Authentication, OTP verification and
                role-based workspaces help control access
                to examination functions and information.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-0">
              <SecurityBadge
                icon={<Users size={17} />}
                text="Role Based"
              />

              <SecurityBadge
                icon={<Fingerprint size={17} />}
                text="OTP Verification"
              />

              <SecurityBadge
                icon={<Shield size={17} />}
                text="Access Control"
              />

              <SecurityBadge
                icon={<Building2 size={17} />}
                text="Institutional"
              />
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ShieldCheck size={18} />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                EcoSeat AI
              </p>

              <p className="text-xs text-slate-500">
                Examination Management Platform
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Ramdeobaba University · Examination Management Environment
          </p>
        </div>
      </footer>
    </div>
  );
};

/* ============================================================
   FORM FIELD
============================================================ */

const FormField = ({
  label,
  icon,
  children,
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {label}
    </label>

    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
        {icon}
      </div>

      {children}
    </div>
  </div>
);

/* ============================================================
   NAVIGATION
============================================================ */

const NavButton = ({
  children,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
  >
    {children}
  </button>
);

const MobileNavButton = ({
  children,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
  >
    {children}
  </button>
);

/* ============================================================
   SECTION HEADING
============================================================ */

const SectionHeading = ({
  eyebrow,
  title,
  description,
}) => (
  <div className="mx-auto max-w-2xl text-center">
    <p className="text-sm font-semibold text-indigo-600">
      {eyebrow}
    </p>

    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
      {title}
    </h2>

    <p className="mt-4 text-base leading-7 text-slate-600">
      {description}
    </p>
  </div>
);

/* ============================================================
   BENEFIT ITEM
============================================================ */

const BenefitItem = ({ text }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50">
      <CheckCircle2
        size={15}
        className="text-emerald-600"
      />
    </div>

    <span className="text-sm font-medium text-slate-700">
      {text}
    </span>
  </div>
);

/* ============================================================
   OVERVIEW ITEM
============================================================ */

const OverviewItem = ({
  label,
  value,
}) => (
  <div className="p-4 sm:p-5">
    <p className="text-xs font-medium text-slate-500">
      {label}
    </p>

    <p className="mt-2 text-base font-bold text-slate-900 sm:text-lg">
      {value}
    </p>
  </div>
);

/* ============================================================
   ROLE CARD
============================================================ */

const RoleCard = ({
  icon,
  title,
  description,
  features,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/50">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
      {icon}
    </div>

    <h3 className="mt-5 text-lg font-bold text-slate-950">
      {title}
    </h3>

    <p className="mt-2 text-sm leading-6 text-slate-600">
      {description}
    </p>

    <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
      {features.map((feature) => (
        <div
          key={feature}
          className="flex items-center gap-2.5"
        >
          <CheckCircle2
            size={15}
            className="shrink-0 text-emerald-600"
          />

          <span className="text-sm font-medium text-slate-700">
            {feature}
          </span>
        </div>
      ))}
    </div>
  </article>
);

/* ============================================================
   WORKFLOW CARD
============================================================ */

const WorkflowCard = ({
  number,
  icon,
  title,
  text,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-center justify-between">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <span className="text-sm font-bold text-slate-300">
        {number}
      </span>
    </div>

    <h3 className="mt-5 text-base font-bold text-slate-900">
      {title}
    </h3>

    <p className="mt-2 text-sm leading-6 text-slate-500">
      {text}
    </p>
  </article>
);

/* ============================================================
   SECURITY BADGE
============================================================ */

const SecurityBadge = ({
  icon,
  text,
}) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50">
    <span className="text-indigo-600">
      {icon}
    </span>

    <span className="whitespace-nowrap text-xs font-semibold text-slate-700">
      {text}
    </span>
  </div>
);

export default Login;