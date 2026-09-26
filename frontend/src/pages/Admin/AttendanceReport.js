// File: frontend/src/pages/Admin/AttendanceReport.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Download,
  Mail,
  Users,
  Search,
  ShieldCheck,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  Building2,
  Armchair,
  FileText,
  Filter,
  ClipboardCheck,
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = 'http://127.0.0.1:8765/api';

const AttendanceReport = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('All');
  const [roomFilter, setRoomFilter] = useState('All');

  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // =========================================================
  // FETCH ATTENDANCE
  // =========================================================

  const fetchAttendanceData = async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const res = await axios.get(
        `${API_BASE_URL}/admin/search-hub`,
        {
          params: {
            query: '',
            filter_type: 'student',
          },
        }
      );

      setStudents(
        Array.isArray(res.data?.results)
          ? res.data.results
          : []
      );
    } catch (err) {
      console.error('Attendance data fetch failed:', err);

      setError(
        err.response?.data?.detail ||
          'Unable to load attendance data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // DATA HELPERS
  // =========================================================

  const uniqueRooms = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) =>
            String(student.room_no || '').trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
      })
    );
  }, [students]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      const attendanceStatus = String(
        student.attendance_status || ''
      );

      if (
        statusFilter !== 'All' &&
        attendanceStatus.toLowerCase() !==
          statusFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        roomFilter !== 'All' &&
        String(student.room_no) !==
          String(roomFilter)
      ) {
        return false;
      }

      if (normalizedQuery) {
        const searchableValues = [
          student.name,
          student.roll_no,
          student.room_no,
          student.seat_no,
          student.branch,
          student.subject,
          student.email,
        ];

        const matches = searchableValues.some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(normalizedQuery)
        );

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [
    students,
    searchQuery,
    statusFilter,
    roomFilter,
  ]);

  const presentList = useMemo(
    () =>
      filteredStudents.filter(
        (student) =>
          String(
            student.attendance_status
          ).toLowerCase() === 'present'
      ),
    [filteredStudents]
  );

  const absentList = useMemo(
    () =>
      filteredStudents.filter(
        (student) =>
          String(
            student.attendance_status
          ).toLowerCase() === 'absent'
      ),
    [filteredStudents]
  );

  const totalPresent = useMemo(
    () =>
      students.filter(
        (student) =>
          String(
            student.attendance_status
          ).toLowerCase() === 'present'
      ).length,
    [students]
  );

  const totalAbsent = useMemo(
    () =>
      students.filter(
        (student) =>
          String(
            student.attendance_status
          ).toLowerCase() === 'absent'
      ).length,
    [students]
  );

  const attendancePercentage =
    students.length > 0
      ? Math.round(
          (totalPresent / students.length) * 100
        )
      : 0;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setRoomFilter('All');
  };

  const filtersActive =
    searchQuery.trim() ||
    statusFilter !== 'All' ||
    roomFilter !== 'All';

  // =========================================================
  // PDF EXPORT
  // =========================================================

  const downloadAuditPDF = () => {
    if (!filteredStudents.length) {
      window.alert(
        'No attendance records are available for the selected filters.'
      );
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(19);
    doc.setTextColor(15, 23, 42);

    doc.text(
      'Eco-Seat AI - Attendance Report',
      14,
      16
    );

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);

    doc.text(
      `Ramdeobaba University | Generated: ${new Date().toLocaleString()}`,
      14,
      23
    );

    doc.text(
      `Records: ${
        filteredStudents.length
      } | Present: ${
        presentList.length
      } | Absent: ${absentList.length}`,
      14,
      29
    );

    const rows = filteredStudents.map(
      (student) => [
        student.roll_no || '—',
        student.name || '—',
        student.email || '—',
        student.branch || '—',
        student.room_no || '—',
        student.seat_no || '—',
        student.attendance_status || '—',
      ]
    );

    autoTable(doc, {
      head: [
        [
          'Roll No',
          'Candidate Name',
          'Email',
          'Branch',
          'Hall',
          'Seat',
          'Status',
        ],
      ],
      body: rows,
      startY: 36,
      theme: 'grid',

      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },

      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },

      didParseCell: (data) => {
        if (
          data.section === 'body' &&
          data.column.index === 6
        ) {
          const status = String(
            data.cell.raw || ''
          ).toLowerCase();

          if (status === 'present') {
            data.cell.styles.textColor = [
              5, 150, 105,
            ];

            data.cell.styles.fontStyle = 'bold';
          }

          if (status === 'absent') {
            data.cell.styles.textColor = [
              220, 38, 38,
            ];

            data.cell.styles.fontStyle = 'bold';
          }
        }
      },

      margin: {
        left: 14,
        right: 14,
      },
    });

    const safeDate = new Date()
      .toISOString()
      .split('T')[0];

    doc.save(
      `Attendance_Report_RBU_${safeDate}.pdf`
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>

          <h2 className="text-base font-semibold text-slate-900">
            Loading attendance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preparing the latest candidate records...
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <ClipboardCheck size={23} />
              </div>

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Attendance Report
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live Data
                  </span>

                </div>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                  Review candidate attendance, search
                  examination records and export official
                  attendance reports.
                </p>

              </div>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  fetchAttendanceData(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                {refreshing
                  ? 'Refreshing'
                  : 'Refresh'}
              </button>

              <button
                type="button"
                onClick={downloadAuditPDF}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Download size={16} />
                Export PDF
              </button>

            </div>

          </div>

        </header>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

            <XCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to load attendance
              </p>

              <p className="mt-0.5 text-sm text-red-700">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Total Candidates"
            value={students.length}
            subtitle="Registered records"
            icon={<Users size={20} />}
            tone="indigo"
          />

          <SummaryCard
            title="Present"
            value={totalPresent}
            subtitle="Verified candidates"
            icon={<UserCheck size={20} />}
            tone="emerald"
          />

          <SummaryCard
            title="Absent"
            value={totalAbsent}
            subtitle="Not marked present"
            icon={<UserX size={20} />}
            tone="red"
          />

          <SummaryCard
            title="Attendance Rate"
            value={`${attendancePercentage}%`}
            subtitle="Overall attendance"
            icon={<ShieldCheck size={20} />}
            tone="blue"
          />

        </section>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">
                <Filter
                  size={18}
                  className="text-indigo-600"
                />

                <h2 className="text-lg font-semibold text-slate-900">
                  Attendance Records
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Search candidates and filter attendance
                records.
              </p>

            </div>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-fit text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
              >
                Clear filters
              </button>
            )}

          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">

            {/* Search */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search Candidate
              </label>

              <div className="relative">

                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search name, roll number, branch, room or seat..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>

            </div>

            {/* Status */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Attendance Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="Present">
                  Present
                </option>

                <option value="Absent">
                  Absent
                </option>
              </select>

            </div>

            {/* Room */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Examination Hall
              </label>

              <select
                value={roomFilter}
                onChange={(event) =>
                  setRoomFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="All">
                  All Halls
                </option>

                {uniqueRooms.map((room) => (
                  <option
                    key={room}
                    value={room}
                  >
                    Room {room}
                  </option>
                ))}
              </select>

            </div>

          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">

            <span className="text-sm text-slate-500">
              Showing
            </span>

            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
              {filteredStudents.length}
            </span>

            <span className="text-sm text-slate-500">
              of {students.length} candidate records
            </span>

          </div>

        </section>

        {/* =====================================================
            PRESENT / ABSENT
        ===================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* PRESENT */}

          <AttendancePanel
            title="Present Candidates"
            description="Candidates verified as present."
            count={presentList.length}
            type="present"
            icon={<CheckCircle2 size={20} />}
          >
            {presentList.length > 0 ? (
              presentList.map((student) => (
                <StudentCard
                  key={`present-${student.roll_no}`}
                  student={student}
                  status="present"
                />
              ))
            ) : (
              <EmptyState
                icon={<UserCheck size={24} />}
                title="No present candidates"
                description="No present candidates match the selected filters."
              />
            )}
          </AttendancePanel>

          {/* ABSENT */}

          <AttendancePanel
            title="Absent Candidates"
            description="Candidates currently marked absent."
            count={absentList.length}
            type="absent"
            icon={<XCircle size={20} />}
          >
            {absentList.length > 0 ? (
              absentList.map((student) => (
                <StudentCard
                  key={`absent-${student.roll_no}`}
                  student={student}
                  status="absent"
                />
              ))
            ) : (
              <EmptyState
                icon={<UserX size={24} />}
                title="No absent candidates"
                description="No absent candidates match the selected filters."
              />
            )}
          </AttendancePanel>

        </div>

        {/* =====================================================
            COMPLETE TABLE
        ===================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

            <div>

              <div className="flex items-center gap-2">

                <FileText
                  size={18}
                  className="text-indigo-600"
                />

                <h2 className="font-semibold text-slate-900">
                  Detailed Attendance Register
                </h2>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Complete candidate attendance details for
                the current selection.
              </p>

            </div>

            <span className="w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              {filteredStudents.length} records
            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-slate-200">

              <thead className="bg-slate-50">

                <tr>
                  <TableHeader>
                    Roll Number
                  </TableHeader>

                  <TableHeader>
                    Candidate
                  </TableHeader>

                  <TableHeader>
                    Branch
                  </TableHeader>

                  <TableHeader>
                    Hall
                  </TableHeader>

                  <TableHeader>
                    Seat
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">

                {filteredStudents.map(
                  (student, index) => (
                    <tr
                      key={`table-${
                        student.roll_no
                      }-${index}`}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                        {student.roll_no || '—'}
                      </td>

                      <td className="px-5 py-4">

                        <p className="whitespace-nowrap text-sm font-semibold text-slate-900">
                          {student.name || '—'}
                        </p>

                        {student.email && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {student.email}
                          </p>
                        )}

                      </td>

                      <TableCell>
                        {student.branch || '—'}
                        {student.year
                          ? ` · Year ${student.year}`
                          : ''}
                      </TableCell>

                      <td className="whitespace-nowrap px-5 py-4">

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">

                          <Building2 size={12} />

                          {student.room_no
                            ? `Room ${student.room_no}`
                            : 'Not Assigned'}

                        </span>

                      </td>

                      <td className="whitespace-nowrap px-5 py-4">

                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">

                          <Armchair
                            size={14}
                            className="text-slate-400"
                          />

                          {student.seat_no || '—'}

                        </span>

                      </td>

                      <td className="whitespace-nowrap px-5 py-4">

                        <StatusBadge
                          status={
                            student.attendance_status
                          }
                        />

                      </td>

                    </tr>
                  )
                )}

                {filteredStudents.length === 0 && (
                  <tr>

                    <td
                      colSpan="6"
                      className="px-6 py-16"
                    >

                      <EmptyState
                        icon={<Search size={24} />}
                        title="No records found"
                        description="Try changing your search or selected filters."
                      />

                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </div>
  );
};

// =============================================================
// SUMMARY CARD
// =============================================================

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  tone = 'indigo',
}) => {
  const toneClasses = {
    indigo:
      'bg-indigo-50 text-indigo-600',
    emerald:
      'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            toneClasses[tone] ||
            toneClasses.indigo
          }`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
};

// =============================================================
// ATTENDANCE PANEL
// =============================================================

const AttendancePanel = ({
  title,
  description,
  count,
  type,
  icon,
  children,
}) => {
  const isPresent = type === 'present';

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

        <div className="flex items-center gap-3">

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isPresent
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {icon}
          </div>

          <div>

            <h2 className="font-semibold text-slate-900">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {description}
            </p>

          </div>

        </div>

        <span
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            isPresent
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {count}
        </span>

      </div>

      <div className="max-h-[580px] space-y-2 overflow-y-auto p-4 sm:p-5">
        {children}
      </div>

    </section>
  );
};

// =============================================================
// STUDENT CARD
// =============================================================

const StudentCard = ({
  student,
  status,
}) => {
  const isPresent = status === 'present';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 items-start gap-3">

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isPresent
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {isPresent ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}
          </div>

          <div className="min-w-0">

            <p className="truncate text-sm font-semibold text-slate-900">
              {student.name || 'Unnamed Candidate'}
            </p>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {student.roll_no || '—'}
            </p>

            {student.email && (
              <div className="mt-2 flex items-center gap-1.5">

                <Mail
                  size={12}
                  className="shrink-0 text-slate-400"
                />

                <p className="truncate text-xs text-slate-500">
                  {student.email}
                </p>

              </div>
            )}

          </div>

        </div>

        <div className="shrink-0 text-right">

          <p className="text-xs font-medium text-slate-700">
            {student.room_no
              ? `Room ${student.room_no}`
              : 'Room not assigned'}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Seat {student.seat_no || '—'}
          </p>

        </div>

      </div>

    </div>
  );
};

// =============================================================
// STATUS BADGE
// =============================================================

const StatusBadge = ({ status }) => {
  const normalizedStatus = String(
    status || ''
  ).toLowerCase();

  const isPresent =
    normalizedStatus === 'present';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isPresent
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isPresent
            ? 'bg-emerald-500'
            : 'bg-red-500'
        }`}
      />

      {status || 'Absent'}
    </span>
  );
};

// =============================================================
// TABLE COMPONENTS
// =============================================================

const TableHeader = ({ children }) => (
  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-slate-500">
    {children}
  </th>
);

const TableCell = ({ children }) => (
  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
    {children}
  </td>
);

// =============================================================
// EMPTY STATE
// =============================================================

const EmptyState = ({
  icon,
  title,
  description,
}) => (
  <div className="flex min-h-[160px] flex-col items-center justify-center text-center">

    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      {icon}
    </div>

    <p className="text-sm font-semibold text-slate-700">
      {title}
    </p>

    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
      {description}
    </p>

  </div>
);

export default AttendanceReport;