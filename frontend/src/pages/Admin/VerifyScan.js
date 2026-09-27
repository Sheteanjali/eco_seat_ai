// File: frontend/src/pages/Admin/VerifyScan.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  QrCode,
  Loader2,
  UserCheck,
  AlertCircle,
  Lock,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Download,
  Users,
  UserX,
  PieChart,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  Building2,
  Filter,
  Contact,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';

/* ============================================================
   API CONFIGURATION
============================================================ */

const API_ROOT = (
  process.env.REACT_APP_API_URL ||
  'http://127.0.0.1:8765'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const API_BASE_URL = `${API_ROOT}/api`;

const DEVICE_KEY = 'RBU_DEVICE_KEY';
const DEVICE_TOKEN = 'RBU_ADMIN_SECURE_TOKEN_2026';

/* ============================================================
   HELPERS
============================================================ */

const normalizeStatus = (status) => {
  const value = String(status || '').trim().toUpperCase();

  if (value === 'PRESENT') return 'PRESENT';

  return 'ABSENT';
};

const normalizeStudent = (student, index) => ({
  id:
    student?.id !== undefined && student?.id !== null
      ? String(student.id)
      : String(index),

  rollNo: String(student?.roll_no || '').trim(),

  name: String(student?.name || 'Unknown Student').trim(),

  branch: String(student?.branch || 'N/A').trim(),

  year: String(student?.year || 'N/A').trim(),

  subject: String(student?.subject || '').trim(),

  status: normalizeStatus(student?.attendance_status),

  time: String(
    student?.attendance_time ||
      student?.verified_at ||
      '-'
  ),

  room: String(student?.room_no || '-').trim(),

  seat: String(student?.seat_no || '-').trim(),

  shift: String(student?.shift || '').trim(),

  qrCode: String(student?.qr_code || '').trim(),
});

/* ============================================================
   MAIN COMPONENT
============================================================ */

const VerifyScan = () => {
  /* =========================================================
     VERIFICATION
  ========================================================= */

  const [scanResult, setScanResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [manualQR, setManualQR] = useState('');

  const [isAuthorized, setIsAuthorized] =
    useState(false);

  /* =========================================================
     STUDENT REGISTRY
  ========================================================= */

  const [studentLogs, setStudentLogs] = useState([]);

  const [directoryLoading, setDirectoryLoading] =
    useState(true);

  const [directoryError, setDirectoryError] =
    useState('');

  const [refreshing, setRefreshing] =
    useState(false);

  /* =========================================================
     FILTERS
  ========================================================= */

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedBranch, setSelectedBranch] =
    useState('ALL');

  const [selectedYear, setSelectedYear] =
    useState('ALL');

  const [selectedStatus, setSelectedStatus] =
    useState('ALL');

  /* =========================================================
     PAGINATION
  ========================================================= */

  const [currentPage, setCurrentPage] =
    useState(1);

  const pageSize = 20;

  /* =========================================================
     DEVICE AUTHORIZATION
  ========================================================= */

  useEffect(() => {
    const token =
      localStorage.getItem(DEVICE_KEY);

    if (token === DEVICE_TOKEN) {
      setIsAuthorized(true);
    }
  }, []);

  const enrollDevice = () => {
    localStorage.setItem(
      DEVICE_KEY,
      DEVICE_TOKEN
    );

    setIsAuthorized(true);
  };

  /* =========================================================
     LOAD REAL STUDENTS FROM DATABASE
  ========================================================= */

  const loadStudents = useCallback(
    async (manualRefresh = false) => {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setDirectoryLoading(true);
      }

      setDirectoryError('');

      try {
        const response = await axios.get(
          `${API_BASE_URL}/admin/search-hub`,
          {
            params: {
              filter_type: 'student',
              query: '',
            },
          }
        );

        const results = Array.isArray(
          response?.data?.results
        )
          ? response.data.results
          : [];

        const normalized = results.map(
          (student, index) =>
            normalizeStudent(student, index)
        );

        setStudentLogs(normalized);
      } catch (error) {
        console.error(
          'Student registry synchronization failed:',
          error
        );

        setStudentLogs([]);

        setDirectoryError(
          error?.response?.data?.detail ||
            'Unable to load uploaded student records.'
        );
      } finally {
        setDirectoryLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  /* =========================================================
     ERROR MESSAGE
  ========================================================= */

  const getErrorMessage = () => {
    const message = scanResult?.message;

    if (!message) {
      return 'Identity Not Found';
    }

    if (typeof message === 'object') {
      return (
        message.detail ||
        'Unable to verify candidate.'
      );
    }

    return String(message);
  };

  /* =========================================================
     VERIFY STUDENT
  ========================================================= */

  const handleVerify = async (qrContent) => {
    if (!qrContent || loading) return;

    const cleanedQuery =
      String(qrContent).trim();

    if (!cleanedQuery) return;

    if (!isAuthorized) {
      setScanResult({
        success: false,
        message:
          'Please authorize this verification terminal first.',
      });

      return;
    }

    setLoading(true);
    setScanResult(null);

    const deviceToken =
      localStorage.getItem(DEVICE_KEY);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/attendance/verify-scan`,
        {
          qr_data: cleanedQuery,
        },
        {
          headers: {
            Authorization: deviceToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const responseData =
        response?.data || {};

      setScanResult({
        success: true,

        name:
          responseData.name ||
          'Verified Candidate',

        rollNo:
          responseData.roll_no ||
          cleanedQuery,

        room:
          responseData.room ||
          'N/A',

        seat:
          responseData.seat ||
          'N/A',

        message:
          responseData.message ||
          'Authorized Entry Recorded',
      });

      setManualQR('');

      /*
       * IMPORTANT:
       * Backend has already changed attendance_status
       * to Present. Reload database records instead of
       * creating fake local attendance.
       */
      await loadStudents(true);
    } catch (error) {
      console.error(
        'Candidate verification failed:',
        error
      );

      setScanResult({
        success: false,

        message:
          error?.response?.data?.detail ||
          'Unable to verify candidate.',
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     AVAILABLE FILTER VALUES
  ========================================================= */

  const branchOptions = useMemo(() => {
    return Array.from(
      new Set(
        studentLogs
          .map((student) =>
            String(student.branch || '').trim()
          )
          .filter(
            (value) =>
              value &&
              value.toUpperCase() !== 'N/A'
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
      })
    );
  }, [studentLogs]);

  const yearOptions = useMemo(() => {
    return Array.from(
      new Set(
        studentLogs
          .map((student) =>
            String(student.year || '').trim()
          )
          .filter(
            (value) =>
              value &&
              value.toUpperCase() !== 'N/A'
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
      })
    );
  }, [studentLogs]);

  /* =========================================================
     FILTERING
  ========================================================= */

  const filteredStudents = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return studentLogs.filter((student) => {
      const matchesQuery =
        !query ||
        [
          student.name,
          student.rollNo,
          student.branch,
          student.year,
          student.room,
          student.seat,
          student.subject,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(query)
        );

      const matchesBranch =
        selectedBranch === 'ALL' ||
        student.branch === selectedBranch;

      const matchesYear =
        selectedYear === 'ALL' ||
        student.year === selectedYear;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        student.status === selectedStatus;

      return (
        matchesQuery &&
        matchesBranch &&
        matchesYear &&
        matchesStatus
      );
    });
  }, [
    studentLogs,
    searchQuery,
    selectedBranch,
    selectedYear,
    selectedStatus,
  ]);

  /* =========================================================
     RESET PAGE WHEN FILTER CHANGES
  ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedBranch,
    selectedYear,
    selectedStatus,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length / pageSize
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedStudents = useMemo(() => {
    const start =
      (currentPage - 1) * pageSize;

    return filteredStudents.slice(
      start,
      start + pageSize
    );
  }, [
    filteredStudents,
    currentPage,
  ]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const total = studentLogs.length;

    const present = studentLogs.filter(
      (student) =>
        student.status === 'PRESENT'
    ).length;

    const absent = total - present;

    const percentage =
      total > 0
        ? Math.round(
            (present / total) * 100
          )
        : 0;

    return {
      total,
      present,
      absent,
      percentage,
    };
  }, [studentLogs]);

  /* =========================================================
     EXPORT REPORT
  ========================================================= */

  const handleExportPDF = () => {
    const printWindow =
      window.open('', '_blank');

    if (!printWindow) {
      window.alert(
        'Please allow popups to download the attendance report.'
      );

      return;
    }

    const escapeHtml = (value) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const rowsHTML =
      filteredStudents
        .map(
          (student, index) => `
            <tr>
              <td>${index + 1}</td>

              <td>
                <strong>
                  ${escapeHtml(student.rollNo)}
                </strong>
              </td>

              <td>
                ${escapeHtml(student.name)}
              </td>

              <td>
                ${escapeHtml(student.branch)}
              </td>

              <td>
                ${escapeHtml(student.year)}
              </td>

              <td class="${
                student.status === 'PRESENT'
                  ? 'present'
                  : 'absent'
              }">
                ${escapeHtml(student.status)}
              </td>

              <td>
                ${escapeHtml(student.room)}
              </td>

              <td>
                ${escapeHtml(student.seat)}
              </td>
            </tr>
          `
        )
        .join('');

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>
            Eco-Seat Attendance Report
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #0f172a;
            }

            .header {
              margin-bottom: 22px;
            }

            h1 {
              margin: 0;
              font-size: 22px;
            }

            .subtitle {
              color: #64748b;
              font-size: 12px;
              margin-top: 7px;
            }

            .summary {
              display: flex;
              gap: 12px;
              margin: 18px 0;
            }

            .summary-box {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              font-size: 12px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }

            th {
              background: #f1f5f9;
              text-align: left;
              padding: 9px;
              border: 1px solid #e2e8f0;
            }

            td {
              padding: 9px;
              border: 1px solid #e2e8f0;
            }

            .present {
              color: #047857;
              font-weight: 700;
            }

            .absent {
              color: #b91c1c;
              font-weight: 700;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <h1>
              Eco-Seat AI — Attendance Report
            </h1>

            <div class="subtitle">
              Generated:
              ${escapeHtml(
                new Date().toLocaleString()
              )}
            </div>
          </div>

          <div class="summary">
            <div class="summary-box">
              Total: ${stats.total}
            </div>

            <div class="summary-box">
              Present: ${stats.present}
            </div>

            <div class="summary-box">
              Absent: ${stats.absent}
            </div>

            <div class="summary-box">
              Attendance: ${stats.percentage}%
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Roll No</th>
                <th>Student</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Status</th>
                <th>Room</th>
                <th>Seat</th>
              </tr>
            </thead>

            <tbody>
              ${
                rowsHTML ||
                `
                  <tr>
                    <td
                      colspan="8"
                      style="
                        text-align:center;
                        padding:25px;
                      "
                    >
                      No records found.
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ScanLine size={18} />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Entry Verification
              </span>

            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Gate Verification & Attendance
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Verify examination candidates,
              mark attendance and review
              real uploaded student records.
            </p>
          </div>

          {/* AUTH STATUS */}

          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              isAuthorized
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isAuthorized
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {isAuthorized ? (
                <ShieldCheck size={18} />
              ) : (
                <ShieldAlert size={18} />
              )}
            </div>

            <div>
              <p
                className={`text-xs font-semibold ${
                  isAuthorized
                    ? 'text-emerald-800'
                    : 'text-red-800'
                }`}
              >
                {isAuthorized
                  ? 'Verification Terminal Active'
                  : 'Terminal Not Authorized'}
              </p>

              <p
                className={`mt-0.5 text-[10px] ${
                  isAuthorized
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {isAuthorized
                  ? 'Device authorization verified'
                  : 'Device enrollment required'}
              </p>
            </div>

            {!isAuthorized && (
              <button
                type="button"
                onClick={enrollDevice}
                className="ml-2 rounded-lg bg-red-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-red-700"
              >
                Enroll Device
              </button>
            )}
          </div>

        </div>

        {/* TOP SECTION */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">

          {/* VERIFY CARD */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <QrCode size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Candidate Verification
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Enter the candidate roll
                    number or QR content.
                  </p>
                </div>

              </div>

            </div>

            <div className="p-6 sm:p-8">

              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Student Roll Number
              </label>

              <div className="relative">

                <Contact
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Enter roll number"
                  value={manualQR}
                  onChange={(event) =>
                    setManualQR(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter'
                    ) {
                      handleVerify(
                        manualQR
                      );
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                Only students present in the
                uploaded examination registry
                can be verified.
              </p>

              <button
                type="button"
                onClick={() =>
                  handleVerify(manualQR)
                }
                disabled={
                  !manualQR.trim() ||
                  loading
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? (
                  <Loader2
                    className="animate-spin"
                    size={17}
                  />
                ) : (
                  <UserCheck size={17} />
                )}

                {loading
                  ? 'Verifying Candidate...'
                  : 'Verify & Mark Present'}
              </button>

              {/* RESULT */}

              {scanResult && (
                <div
                  className={`mt-6 rounded-xl border p-5 ${
                    scanResult.success
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >

                  {scanResult.success ? (
                    <div>

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                          <CheckCircle2
                            size={20}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-emerald-900">
                            Attendance marked successfully
                          </p>

                          <p className="mt-1 text-xs text-emerald-700">
                            {scanResult.message}
                          </p>
                        </div>

                      </div>

                      <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">

                        <p className="text-xs font-medium text-slate-400">
                          Candidate
                        </p>

                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {scanResult.name}
                        </p>

                        {scanResult.rollNo && (
                          <p className="mt-1 text-xs text-slate-500">
                            {scanResult.rollNo}
                          </p>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-3">

                          <ResultItem
                            label="Assigned Room"
                            value={
                              scanResult.room
                            }
                          />

                          <ResultItem
                            label="Seat"
                            value={
                              scanResult.seat
                            }
                          />

                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <AlertCircle
                          size={20}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-red-900">
                          Verification failed
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-700">
                          {getErrorMessage()}
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>

          </section>

          {/* ATTENDANCE OVERVIEW */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Attendance Overview
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Live data from the uploaded
                  student registry.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <PieChart size={19} />
              </div>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <MetricCard
                icon={<Users size={19} />}
                label="Total Candidates"
                value={
                  directoryLoading
                    ? '...'
                    : stats.total
                }
                variant="slate"
              />

              <MetricCard
                icon={
                  <UserCheck size={19} />
                }
                label="Present"
                value={
                  directoryLoading
                    ? '...'
                    : stats.present
                }
                variant="emerald"
              />

              <MetricCard
                icon={<UserX size={19} />}
                label="Absent"
                value={
                  directoryLoading
                    ? '...'
                    : stats.absent
                }
                variant="red"
              />

            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="mb-3 flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Attendance Completion
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Present candidates against
                    total enrollment
                  </p>
                </div>

                <span className="text-lg font-bold text-indigo-600">
                  {stats.percentage}%
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{
                    width: `${stats.percentage}%`,
                  }}
                />

              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <SummaryItem
                  label="Verified"
                  value={stats.present}
                />

                <SummaryItem
                  label="Pending"
                  value={stats.absent}
                />

              </div>

            </div>

          </section>

        </div>

        {/* DIRECTORY */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Users
                  size={18}
                  className="text-indigo-600"
                />

                <h2 className="font-semibold text-slate-900">
                  Student Attendance Directory
                </h2>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                {filteredStudents.length}{' '}
                matching records from{' '}
                {studentLogs.length}{' '}
                uploaded candidates.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  loadStudents(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={
                  studentLogs.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={15} />

                Export Attendance Report
              </button>

            </div>

          </div>

          {/* ERROR */}

          {directoryError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="text-xs font-semibold text-red-800">
                    Unable to synchronize student registry
                  </p>

                  <p className="mt-1 text-xs text-red-700">
                    {directoryError}
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* FILTERS */}

          <div className="border-b border-slate-200 bg-slate-50/70 p-5">

            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Filter size={14} />
              Directory Filters
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

              <div className="relative">

                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search name or roll number"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <FilterSelect
                value={selectedBranch}
                onChange={(event) =>
                  setSelectedBranch(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Branches
                </option>

                {branchOptions.map(
                  (branch) => (
                    <option
                      key={branch}
                      value={branch}
                    >
                      {branch}
                    </option>
                  )
                )}

              </FilterSelect>

              <FilterSelect
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Years
                </option>

                {yearOptions.map(
                  (year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  )
                )}

              </FilterSelect>

              <FilterSelect
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Statuses
                </option>

                <option value="PRESENT">
                  Present
                </option>

                <option value="ABSENT">
                  Absent
                </option>

              </FilterSelect>

            </div>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] border-collapse">

              <thead>
                <tr className="border-b border-slate-200 bg-white text-left">

                  <TableHeading>
                    Student
                  </TableHeading>

                  <TableHeading>
                    Academic Details
                  </TableHeading>

                  <TableHeading>
                    Attendance
                  </TableHeading>

                  <TableHeading>
                    Room
                  </TableHeading>

                  <TableHeading>
                    Seat
                  </TableHeading>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {directoryLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center"
                    >
                      <Loader2
                        size={26}
                        className="mx-auto mb-3 animate-spin text-indigo-600"
                      />

                      <p className="text-sm font-semibold text-slate-600">
                        Loading uploaded students...
                      </p>
                    </td>
                  </tr>
                ) : paginatedStudents.length > 0 ? (

                  paginatedStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.id ||
                          student.rollNo
                        }
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">

                          <p className="text-sm font-semibold text-slate-900">
                            {student.name}
                          </p>

                          <p className="mt-1 text-[11px] font-medium text-slate-400">
                            {student.rollNo}
                          </p>

                        </td>

                        <td className="px-6 py-4">

                          <p className="text-xs font-semibold text-slate-700">
                            {student.branch}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Year: {student.year}
                          </p>

                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge
                            status={
                              student.status
                            }
                          />
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <Building2
                              size={14}
                              className="text-slate-400"
                            />

                            <span className="text-xs font-semibold text-slate-700">
                              {student.room}
                            </span>

                          </div>

                        </td>

                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                          {student.seat}
                        </td>

                      </tr>
                    )
                  )

                ) : (
                  <tr>

                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center"
                    >

                      <Search
                        size={28}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="text-sm font-semibold text-slate-600">
                        No students found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Upload student data or
                        change the current filters.
                      </p>

                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-medium text-slate-600">
                Page {currentPage} of{' '}
                {totalPages}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                {filteredStudents.length}{' '}
                matching records
              </p>

            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(
                      page - 1,
                      1
                    )
                  )
                }
                disabled={
                  currentPage === 1
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="min-w-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700">
                {currentPage}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      page + 1,
                      totalPages
                    )
                  )
                }
                disabled={
                  currentPage ===
                  totalPages
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>

            </div>

          </div>

        </section>

        {/* FOOTER */}

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-200 py-5 sm:flex-row">

          <div className="flex items-center gap-2 text-slate-400">
            <Lock size={13} />

            <span className="text-[10px] font-medium">
              Secure verification session
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={13} />

            <span className="text-[10px] font-medium">
              Eco-Seat AI
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};

/* ============================================================
   SMALL COMPONENTS
============================================================ */

const MetricCard = ({
  icon,
  label,
  value,
  variant,
}) => {
  const styles = {
    slate: {
      box: 'bg-slate-100 text-slate-600',
      value: 'text-slate-900',
    },

    emerald: {
      box: 'bg-emerald-50 text-emerald-600',
      value: 'text-emerald-600',
    },

    red: {
      box: 'bg-red-50 text-red-600',
      value: 'text-red-600',
    },
  };

  const style =
    styles[variant] || styles.slate;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">

      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${style.box}`}
      >
        {icon}
      </div>

      <p className="text-[11px] font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${style.value}`}
      >
        {value}
      </p>

    </div>
  );
};

const SummaryItem = ({
  label,
  value,
}) => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">

    <p className="text-[10px] font-medium text-slate-400">
      {label}
    </p>

    <p className="mt-1 text-sm font-semibold text-slate-800">
      {value}
    </p>

  </div>
);

const ResultItem = ({
  label,
  value,
}) => (
  <div className="rounded-lg bg-slate-50 px-3 py-3">

    <p className="text-[10px] font-medium text-slate-400">
      {label}
    </p>

    <p className="mt-1 text-sm font-semibold text-slate-800">
      {value || '—'}
    </p>

  </div>
);

const FilterSelect = ({
  value,
  onChange,
  children,
}) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
  >
    {children}
  </select>
);

const TableHeading = ({
  children,
}) => (
  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
    {children}
  </th>
);

const StatusBadge = ({ status }) => {
  const present =
    status === 'PRESENT';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        present
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {present ? (
        <CheckCircle2 size={12} />
      ) : (
        <AlertCircle size={12} />
      )}

      {status}
    </span>
  );
};

export default VerifyScan;