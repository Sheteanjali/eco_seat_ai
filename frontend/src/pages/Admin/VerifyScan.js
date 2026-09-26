// File: frontend/src/pages/Admin/VerifyScan.js

// File: frontend/src/pages/Admin/VerifyScan.js

// File: frontend/src/pages/Admin/VerifyScan.js

import React, { useState, useEffect, useMemo } from 'react';

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
} from 'lucide-react';

import axios from 'axios';

/* ============================================================
   EXISTING DATA LOGIC
============================================================ */

const generateInitialStudents = () => {
  const branches = ['CSE', 'ECE', 'MECH', 'EEE', 'CIVIL'];
  const years = ['1st', '2nd', '3rd', '4th'];

  const firstNames = [
    'Aarav',
    'Ananya',
    'Rohan',
    'Priya',
    'Siddharth',
    'Neha',
    'Vikram',
    'Isha',
    'Karan',
    'Pooja',
    'Rahul',
    'Sneha',
    'Aditya',
    'Riya',
    'Amit',
    'Kavya',
  ];

  const lastNames = [
    'Sharma',
    'Verma',
    'Mehta',
    'Patel',
    'Rao',
    'Gupta',
    'Singh',
    'Joshi',
    'Nair',
    'Kumar',
    'Reddy',
    'Deshmukh',
    'Chopra',
    'Malhotra',
  ];

  const logs = [];

  for (let i = 1; i <= 2000; i++) {
    const padId = String(i).padStart(4, '0');

    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[(i * 3) % lastNames.length];

    const branch = branches[i % branches.length];
    const year = years[i % years.length];

    logs.push({
      id: String(i),
      rollNo: `${branch}2026${padId}`,
      name: `${fname} ${lname}`,
      branch,
      year,
      status: 'ABSENT',
      time: '-',
      room: '-',
      seat: '-',
    });
  }

  return logs;
};

const INITIAL_STUDENT_LOGS = generateInitialStudents();

/* ============================================================
   MAIN COMPONENT
============================================================ */

const VerifyScan = () => {
  /* ----------------------------------------------------------
     VERIFICATION STATE
  ---------------------------------------------------------- */

  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [studentLogs, setStudentLogs] = useState(
    INITIAL_STUDENT_LOGS
  );

  /* ----------------------------------------------------------
     PAGINATION
  ---------------------------------------------------------- */

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  /* ----------------------------------------------------------
     DEVICE AUTHORIZATION
  ---------------------------------------------------------- */

  useEffect(() => {
    const token = localStorage.getItem('RBU_DEVICE_KEY');

    if (token === 'RBU_ADMIN_SECURE_TOKEN_2026') {
      setIsAuthorized(true);
    }
  }, []);

  const enrollDevice = () => {
    localStorage.setItem(
      'RBU_DEVICE_KEY',
      'RBU_ADMIN_SECURE_TOKEN_2026'
    );

    setIsAuthorized(true);
  };

  /* ----------------------------------------------------------
     ERROR MESSAGE
  ---------------------------------------------------------- */

  const getErrorMessage = () => {
    const msg = scanResult?.message;

    if (!msg) return 'Identity Not Found';

    if (typeof msg === 'object') {
      return msg.detail || 'Invalid Data';
    }

    return msg;
  };

  /* ----------------------------------------------------------
     VERIFY STUDENT
     LOGIC PRESERVED
  ---------------------------------------------------------- */

  const handleVerify = async (qrContent) => {
    if (!qrContent) return;

    setLoading(true);
    setScanResult(null);

    const deviceToken =
      localStorage.getItem('RBU_DEVICE_KEY');

    const cleanedQuery = String(qrContent)
      .trim()
      .toUpperCase();

    try {
      const res = await axios({
        method: 'post',

        url:
          'http://127.0.0.1:8765/api/admin/attendance/verify-scan',

        data: {
          qr_data: cleanedQuery,
        },

        headers: {
          Authorization: deviceToken,
          'Content-Type': 'application/json',
        },
      });

      const responseData = res.data;

      setScanResult({
        success: true,
        ...responseData,
      });

      setStudentLogs((prevLogs) =>
        prevLogs.map((student) => {
          if (
            student.rollNo.toUpperCase() ===
            cleanedQuery
          ) {
            return {
              ...student,

              status: 'PRESENT',

              time: new Date().toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              ),

              room: responseData.room || '301',

              seat: responseData.seat || 'A-12',
            };
          }

          return student;
        })
      );

      setManualQR('');
    } catch (err) {
      /* EXISTING FALLBACK LOGIC PRESERVED */

      const existingStudent = studentLogs.find(
        (s) =>
          s.rollNo.toUpperCase() === cleanedQuery
      );

      if (existingStudent) {
        setStudentLogs((prevLogs) =>
          prevLogs.map((student) => {
            if (
              student.rollNo.toUpperCase() ===
              cleanedQuery
            ) {
              return {
                ...student,

                status: 'PRESENT',

                time: new Date().toLocaleTimeString(
                  [],
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                ),

                room: '301',

                seat: `S-${
                  Math.floor(Math.random() * 50) + 1
                }`,
              };
            }

            return student;
          })
        );

        setScanResult({
          success: true,
          name: existingStudent.name,
          room: '301',
          seat: 'A-12',
        });

        setManualQR('');
      } else {
        setScanResult({
          success: false,

          message:
            err.response?.data?.detail ||
            'Roll Number Not Found in 2000 Records',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     DIRECTORY STATE
  ========================================================== */

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedBranch, setSelectedBranch] =
    useState('ALL');

  const [selectedYear, setSelectedYear] =
    useState('ALL');

  const [selectedStatus, setSelectedStatus] =
    useState('ALL');

  /* ----------------------------------------------------------
     FILTERING
  ---------------------------------------------------------- */

  const filteredStudents = useMemo(() => {
    return studentLogs.filter((student) => {
      const matchesQuery =
        student.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        student.rollNo
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

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

  /* ----------------------------------------------------------
     PAGINATION
  ---------------------------------------------------------- */

  const totalPages =
    Math.ceil(
      filteredStudents.length / pageSize
    ) || 1;

  const paginatedStudents = useMemo(() => {
    const start =
      (currentPage - 1) * pageSize;

    return filteredStudents.slice(
      start,
      start + pageSize
    );
  }, [filteredStudents, currentPage]);

  /* ----------------------------------------------------------
     STATS
  ---------------------------------------------------------- */

  const stats = useMemo(() => {
    const total = studentLogs.length;

    const present = studentLogs.filter(
      (s) => s.status === 'PRESENT'
    ).length;

    const absent = studentLogs.filter(
      (s) => s.status === 'ABSENT'
    ).length;

    const percentage =
      total > 0
        ? Math.round((present / total) * 100)
        : 0;

    return {
      total,
      present,
      absent,
      percentage,
    };
  }, [studentLogs]);

  /* ==========================================================
     EXPORT
     EXISTING LOGIC PRESERVED
  ========================================================== */

  const handleExportPDF = () => {
    const printWindow = window.open(
      '',
      '_blank'
    );

    if (!printWindow) {
      return alert(
        'Please allow popups to download report!'
      );
    }

    const rowsHTML = filteredStudents
      .map(
        (st, i) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
              ${i + 1}
            </td>

            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
              <b>${st.rollNo}</b>
            </td>

            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
              ${st.name}
            </td>

            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
              ${st.branch}
            </td>

            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
              ${st.year}
            </td>

            <td style="
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              color: ${
                st.status === 'PRESENT'
                  ? '#10B981'
                  : '#EF4444'
              };
              font-weight: 700;
            ">
              ${st.status}
            </td>

            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
              ${st.time}
            </td>

            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
              ${st.room} / ${st.seat}
            </td>
          </tr>
        `
      )
      .join('');

    printWindow.document.write(`
      <html>

        <head>

          <title>
            Attendance Report -
            ${new Date().toLocaleDateString()}
          </title>

          <style>

            body {
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                'Segoe UI',
                Roboto,
                sans-serif;

              padding: 20px;
              color: #0F172A;
            }

            h2 {
              font-size: 20px;
              font-weight: 800;
              margin-bottom: 4px;
              text-transform: uppercase;
            }

            p {
              color: #64748B;
              font-size: 11px;
              margin-top: 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 12px;
            }

            th {
              background-color: #0F172A;
              color: white;
              padding: 10px;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
            }

          </style>

        </head>

        <body>

          <h2>
            Gate Attendance Report
            (Total Records:
            ${filteredStudents.length})
          </h2>

          <p>
            Generated:
            ${new Date().toLocaleString()}
            |
            Filter: Branch [${selectedBranch}],
            Year [${selectedYear}],
            Status [${selectedStatus}]
          </p>

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Status</th>
                <th>Time</th>
                <th>Room / Seat</th>
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
                      padding:20px;
                    "
                  >
                    No Data Found
                  </td>
                </tr>
                `
              }
            </tbody>

          </table>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>

        </body>

      </html>
    `);

    printWindow.document.close();
  };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

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
              Verify examination candidates, mark attendance
              and review student entry records.
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

        {/* ====================================================
            TOP CONTENT
        ==================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">

          {/* ==================================================
              VERIFICATION CARD
          ================================================== */}

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
                    Enter the candidate roll number to verify
                    examination entry.
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
                  onChange={(e) =>
                    setManualQR(e.target.value)
                  }
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    handleVerify(manualQR)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                Enter the registered examination roll number.
              </p>

              <button
                type="button"
                onClick={() =>
                  handleVerify(manualQR)
                }
                disabled={!manualQR || loading}
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
                          <CheckCircle2 size={20} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-emerald-900">
                            Attendance marked successfully
                          </p>

                          <p className="mt-1 text-xs text-emerald-700">
                            Candidate verification completed.
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

                        <div className="mt-4 grid grid-cols-2 gap-3">

                          <ResultItem
                            label="Assigned Room"
                            value={scanResult.room}
                          />

                          <ResultItem
                            label="Seat"
                            value={scanResult.seat}
                          />

                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <AlertCircle size={20} />
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

          {/* ==================================================
              ATTENDANCE SUMMARY
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Attendance Overview
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Current candidate verification summary.
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
                value={stats.total}
                variant="slate"
              />

              <MetricCard
                icon={<UserCheck size={19} />}
                label="Present"
                value={stats.present}
                variant="emerald"
              />

              <MetricCard
                icon={<UserX size={19} />}
                label="Absent"
                value={stats.absent}
                variant="red"
              />

            </div>

            {/* PROGRESS */}

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="mb-3 flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Attendance Completion
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Present candidates against total enrollment
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

        {/* ====================================================
            DIRECTORY
        ==================================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER */}

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
                {filteredStudents.length} matching records from{' '}
                {studentLogs.length} candidates.
              </p>

            </div>

            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <Download size={15} />
              Export Attendance Report
            </button>

          </div>

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
                  onChange={(e) => {
                    setSearchQuery(
                      e.target.value
                    );

                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

              <FilterSelect
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(
                    e.target.value
                  );

                  setCurrentPage(1);
                }}
              >
                <option value="ALL">
                  All Branches
                </option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="MECH">MECH</option>
                <option value="EEE">EEE</option>
                <option value="CIVIL">CIVIL</option>
              </FilterSelect>

              <FilterSelect
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(
                    e.target.value
                  );

                  setCurrentPage(1);
                }}
              >
                <option value="ALL">
                  All Years
                </option>
                <option value="1st">
                  1st Year
                </option>
                <option value="2nd">
                  2nd Year
                </option>
                <option value="3rd">
                  3rd Year
                </option>
                <option value="4th">
                  4th Year
                </option>
              </FilterSelect>

              <FilterSelect
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(
                    e.target.value
                  );

                  setCurrentPage(1);
                }}
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

          {/* ==================================================
              TABLE
          ================================================== */}

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
                    Verification Time
                  </TableHeading>

                  <TableHeading>
                    Room / Seat
                  </TableHeading>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((st) => (
                    <tr
                      key={st.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">

                        <p className="text-sm font-semibold text-slate-900">
                          {st.name}
                        </p>

                        <p className="mt-1 text-[11px] font-medium text-slate-400">
                          {st.rollNo}
                        </p>

                      </td>

                      <td className="px-6 py-4">

                        <p className="text-xs font-semibold text-slate-700">
                          {st.branch}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {st.year} Year
                        </p>

                      </td>

                      <td className="px-6 py-4">

                        <StatusBadge
                          status={st.status}
                        />

                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {st.time}
                      </td>

                      <td className="px-6 py-4">

                        {st.status ===
                        'PRESENT' ? (
                          <div className="flex items-center gap-2">

                            <Building2
                              size={14}
                              className="text-slate-400"
                            />

                            <span className="text-xs font-semibold text-slate-700">
                              {st.room} /{' '}
                              {st.seat}
                            </span>

                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">
                            —
                          </span>
                        )}

                      </td>

                    </tr>
                  ))
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
                        No matching students
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing the current
                        search or filters.
                      </p>

                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              PAGINATION
          ================================================== */}

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
                  setCurrentPage((p) =>
                    Math.max(p - 1, 1)
                  )
                }
                disabled={currentPage === 1}
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
                  setCurrentPage((p) =>
                    Math.min(
                      p + 1,
                      totalPages
                    )
                  )
                }
                disabled={
                  currentPage === totalPages
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>

            </div>

          </div>

        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

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
              {new Date().toLocaleTimeString()}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

/* ============================================================
   SMALL UI COMPONENTS
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