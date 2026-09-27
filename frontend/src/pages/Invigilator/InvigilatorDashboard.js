import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import {
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Loader2,
  MapPin,
  QrCode,
  Hammer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Lock,
  Users,
  UserX,
  Armchair,
  Activity,
  Search,
  Building2,
  Clock,
  Check,
} from "lucide-react";

import axios from "axios";

// File: frontend/src/pages/Invigilator/InvigilatorDashboard.js

const API_ROOT = (
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8765"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const API_BASE_URL = `${API_ROOT}/api`;

const InvigilatorDashboard = () => {
  /* =========================================================
     EXISTING LOGIC — UNCHANGED
  ========================================================= */

  const invigUsername =
    localStorage.getItem("username") || "";

  const [rooms, setRooms] = useState([]);
  const [roomNo, setRoomNo] = useState("");
  const [roomsLoading, setRoomsLoading] = useState(true);

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  /* =========================================================
     QUICK ACTION STATES
  ========================================================= */

  const [scanRollNo, setScanRollNo] = useState("");

  const [scanStatus, setScanStatus] = useState({
    type: "idle",
    message: "",
  });

  const [flagTableId, setFlagTableId] = useState("");

  const [flagStatus, setFlagStatus] = useState({
    type: "idle",
    message: "",
  });

  /* =========================================================
     ATTENDANCE
  ========================================================= */

  const [togglingRoll, setTogglingRoll] =
    useState(null);

  /* =========================================================
     EXPORT
  ========================================================= */

  const [exportFilters, setExportFilters] =
    useState({
      branch: "All",
      year: "All",
      subject: "All",
    });

  const [isExporting, setIsExporting] =
    useState(false);

  const abortControllerRef = useRef(null);

  /* =========================================================
     LOAD ALL CONFIGURED ROOMS
  ========================================================= */

  useEffect(() => {
    let active = true;

    const loadRooms = async () => {
      setRoomsLoading(true);

      try {
        const response = await axios.get(
          `${API_BASE_URL}/invigilator/rooms`
        );

        if (!active) return;

        const list = Array.isArray(response.data)
          ? response.data
          : [];

        setRooms(list);

        const previous =
          sessionStorage.getItem("invigilator_selected_room") || "";

        const stillExists = list.some(
          (room) => String(room.room_no) === String(previous)
        );

        setRoomNo(stillExists ? previous : "");
      } catch (err) {
        if (!active) return;

        setRooms([]);
        setRoomNo("");
        setError(
          err.response?.data?.detail ||
            "Unable to load configured examination rooms."
        );
      } finally {
        if (active) {
          setRoomsLoading(false);
          setLoading(false);
        }
      }
    };

    loadRooms();

    return () => {
      active = false;
    };
  }, []);

  const handleRoomChange = (event) => {
    const selected = event.target.value;

    setRoomNo(selected);
    setData(null);
    setError(null);
    setScanRollNo("");
    setFlagTableId("");

    if (selected) {
      sessionStorage.setItem(
        "invigilator_selected_room",
        selected
      );
    } else {
      sessionStorage.removeItem(
        "invigilator_selected_room"
      );
    }
  };

  /* =========================================================
     FETCH ROOM STREAM
  ========================================================= */

  const fetchRoomStream = useCallback(
    async (isInitial = false) => {
      if (!roomNo) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (isInitial) {
        setLoading(true);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current =
        new AbortController();

      try {
        const res = await axios.get(
          `${API_BASE_URL}/invigilator/dashboard-stream/${roomNo}`,
          {
            signal:
              abortControllerRef.current.signal,
          }
        );

        setData(res.data);
        setError(null);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        }

        console.error(
          "Telemetry Stream Error:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Failed to load room information."
        );
      } finally {
        if (isInitial) {
          setLoading(false);
        }
      }
    },
    [roomNo]
  );

  /* =========================================================
     AUTO REFRESH
  ========================================================= */

  useEffect(() => {
    fetchRoomStream(true);

    const interval = setInterval(() => {
      fetchRoomStream(false);
    }, 10000);

    return () => {
      clearInterval(interval);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRoomStream]);

  /* =========================================================
     VERIFY STUDENT
  ========================================================= */

  const handleGateScan = async (e) => {
    e.preventDefault();

    if (!scanRollNo.trim()) {
      return;
    }

    setScanStatus({
      type: "loading",
      message: "Verifying candidate...",
    });

    try {
      const res = await axios.post(
        `${API_BASE_URL}/invigilator/scan-gate/${roomNo}`,
        {
          roll_no: scanRollNo.trim(),
          actor_username: invigUsername,
        }
      );

      setScanStatus({
        type: "success",
        message:
          res.data.message ||
          `Candidate verified at seat ${res.data.assigned_seat}`,
      });

      setScanRollNo("");

      fetchRoomStream(false);

      setTimeout(() => {
        setScanStatus({
          type: "idle",
          message: "",
        });
      }, 4000);
    } catch (err) {
      setScanStatus({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Candidate verification failed.",
      });
    }
  };

  /* =========================================================
     ATTENDANCE TOGGLE
  ========================================================= */

  const handleToggleAttendance = async (
    student
  ) => {
    const newStatus =
      student.attendance_status === "Present"
        ? "Absent"
        : "Present";

    setTogglingRoll(student.roll_no);

    setData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        registry: prev.registry.map((s) =>
          s.roll_no === student.roll_no
            ? {
                ...s,
                attendance_status: newStatus,
              }
            : s
        ),
      };
    });

    try {
      await axios.patch(
        `${API_BASE_URL}/invigilator/toggle-attendance`,
        {
          roll_no: student.roll_no,
          status: newStatus,
          room_no: roomNo,
          actor_username: invigUsername,
        }
      );
    } catch (err) {
      console.error(
        "Attendance Toggle Failed:",
        err
      );

      fetchRoomStream(false);
    } finally {
      setTogglingRoll(null);
    }
  };

  /* =========================================================
     FLAG DAMAGED SEAT
  ========================================================= */

  const handleFlagSeat = async (e) => {
    e.preventDefault();

    if (!flagTableId.trim()) {
      return;
    }

    setFlagStatus({
      type: "loading",
      message: "Reporting damaged seat...",
    });

    try {
      const res = await axios.post(
        `${API_BASE_URL}/invigilator/flag-broken-seat`,
        {
          room_no: roomNo.trim(),
          table_id: flagTableId
            .trim()
            .toUpperCase(),
          actor_username: invigUsername,
        }
      );

      setFlagStatus({
        type: "success",
        message:
          res.data.message ||
          "Damaged seat reported successfully.",
      });

      setFlagTableId("");

      fetchRoomStream(false);

      setTimeout(() => {
        setFlagStatus({
          type: "idle",
          message: "",
        });
      }, 5000);
    } catch (err) {
      setFlagStatus({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Failed to report damaged seat.",
      });
    }
  };

  /* =========================================================
     PDF EXPORT
  ========================================================= */

  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      const params = {
        room_no: roomNo,
        branch: exportFilters.branch,
        year: exportFilters.year,
        subject: exportFilters.subject,
      };

      await axios.get(
        `${API_BASE_URL}/invigilator/export-data`,
        {
          params,
          responseType: "blob",
        }
      );

      window.print();
    } catch (err) {
      console.error(
        "Failed to export dataset for PDF:",
        err
      );
    } finally {
      setIsExporting(false);
    }
  };

  /* =========================================================
     SEAT STYLE
  ========================================================= */

  const getSeatStyle = (status) => {
    if (status?.includes("Present")) {
      return {
        card:
          "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300 hover:shadow-md",
        badge:
          "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
      };
    }

    if (status === "Pending Admin Reroute") {
      return {
        card:
          "border-amber-200 bg-amber-50/70 hover:border-amber-300 hover:shadow-md",
        badge:
          "bg-amber-100 text-amber-700",
        dot: "bg-amber-500",
      };
    }

    return {
      card:
        "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md",
      badge: "bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    };
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* =====================================================
          TOP NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 sm:px-7 lg:px-9">
          {/* BRAND */}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <ShieldCheck
                size={21}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span className="text-base font-bold tracking-tight text-slate-950">
                  EcoSeat
                </span>

                <span className="text-base font-bold tracking-tight text-blue-600">
                  AI
                </span>
              </div>

              <p className="hidden text-[10px] font-medium text-slate-500 sm:block">
                Examination Management Platform
              </p>
            </div>
          </div>

          {/* USER / ROOM */}

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
              <MapPin size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-slate-500">
                {roomNo ? "Selected Room" : "Choose Room"}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {roomNo ? `Hall ${roomNo}` : "Not selected"}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchRoomStream(true)
              }
              disabled={loading}
              title="Refresh room data"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            <div className="hidden h-8 w-px bg-slate-200 md:block" />

            <div className="hidden items-center gap-3 md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold uppercase text-blue-700">
                {invigUsername
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {invigUsername}
                </p>

                <p className="text-[10px] text-slate-500">
                  Invigilator
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <main className="mx-auto max-w-[1600px] px-5 py-7 sm:px-7 lg:px-9">
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-950">
                  Select Examination Room
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Choose the room you are currently invigilating. You can switch rooms whenever required.
              </p>
            </div>

            <div className="w-full lg:w-[360px]">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Examination Room
              </label>
              <select
                value={roomNo}
                onChange={handleRoomChange}
                disabled={roomsLoading}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
              >
                <option value="">
                  {roomsLoading ? "Loading rooms..." : "Select a room"}
                </option>
                {rooms.map((room) => (
                  <option key={room.room_no} value={room.room_no}>
                    Room {room.room_no}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!roomsLoading && rooms.length === 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              No rooms are configured yet. Admin must upload/configure rooms first.
            </div>
          )}
        </section>

        {/* ===================================================
            PAGE HEADER
        ==================================================== */}

        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-semibold text-emerald-700">
                Live examination session
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Invigilator Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor candidates, verify entry,
              update attendance and manage room
              issues for the examination room you select.
            </p>
          </div>

          {/* MOBILE ROOM */}

          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 sm:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600">
              <Building2 size={17} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                Selected room
              </p>

              <p className="text-sm font-bold text-slate-900">
                Hall {roomNo}
              </p>
            </div>

            <Lock
              size={13}
              className="ml-auto text-blue-500"
            />
          </div>
        </div>

        {/* ===================================================
            GLOBAL ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to load room information
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            METRICS
        ==================================================== */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricCard
            label="Allocated"
            value={
              data?.room_metrics
                ?.allocated_candidates || 0
            }
            icon={<Users size={19} />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <MetricCard
            label="Present"
            value={
              data?.room_metrics
                ?.verified_count || 0
            }
            icon={<UserCheck size={19} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <MetricCard
            label="Absent / Unchecked"
            value={
              data?.room_metrics
                ?.absent_count || 0
            }
            icon={<UserX size={19} />}
            iconClass="bg-red-50 text-red-600"
          />

          <MetricCard
            label="Damaged Seats"
            value={
              data?.room_metrics
                ?.broken_chairs_count || 0
            }
            icon={
              <AlertTriangle size={19} />
            }
            iconClass="bg-amber-50 text-amber-600"
          />

          <MetricCard
            label="Integrity"
            value={
              data?.room_metrics
                ?.integrity_index || "0%"
            }
            icon={<Activity size={19} />}
            iconClass="bg-violet-50 text-violet-600"
            fullMobile
          />
        </div>

        {/* ===================================================
            MAIN WORKSPACE
        ==================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          {/* =================================================
              STUDENT VERIFICATION
          ================================================== */}

          <ActionCard
            icon={<QrCode size={20} />}
            iconClass="bg-blue-50 text-blue-600"
            title="Candidate Verification"
            description="Verify a student's roll number before allowing examination hall entry."
          >
            <form
              onSubmit={handleGateScan}
              className="mt-5"
            >
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Candidate roll number
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Enter or scan roll number"
                    value={scanRollNo}
                    onChange={(e) =>
                      setScanRollNo(
                        e.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    scanStatus.type ===
                    "loading"
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {scanStatus.type ===
                  "loading" ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <UserCheck size={16} />
                  )}

                  Verify candidate
                </button>
              </div>
            </form>

            {scanStatus.message && (
              <StatusMessage
                type={scanStatus.type}
                message={scanStatus.message}
              />
            )}
          </ActionCard>

          {/* =================================================
              DAMAGED SEAT
          ================================================== */}

          <ActionCard
            icon={<Hammer size={20} />}
            iconClass="bg-amber-50 text-amber-600"
            title="Report Damaged Seat"
            description="Report an unavailable desk or seat so it can be reviewed by the administrator."
          >
            <form
              onSubmit={handleFlagSeat}
              className="mt-5"
            >
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Table / seat identifier
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Armchair
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Example: R1C2"
                    value={flagTableId}
                    onChange={(e) =>
                      setFlagTableId(
                        e.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    flagStatus.type ===
                    "loading"
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:ring-4 focus:ring-slate-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {flagStatus.type ===
                  "loading" ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <AlertTriangle
                      size={16}
                    />
                  )}

                  Report seat
                </button>
              </div>
            </form>

            {flagStatus.message && (
              <StatusMessage
                type={flagStatus.type}
                message={flagStatus.message}
              />
            )}
          </ActionCard>
        </div>

        {/* ===================================================
            SEATING GRID
        ==================================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* HEADER */}

          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Building2
                  size={19}
                  className="text-blue-600"
                />

                <h2 className="text-base font-bold text-slate-900">
                  Examination Seating
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Hall {roomNo} · Click a
                candidate card to update
                attendance.
              </p>
            </div>

            {/* LEGEND */}

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
              <Legend
                color="bg-emerald-500"
                label="Present"
              />

              <Legend
                color="bg-slate-400"
                label="Absent"
              />

              <Legend
                color="bg-amber-500"
                label="Fault / Reroute"
              />
            </div>
          </div>

          {/* BODY */}

          <div className="p-5 sm:p-6">
            {loading ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Loading examination room
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Retrieving the latest
                  candidate information...
                </p>
              </div>
            ) : !data?.registry ||
              data.registry.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Users size={21} />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  No candidates assigned
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  No candidates are currently
                  mapped to selected Hall {roomNo}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {data.registry.map(
                  (student) => {
                    const style =
                      getSeatStyle(
                        student.attendance_status
                      );

                    return (
                      <button
                        type="button"
                        key={student.id}
                        onClick={() =>
                          handleToggleAttendance(
                            student
                          )
                        }
                        className={`group relative rounded-xl border p-4 text-left transition-all duration-200 ${style.card}`}
                        title="Click to toggle attendance"
                      >
                        {/* CARD TOP */}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-9 min-w-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 shadow-sm">
                            {student.seat_no}
                          </div>

                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                            {student.branch}
                          </span>
                        </div>

                        {/* STUDENT */}

                        <div className="mt-4">
                          <h3
                            title={student.name}
                            className="truncate text-sm font-semibold text-slate-900"
                          >
                            {student.name}
                          </h3>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {student.roll_no}
                          </p>
                        </div>

                        {/* STATUS */}

                        <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3">
                          <span className="text-[11px] font-medium text-slate-400">
                            Attendance
                          </span>

                          <span
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${style.badge}`}
                          >
                            {togglingRoll ===
                            student.roll_no ? (
                              <Loader2
                                size={11}
                                className="animate-spin"
                              />
                            ) : (
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                              />
                            )}

                            {
                              student.attendance_status
                            }
                          </span>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            EXPORT REPORT
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FileText size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Export Attendance Report
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Filter examination records and
                  generate a printable report for
                  Hall {roomNo}.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative">
                <Filter
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={exportFilters.branch}
                  onChange={(e) =>
                    setExportFilters({
                      ...exportFilters,
                      branch: e.target.value,
                    })
                  }
                  className="h-10 min-w-[145px] appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="All">
                    All Branches
                  </option>

                  <option value="CSE">
                    CSE
                  </option>

                  <option value="ECE">
                    ECE
                  </option>

                  <option value="ME">ME</option>

                  <option value="CE">CE</option>
                </select>
              </div>

              <select
                value={exportFilters.year}
                onChange={(e) =>
                  setExportFilters({
                    ...exportFilters,
                    year: e.target.value,
                  })
                }
                className="h-10 min-w-[120px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="All">
                  All Years
                </option>

                <option value="1">
                  Year 1
                </option>

                <option value="2">
                  Year 2
                </option>

                <option value="3">
                  Year 3
                </option>

                <option value="4">
                  Year 4
                </option>
              </select>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExporting ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <FileText size={14} />
                )}

                Generate PDF
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            FOOTER STATUS
        ==================================================== */}

        <div className="mt-7 flex flex-col justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} />

            <span>
              EcoSeat AI · Invigilator Workspace
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={13} />

            <span>
              Room data refreshes every 10 seconds
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

/* =========================================================
   METRIC CARD
========================================================= */

const MetricCard = ({
  label,
  value,
  icon,
  iconClass,
  fullMobile = false,
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
        fullMobile ? "col-span-2 lg:col-span-1" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   ACTION CARD
========================================================= */

const ActionCard = ({
  icon,
  iconClass,
  title,
  description,
  children,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
};

/* =========================================================
   STATUS MESSAGE
========================================================= */

const StatusMessage = ({
  type,
  message,
}) => {
  const isError = type === "error";

  const isSuccess = type === "success";

  return (
    <div
      className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs font-medium ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      {type === "loading" ? (
        <Loader2
          size={15}
          className="mt-0.5 shrink-0 animate-spin"
        />
      ) : isError ? (
        <AlertCircle
          size={15}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <CheckCircle2
          size={15}
          className="mt-0.5 shrink-0"
        />
      )}

      <span className="leading-5">
        {message}
      </span>
    </div>
  );
};

/* =========================================================
   LEGEND
========================================================= */

const Legend = ({
  color,
  label,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${color}`}
      />

      <span>{label}</span>
    </div>
  );
};

export default InvigilatorDashboard;