// File: frontend/src/pages/Admin/MasterSeatingPDF.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  Printer,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Users,
  Building2,
  Armchair,
  ClipboardCheck,
  RefreshCw,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import apiService from '../../services/api';

const MasterSeatingPDF = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // =========================================================
  // LOAD MASTER SEATING DATA
  // =========================================================

  const fetchAll = async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const res = await apiService.getAllSeating();

      const masterList = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setData(masterList);
    } catch (err) {
      console.error('Master Seating Fetch Failed:', err);

      setError(
        err?.response?.data?.detail ||
          'Unable to load the master seating allocation.'
      );

      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    const present = data.filter(
      (student) =>
        String(student.attendance_status || '').toLowerCase() ===
        'present'
    ).length;

    const absent = data.filter(
      (student) =>
        String(student.attendance_status || '').toLowerCase() ===
        'absent'
    ).length;

    const rooms = new Set(
      data
        .map((student) => String(student.room_no || '').trim())
        .filter(Boolean)
    ).size;

    return {
      total: data.length,
      present,
      absent,
      rooms,
    };
  }, [data]);

  // =========================================================
  // PRINT
  // =========================================================

  const handlePrint = () => {
    window.print();
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
            Loading seating report
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preparing the latest examination allocation...
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // EMPTY STATE
  // =========================================================

  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertCircle size={26} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            No seating allocation available
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            No examination seating records were found.
            Generate or upload a seating allocation before
            opening the master report.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-left">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">

            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>

            <button
              type="button"
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />

              Retry
            </button>

          </div>

        </div>

      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* =====================================================
          SCREEN ACTION BAR
      ===================================================== */}

      <div className="print:hidden sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">

        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div>

              <h1 className="text-sm font-semibold text-slate-900 sm:text-base">
                Master Seating Report
              </h1>

              <p className="text-xs text-slate-500">
                Final examination seating and attendance register
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2">

            <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 md:inline-flex">
              {data.length} candidates allocated
            </span>

            <button
              type="button"
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Printer size={16} />
              Print Report
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          SCREEN PAGE
      ===================================================== */}

      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">

        {/* Screen title */}

        <div className="print:hidden mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <FileText size={22} />
              </div>

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Master Seating Manifest
                  </h2>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 size={12} />
                    Allocation Available
                  </span>

                </div>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Complete examination hall allocation with
                  candidate seating and attendance information.
                </p>

              </div>

            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">

              <ShieldCheck
                size={16}
                className="text-indigo-600"
              />

              <span className="text-xs font-medium text-slate-600">
                Examination Record
              </span>

            </div>

          </div>

        </div>

        {/* =====================================================
            SCREEN SUMMARY
        ===================================================== */}

        <div className="print:hidden mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            label="Total Candidates"
            value={summary.total}
            icon={<Users size={19} />}
            tone="indigo"
          />

          <SummaryCard
            label="Examination Halls"
            value={summary.rooms}
            icon={<Building2 size={19} />}
            tone="blue"
          />

          <SummaryCard
            label="Present"
            value={summary.present}
            icon={<CheckCircle2 size={19} />}
            tone="emerald"
          />

          <SummaryCard
            label="Absent"
            value={summary.absent}
            icon={<AlertCircle size={19} />}
            tone="red"
          />

        </div>

        {/* =====================================================
            PRINTABLE DOCUMENT
        ===================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none">

          <div className="p-5 sm:p-8 lg:p-10 print:p-0">

            {/* =================================================
                OFFICIAL DOCUMENT HEADER
            ================================================= */}

            <div className="mb-8 border-b-2 border-slate-900 pb-6 text-center print:mb-5 print:pb-4">

              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white print:hidden">
                <ClipboardCheck size={22} />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 print:text-xl">
                Ramdeobaba University, Nagpur
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-700 print:text-xs">
                Final Examination Seating & Attendance Record
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 print:text-[9px]">

                <span>
                  Academic Examination Record
                </span>

                <span className="hidden sm:inline">
                  •
                </span>

                <span>
                  Total Candidates: {summary.total}
                </span>

                <span className="hidden sm:inline">
                  •
                </span>

                <span>
                  Total Halls: {summary.rooms}
                </span>

              </div>

            </div>

            {/* =================================================
                MASTER TABLE
            ================================================= */}

            <div className="overflow-x-auto print:overflow-visible">

              <table className="w-full min-w-[900px] border-collapse print:min-w-0">

                <thead>

                  <tr className="border-y border-slate-300 bg-slate-50">

                    <ReportHeader>
                      Room
                    </ReportHeader>

                    <ReportHeader>
                      Seat
                    </ReportHeader>

                    <ReportHeader>
                      Roll Number
                    </ReportHeader>

                    <ReportHeader align="left">
                      Candidate Name
                    </ReportHeader>

                    <ReportHeader>
                      Syllabus Group
                    </ReportHeader>

                    <ReportHeader>
                      Attendance
                    </ReportHeader>

                  </tr>

                </thead>

                <tbody>

                  {data.map((student, index) => {

                    const attendanceStatus = String(
                      student.attendance_status || ''
                    ).toLowerCase();

                    const isPresent =
                      attendanceStatus === 'present';

                    const isAbsent =
                      attendanceStatus === 'absent';

                    return (
                      <tr
                        key={
                          student.id ||
                          `${student.roll_no}-${student.seat_no}-${index}`
                        }
                        className="border-b border-slate-200 transition hover:bg-slate-50 print:break-inside-avoid"
                      >

                        <ReportCell center strong>
                          {student.room_no || '—'}
                        </ReportCell>

                        <ReportCell center>
                          <div className="inline-flex items-center gap-1.5">
                            <Armchair
                              size={13}
                              className="text-slate-400 print:hidden"
                            />

                            <span className="font-semibold text-slate-800">
                              {student.seat_no || '—'}
                            </span>
                          </div>
                        </ReportCell>

                        <ReportCell center strong>
                          {student.roll_no || '—'}
                        </ReportCell>

                        <td className="border-r border-slate-200 px-3 py-3 text-sm font-medium text-slate-800 print:px-2 print:py-2 print:text-[9px]">
                          {student.name || '—'}
                        </td>

                        <ReportCell center>
                          <span className="font-medium text-indigo-600 print:text-slate-900">
                            {student.paper_group_id || '—'}
                          </span>
                        </ReportCell>

                        <td className="px-3 py-3 text-center print:px-2 print:py-2">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium print:bg-transparent print:p-0 print:text-[9px] print:text-slate-900 ${
                              isPresent
                                ? 'bg-emerald-50 text-emerald-700'
                                : isAbsent
                                ? 'bg-red-50 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full print:hidden ${
                                isPresent
                                  ? 'bg-emerald-500'
                                  : isAbsent
                                  ? 'bg-red-500'
                                  : 'bg-slate-400'
                              }`}
                            />

                            {student.attendance_status ||
                              'Not Marked'}
                          </span>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

            {/* =================================================
                REPORT SUMMARY
            ================================================= */}

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3 print:mt-5 print:grid-cols-3 print:gap-2 print:pt-4">

              <PrintMetric
                label="Candidates"
                value={summary.total}
              />

              <PrintMetric
                label="Present"
                value={summary.present}
              />

              <PrintMetric
                label="Absent"
                value={summary.absent}
              />

            </div>

            {/* =================================================
                SIGNATURE AREA
            ================================================= */}

            <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 print:mt-14 print:grid-cols-3">

              <SignatureBlock label="Invigilator Signature" />

              <SignatureBlock label="Examination Coordinator" />

              <SignatureBlock label="Authorized Signatory" />

            </div>

            {/* =================================================
                DOCUMENT FOOTER
            ================================================= */}

            <div className="mt-10 border-t border-slate-200 pt-4 print:mt-7">

              <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between print:flex-row print:text-[8px]">

                <p>
                  Generated from Eco-Seat Examination Management System
                </p>

                <p>
                  Generated on {new Date().toLocaleString()}
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          PRINT CSS
      ===================================================== */}

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          html,
          body {
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          table {
            width: 100% !important;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
};

// =============================================================
// SUMMARY CARD
// =============================================================

const SummaryCard = ({
  label,
  value,
  icon,
  tone = 'indigo',
}) => {
  const tones = {
    indigo:
      'bg-indigo-50 text-indigo-600',
    blue:
      'bg-blue-50 text-blue-600',
    emerald:
      'bg-emerald-50 text-emerald-600',
    red:
      'bg-red-50 text-red-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            tones[tone] || tones.indigo
          }`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
};

// =============================================================
// REPORT HEADER
// =============================================================

const ReportHeader = ({
  children,
  align = 'center',
}) => (
  <th
    className={`border-r border-slate-300 px-3 py-3 text-xs font-semibold text-slate-600 last:border-r-0 print:px-2 print:py-2 print:text-[8px] ${
      align === 'left'
        ? 'text-left'
        : 'text-center'
    }`}
  >
    {children}
  </th>
);

// =============================================================
// REPORT CELL
// =============================================================

const ReportCell = ({
  children,
  center = false,
  strong = false,
}) => (
  <td
    className={`border-r border-slate-200 px-3 py-3 text-sm text-slate-600 last:border-r-0 print:px-2 print:py-2 print:text-[9px] ${
      center ? 'text-center' : ''
    } ${
      strong
        ? 'font-semibold text-slate-800'
        : ''
    }`}
  >
    {children}
  </td>
);

// =============================================================
// PRINT METRIC
// =============================================================

const PrintMetric = ({
  label,
  value,
}) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center print:rounded-none print:bg-white print:p-2">

    <p className="text-xl font-bold text-slate-900 print:text-sm">
      {value}
    </p>

    <p className="mt-1 text-xs font-medium text-slate-500 print:text-[8px]">
      {label}
    </p>

  </div>
);

// =============================================================
// SIGNATURE
// =============================================================

const SignatureBlock = ({ label }) => (
  <div className="text-center">

    <div className="mx-auto h-px w-44 bg-slate-400" />

    <p className="mt-2 text-xs font-medium text-slate-500 print:text-[8px]">
      {label}
    </p>

  </div>
);

export default MasterSeatingPDF;