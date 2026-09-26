// File: frontend/src/pages/Student/StudentDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ShieldCheck,
  LogOut,
  Clock,
  AlertCircle,
  Download,
  User,
  MapPin,
  CheckCircle2,
  Building2,
  Armchair,
  QrCode,
  Lock,
  BookOpen,
  Hash,
  CalendarClock,
  LayoutGrid,
} from "lucide-react";

import apiService from "../../services/api";

const API_ROOT = (
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8765"
).replace(/\/+$/, "").replace(/\/api$/, "");

const BRANCH_STYLES = {
  CS: "bg-indigo-500",
  IT: "bg-blue-500",
  ME: "bg-amber-500",
  CE: "bg-emerald-500",
  EE: "bg-pink-500",
  EC: "bg-violet-500",
};

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [seatData, setSeatData] = useState(null);
  const [roomLayout, setRoomLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [layoutError, setLayoutError] = useState("");

  const rollNo = localStorage.getItem("userRollNo");

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      if (!rollNo) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setDashboardError("");
      setLayoutError("");

      try {
        // Student information is the primary request.
        const response = await apiService.getStudentSeat(rollNo, {
          signal: controller.signal,
        });

        const student = response?.data;
        setSeatData(student);

        // Room layout is secondary. A layout failure must NOT break the
        // student's hall ticket or dashboard.
        const roomNo = student?.allocation?.room_no;
        if (roomNo && roomNo !== "N/A") {
          try {
            const layoutResponse = await axios.get(
              `${API_ROOT}/api/admin/room-layout/${encodeURIComponent(roomNo)}`,
              { signal: controller.signal }
            );

            const payload = layoutResponse?.data;
            const seats = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.seats)
              ? payload.seats
              : Array.isArray(payload?.layout)
              ? payload.layout
              : [];

            setRoomLayout(seats);
          } catch (layoutErr) {
            if (!axios.isCancel(layoutErr)) {
              console.error("Room layout error:", layoutErr);
              setRoomLayout([]);
              setLayoutError(
                "Room map is temporarily unavailable. Your room and seat allocation are still valid."
              );
            }
          }
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Student dashboard error:", error);
          setDashboardError(
            error?.response?.data?.detail ||
              "Unable to load your examination information. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    return () => controller.abort();
  }, [rollNo, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const personal = seatData?.personal_info || {};
  const exam = seatData?.exam_details || {};
  const allocation = seatData?.allocation || {};
  const live = seatData?.live_status || {};

  const studentName = personal.name || "Student";
  const branch = personal.branch || "N/A";
  const roomNo = allocation.room_no || "N/A";
  const seatNo = allocation.seat_no || "N/A";
  const shift = exam.shift || "N/A";
  const paperGroup = exam.paper_group_id || "N/A";
  const subject = exam.subject || "N/A";
  const subjectCode = exam.subject_code || "N/A";
  const attendance = live.attendance || "Absent";
  const isPresent = String(attendance).toLowerCase().includes("present");

  const sortedLayout = useMemo(() => {
    const parseSeat = (seat = "") => {
      const match = String(seat).match(/R(\d+)C(\d+)/i);
      return match ? [Number(match[1]), Number(match[2])] : [9999, 9999];
    };

    return [...roomLayout].sort((a, b) => {
      const [ar, ac] = parseSeat(a?.seat_no);
      const [br, bc] = parseSeat(b?.seat_no);
      return ac - bc || ar - br;
    });
  }, [roomLayout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
            <ShieldCheck size={26} />
          </div>
          <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-semibold text-slate-800">
            Loading student dashboard
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Retrieving your examination allocation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight">
                EcoSeat <span className="text-blue-600">AI</span>
              </div>
              <div className="text-[10px] font-medium text-slate-500">
                Student Examination Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <User size={15} />
              </div>
              <div className="leading-tight">
                <div className="max-w-[150px] truncate text-xs font-bold">
                  {studentName}
                </div>
                <div className="text-[10px] text-slate-500">{rollNo}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {/* PAGE INTRO */}
        <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Student Dashboard
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Welcome, {studentName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Your hall ticket, examination allocation, attendance status and
              room seating map are organized below.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Examination access active
          </div>
        </section>

        {dashboardError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={18} />
            <div>
              <p className="text-sm font-bold text-red-800">
                Unable to load dashboard
              </p>
              <p className="mt-1 text-sm text-red-700">{dashboardError}</p>
            </div>
          </div>
        )}

        {/* SUMMARY */}
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Assigned Room"
            value={roomNo}
            icon={<Building2 size={18} />}
            iconClass="bg-blue-50 text-blue-600"
          />
          <SummaryCard
            label="Seat Number"
            value={seatNo}
            icon={<Armchair size={18} />}
            iconClass="bg-violet-50 text-violet-600"
          />
          <SummaryCard
            label="Exam Shift"
            value={shift}
            icon={<Clock size={18} />}
            iconClass="bg-amber-50 text-amber-600"
          />
          <SummaryCard
            label="Attendance"
            value={isPresent ? "Verified" : "Pending"}
            icon={isPresent ? <CheckCircle2 size={18} /> : <Clock size={18} />}
            iconClass={
              isPresent
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-600"
            }
          />
        </section>

        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* LEFT COLUMN */}
          <aside className="space-y-6">
            <section
              className={`rounded-2xl border p-5 ${
                isPresent
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${
                    isPresent ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {isPresent ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Attendance status
                  </p>
                  <h2 className="mt-1 text-sm font-extrabold text-slate-900">
                    {isPresent
                      ? "Entry verified successfully"
                      : "Waiting for entry verification"}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {isPresent
                      ? "Your attendance has been recorded by the examination team."
                      : "Your status will update after verification at the examination hall."}
                  </p>
                </div>
              </div>
            </section>

            {/* HALL TICKET */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <QrCode size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold">Digital Hall Ticket</h2>
                    <p className="text-[11px] text-slate-500">
                      Secure examination entry pass
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <ShieldCheck size={11} />
                  Valid
                </span>
              </div>

              <div className="p-5">
                <div className="flex justify-center">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    {allocation.qr_code ? (
                      <img
                        src={allocation.qr_code}
                        alt="Student hall ticket QR code"
                        className="h-36 w-36 object-contain"
                      />
                    ) : (
                      <div className="flex h-36 w-36 items-center justify-center text-slate-300">
                        <QrCode size={42} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h3 className="text-base font-extrabold text-slate-950">
                    {studentName}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {rollNo} · {branch}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniInfo icon={<MapPin size={13} />} label="Room" value={roomNo} />
                  <MiniInfo icon={<Armchair size={13} />} label="Seat" value={seatNo} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MiniInfo icon={<BookOpen size={13} />} label="Paper Group" value={paperGroup} />
                  <MiniInfo icon={<Clock size={13} />} label="Session" value={shift} />
                </div>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <Lock size={11} />
                  Secure institutional examination pass
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Download size={16} />
              Download / Print Hall Ticket
            </button>
          </aside>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* ROOM MAP */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={18} className="text-blue-600" />
                      <h2 className="text-base font-extrabold text-slate-950">
                        Examination Room Layout
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Hall {roomNo} · Your assigned seat {seatNo} is highlighted.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-slate-500">
                    <Legend swatch="bg-blue-600" label="Your Seat" />
                    <Legend swatch="border-2 border-blue-400 bg-blue-50" label="Same Paper Group" />
                    <Legend swatch="bg-slate-400" label="Other Student" />
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Front / Invigilator Desk
                  </div>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {layoutError && (
                  <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    {layoutError}
                  </div>
                )}

                {sortedLayout.length > 0 ? (
                  <div className="overflow-x-auto pb-2">
                    <div className="grid min-w-[620px] grid-cols-10 gap-2.5">
                      {sortedLayout.map((student, index) => {
                        const isUser =
                          String(student?.roll_no || "").trim().toUpperCase() ===
                          String(rollNo || "").trim().toUpperCase();

                        const samePaper =
                          !isUser &&
                          student?.paper_group_id &&
                          student.paper_group_id === paperGroup;

                        const branchClass =
                          BRANCH_STYLES[student?.branch] || "bg-slate-500";

                        return (
                          <div
                            key={`${student?.seat_no || index}-${student?.roll_no || index}`}
                            title={`${student?.name || "Student"} | ${
                              student?.seat_no || "Seat"
                            } | ${student?.branch || "N/A"}`}
                            className={`relative flex aspect-square min-h-[52px] flex-col items-center justify-center rounded-xl border text-center transition ${
                              isUser
                                ? "z-10 border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100 ring-2 ring-blue-200 ring-offset-2"
                                : samePaper
                                ? "border-blue-400 bg-blue-50 text-blue-700"
                                : `border-transparent ${branchClass} text-white`
                            }`}
                          >
                            <span className="text-[9px] font-black leading-none">
                              {isUser ? "YOU" : student?.seat_no || index + 1}
                            </span>
                            {!isUser && student?.branch && (
                              <span className="mt-1 text-[8px] font-bold opacity-80">
                                {student.branch}
                              </span>
                            )}
                            {isUser && (
                              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                                <CheckCircle2 size={10} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                      <Armchair size={21} />
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-700">
                      Room layout unavailable
                    </p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                      Your assigned room and seat remain valid. The visual room
                      map will appear when layout data is available.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ALLOCATION */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Armchair size={18} />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-extrabold text-slate-950">
                    Seat Allocation
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your confirmed examination placement based on the current
                    allocation.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <InfoPill icon={<BookOpen size={12} />} label={`Paper Group: ${paperGroup}`} />
                    <InfoPill icon={<Building2 size={12} />} label={`Hall: ${roomNo}`} />
                    <InfoPill icon={<Armchair size={12} />} label={`Seat: ${seatNo}`} />
                  </div>
                </div>
              </div>
            </section>

            {/* EXAM INFORMATION */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-extrabold text-slate-950">
                  Examination Information
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Current student and examination allocation details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
                <DetailCard icon={<User size={15} />} label="Student" value={studentName} />
                <DetailCard icon={<Hash size={15} />} label="Roll Number" value={rollNo || "N/A"} />
                <DetailCard icon={<BookOpen size={15} />} label="Subject" value={subject} />
                <DetailCard icon={<Hash size={15} />} label="Subject Code" value={subjectCode} />
                <DetailCard icon={<BookOpen size={15} />} label="Department" value={branch} />
                <DetailCard icon={<CalendarClock size={15} />} label="Session" value={shift} />
                <DetailCard icon={<Building2 size={15} />} label="Room" value={roomNo} />
                <DetailCard icon={<Armchair size={15} />} label="Seat" value={seatNo} />
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[10px] font-medium text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© EcoSeat AI · Student Examination Portal</span>
          <span className="inline-flex items-center gap-1">
            <Lock size={10} /> Secure institutional access
          </span>
        </div>
      </footer>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, iconClass }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-base font-extrabold text-slate-950 sm:text-lg">
          {value}
        </p>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

const MiniInfo = ({ icon, label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-center gap-1.5 text-slate-400">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </div>
    <div className="mt-1.5 truncate text-xs font-extrabold text-slate-900">{value}</div>
  </div>
);

const Legend = ({ swatch, label }) => (
  <div className="flex items-center gap-1.5">
    <span className={`h-3 w-3 rounded ${swatch}`} />
    <span>{label}</span>
  </div>
);

const InfoPill = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">
    {icon}
    {label}
  </span>
);

const DetailCard = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-extrabold text-slate-900">
        {value || "N/A"}
      </p>
    </div>
  </div>
);

export default StudentDashboard;
