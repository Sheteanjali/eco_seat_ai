// File: frontend/src/pages/Admin/UploadHub.js

import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Lock,
  Play,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  Loader2,
  Clock,
  X,
  Database,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import apiService from '../../services/api';

const UploadHub = () => {
  const [studentFile, setStudentFile] = useState(null);
  const [roomFile, setRoomFile] = useState(null);
  const [seatingMode, setSeatingMode] = useState('Double');
  const [status, setStatus] = useState('idle');

  // =========================================================
  // PROCESS UPLOAD
  // Original backend logic preserved
  // =========================================================

  const handleProcess = async () => {
    if (!studentFile || !roomFile) return;

    setStatus('processing');

    const formData = new FormData();

    formData.append('student_file', studentFile);
    formData.append('room_file', roomFile);
    formData.append('mode', seatingMode);

    try {
      const response = await apiService.uploadBulkData(formData);

      if (response.data?.status === 'success') {
        setStatus('success');
        localStorage.setItem('systemStatus', 'LOCKED');
      } else {
        setStatus('error');
      }
    } catch (err) {
      const errorDetails =
        err.response?.data?.detail ||
        err.response?.data ||
        err.message ||
        'Unknown error';

      console.error(
        'AI Engine Sync Failed. Detailed Error:',
        errorDetails
      );

      setStatus('error');

      if (err.response?.status === 500) {
        alert(
          'Server Error (500): Check if CSV headers match (rollno, branch, year, etc.)'
        );
      } else if (!err.response) {
        alert(
          'Network Error: Ensure your FastAPI backend is running at http://127.0.0.1:8765'
        );
      }
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Database size={20} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Seating Allocation
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Data Upload & Optimization
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Upload student and examination room data, select the seating
                  configuration and generate the seating plan.
                </p>
              </div>
            </div>

            {/* MODE */}

            <div className="w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:w-auto">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Seating Mode
              </p>

              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                {['Single', 'Double'].map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setSeatingMode(mode)}
                    className={`min-w-[120px] rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      seatingMode === mode
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {mode} per Bench
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================
            PROCESS STEPS
        ===================================================== */}

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatusItem
            number="01"
            title="Student Data"
            description="Upload registry"
            completed={!!studentFile}
          />

          <StatusItem
            number="02"
            title="Room Data"
            description="Upload infrastructure"
            completed={!!roomFile}
          />

          <StatusItem
            number="03"
            title="Generate Plan"
            description="Process allocation"
            completed={status === 'success'}
          />
        </section>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">

          {/* ===================================================
              LEFT PANEL
          =================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <UploadCloud size={19} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Upload Examination Data
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Upload both CSV files before generating the seating plan.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">

              {/* STUDENT FILE */}

              <UploadCard
                step="01"
                title="Student Registry"
                description="Student information used for examination seating allocation."
                file={studentFile}
                icon={<FileText size={22} />}
                inputId="stFile"
                onChange={(e) =>
                  setStudentFile(e.target.files?.[0] || null)
                }
                onRemove={() => setStudentFile(null)}
                requirements="CSV containing rollno, branch and year"
              />

              {/* ROOM FILE */}

              <UploadCard
                step="02"
                title="Room Infrastructure"
                description="Examination hall information used for room allocation."
                file={roomFile}
                icon={<LayoutGrid size={22} />}
                inputId="rmFile"
                onChange={(e) =>
                  setRoomFile(e.target.files?.[0] || null)
                }
                onRemove={() => setRoomFile(null)}
                requirements="CSV containing room_no, capacity and floor"
              />

              {/* READINESS */}

              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <FileReadiness
                  label="Student Registry"
                  ready={!!studentFile}
                />

                <FileReadiness
                  label="Room Infrastructure"
                  ready={!!roomFile}
                />
              </div>

            </div>
          </section>

          {/* ===================================================
              RIGHT PANEL
          =================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Clock size={19} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Allocation Configuration
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Review the configuration before processing.
                    </p>
                  </div>
                </div>

                {status === 'processing' && (
                  <Loader2
                    size={20}
                    className="animate-spin text-indigo-600"
                  />
                )}

                {status === 'success' && (
                  <CheckCircle2
                    size={20}
                    className="text-emerald-600"
                  />
                )}

              </div>
            </div>

            <div className="p-6">

              {/* CONFIGURATION */}

              <div className="space-y-3">
                <ConfigurationRow
                  label="Primary Shift"
                  value="09:30 AM"
                  description="Morning examination session"
                  ready={true}
                />

                <ConfigurationRow
                  label="Overflow Shift"
                  value="02:00 PM"
                  description="Afternoon examination session"
                  ready={true}
                />

                <ConfigurationRow
                  label="Seating Mode"
                  value={`${seatingMode} per Bench`}
                  description="Current allocation configuration"
                  ready={true}
                />

                <ConfigurationRow
                  label="Student Registry"
                  value={studentFile ? 'Ready' : 'Awaiting CSV'}
                  description={
                    studentFile
                      ? studentFile.name
                      : 'Student data not uploaded'
                  }
                  ready={!!studentFile}
                />

                <ConfigurationRow
                  label="Room Infrastructure"
                  value={roomFile ? 'Ready' : 'Awaiting CSV'}
                  description={
                    roomFile
                      ? roomFile.name
                      : 'Room data not uploaded'
                  }
                  ready={!!roomFile}
                />
              </div>

              {/* ERROR */}

              {status === 'error' && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Plan generation failed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-600">
                      Check the uploaded CSV files and backend connection,
                      then retry.
                    </p>
                  </div>
                </div>
              )}

              {/* SUCCESS */}

              {status === 'success' && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <ShieldCheck size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        Seating plan generated successfully
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-700">
                        Student and room data have been processed successfully.
                      </p>
                    </div>

                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2.5">
                    <Lock
                      size={14}
                      className="text-emerald-600"
                    />

                    <span className="text-xs font-semibold text-emerald-700">
                      Plan Finalized & Locked
                    </span>
                  </div>
                </div>
              )}

              {/* PROCESS BUTTON */}

              {status !== 'success' && (
                <div className="mt-6 border-t border-slate-100 pt-6">

                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={
                      !studentFile ||
                      !roomFile ||
                      status === 'processing'
                    }
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all ${
                      !studentFile ||
                      !roomFile ||
                      status === 'processing'
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : status === 'error'
                        ? 'bg-red-600 text-white shadow-sm hover:bg-red-700'
                        : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                    }`}
                  >

                    {status === 'processing' ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Generating Seating Plan...
                      </>
                    ) : status === 'error' ? (
                      <>
                        <AlertCircle size={17} />
                        Retry Plan Generation
                      </>
                    ) : (
                      <>
                        <Play size={17} />
                        Generate Seating Plan
                        <ArrowRight size={16} />
                      </>
                    )}

                  </button>

                  {!studentFile || !roomFile ? (
                    <p className="mt-3 text-center text-xs text-slate-400">
                      Upload both required CSV files to continue.
                    </p>
                  ) : (
                    <p className="mt-3 text-center text-xs text-emerald-600">
                      Both files are ready for processing.
                    </p>
                  )}

                </div>
              )}

            </div>
          </section>

        </div>

        {/* =====================================================
            CSV REQUIREMENTS
        ===================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileSpreadsheet size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  CSV Upload Requirements
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Verify that your CSV files contain the expected fields
                  before generating the seating plan.
                </p>
              </div>

            </div>

            <div className="flex flex-wrap gap-2">
              <RequirementBadge text="Student: rollno" />
              <RequirementBadge text="Student: branch" />
              <RequirementBadge text="Student: year" />
              <RequirementBadge text="Room: room_no" />
              <RequirementBadge text="Room: capacity" />
              <RequirementBadge text="Room: floor" />
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

// =============================================================
// UPLOAD CARD
// =============================================================

const UploadCard = ({
  step,
  title,
  description,
  file,
  icon,
  inputId,
  onChange,
  onRemove,
  requirements,
}) => {
  const active = !!file;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        active
          ? 'border-emerald-200 bg-emerald-50/40'
          : 'border-slate-200 bg-white hover:border-indigo-300'
      }`}
    >
      <div className="p-5">

        <div className="flex items-start gap-4">

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              active
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            {active ? <CheckCircle2 size={21} /> : icon}
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-start justify-between gap-3">

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Step {step}
                </p>

                <h3 className="mt-1 text-sm font-semibold text-slate-900">
                  {title}
                </h3>
              </div>

              {active && (
                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  File Ready
                </span>
              )}

            </div>

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              {description}
            </p>

            {active ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3">

                <div className="flex min-w-0 items-center gap-3">

                  <FileText
                    size={17}
                    className="shrink-0 text-emerald-600"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {file.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={onRemove}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Remove file"
                >
                  <X size={15} />
                </button>

              </div>
            ) : (
              <div className="mt-4">

                <input
                  type="file"
                  id={inputId}
                  className="hidden"
                  accept=".csv"
                  onChange={onChange}
                />

                <label
                  htmlFor={inputId}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <UploadCloud size={17} />
                  Choose CSV File
                </label>

              </div>
            )}

            <p className="mt-2 text-[10px] text-slate-400">
              {requirements}
            </p>

          </div>
        </div>

      </div>
    </div>
  );
};

// =============================================================
// CONFIGURATION ROW
// =============================================================

const ConfigurationRow = ({
  label,
  value,
  description,
  ready,
}) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">

    <div className="min-w-0">

      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold ${
          ready ? 'text-slate-800' : 'text-slate-400'
        }`}
      >
        {value}
      </p>

      {description && (
        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {description}
        </p>
      )}

    </div>

    {ready ? (
      <CheckCircle2
        size={18}
        className="shrink-0 text-emerald-500"
      />
    ) : (
      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />
    )}

  </div>
);

// =============================================================
// STATUS ITEM
// =============================================================

const StatusItem = ({
  number,
  title,
  description,
  completed,
}) => (
  <div
    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      completed
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-slate-200 bg-white'
    }`}
  >

    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
        completed
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {completed ? <CheckCircle2 size={16} /> : number}
    </div>

    <div>
      <p
        className={`text-xs font-semibold ${
          completed ? 'text-emerald-800' : 'text-slate-700'
        }`}
      >
        {title}
      </p>

      <p
        className={`mt-0.5 text-[10px] ${
          completed ? 'text-emerald-600' : 'text-slate-400'
        }`}
      >
        {completed ? 'Completed' : description}
      </p>
    </div>

  </div>
);

// =============================================================
// FILE READINESS
// =============================================================

const FileReadiness = ({ label, ready }) => (
  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          ready ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      />

      <span className="text-xs font-medium text-slate-600">
        {label}
      </span>
    </div>

    <span
      className={`text-[10px] font-semibold ${
        ready ? 'text-emerald-600' : 'text-slate-400'
      }`}
    >
      {ready ? 'READY' : 'REQUIRED'}
    </span>

  </div>
);

// =============================================================
// REQUIREMENT BADGE
// =============================================================

const RequirementBadge = ({ text }) => (
  <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-medium text-slate-500">
    {text}
  </span>
);

export default UploadHub;