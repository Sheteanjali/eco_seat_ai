// File: frontend/src/pages/Admin/Analytics.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Loader2,
  ShieldCheck,
  Search,
  Zap,
  Sun,
  Moon,
  AlertCircle,
  LayoutDashboard,
  MapPin,
  Hammer,
  CheckCircle2,
  BookOpen,
  DownloadCloud,
  FileText,
  Radio,
  RefreshCw,
  QrCode,
  Monitor,
  Building2,
  GraduationCap,
  UserCheck,
  UserX,
  Armchair,
  Filter,
  X,
} from 'lucide-react';

import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// File: frontend/src/pages/Admin/Analytics.js

const API_ROOT = (
  process.env.REACT_APP_API_URL ||
  'http://127.0.0.1:8765'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const API_BASE_URL = `${API_ROOT}/api`;

const normalizeRoom = (value) =>
  String(value ?? '')
    .replace(/^room\s*/i, '')
    .replace(/^hall\s*/i, '')
    .trim()
    .toLowerCase();


const safeText = (value, fallback = '—') => {
  const text = String(value ?? '').trim();

  if (
    !text ||
    text.toLowerCase() === 'undefined' ||
    text.toLowerCase() === 'null'
  ) {
    return fallback;
  }

  return text;
};


const Analytics = () => {
  // =========================================================
  // CORE STATE
  // =========================================================

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Admin / Invigilator view
  const [activeTab, setActiveTab] = useState('admin');

  // =========================================================
  // FILTERS
  // =========================================================

  const [selectedShift, setSelectedShift] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedRoom, setSelectedRoom] = useState('All');
  const [query, setQuery] = useState('');

  const [masterResults, setMasterResults] = useState([]);

  // =========================================================
  // INFRASTRUCTURE
  // =========================================================

  const [reportRoom, setReportRoom] = useState('');
  const [reportSeat, setReportSeat] = useState('');
  const [infraStatus, setInfraStatus] = useState('idle');

  // =========================================================
  // INVIGILATOR
  // =========================================================

  const [invigilatorRooms, setInvigilatorRooms] = useState([]);
  const [selectedInvigilatorRoom, setSelectedInvigilatorRoom] =
    useState('');

  const [invigilatorStream, setInvigilatorStream] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);

  const [scanRollNo, setScanRollNo] = useState('');

  const [scanStatus, setScanStatus] = useState({
    type: '',
    message: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionAlerts, setActionAlerts] = useState([]);


  // =========================================================
  // FETCH MAIN ADMIN DATA
  // =========================================================

  const fetchAnalyticsAndRegistry = async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const statsResponse = await axios.get(
        `${API_BASE_URL}/admin/analytics`
      );

      if (statsResponse.data) {
        setData(statsResponse.data);
      }
    } catch (error) {
      console.error(
        'Analytics statistics synchronization failed:',
        error
      );
    }

    try {
      const registryResponse = await axios.get(
        `${API_BASE_URL}/admin/search-hub`,
        {
          params: {
            filter_type: 'student',
            query: '',
          },
        }
      );

      const results = registryResponse.data?.results;

      if (Array.isArray(results)) {
        setMasterResults(results);
      } else {
        setMasterResults([]);
      }
    } catch (error) {
      console.error(
        'Student registry synchronization failed:',
        error
      );
      setMasterResults([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // =========================================================
  // FETCH CURRENT ADMIN-UPLOADED ROOMS
  // =========================================================

  const fetchInvigilatorRooms = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/invigilator/rooms`
      );

      const rooms = Array.isArray(response.data)
        ? response.data
        : [];

      setInvigilatorRooms(rooms);

      if (rooms.length === 0) {
        setSelectedInvigilatorRoom('');
        setInvigilatorStream(null);
        return;
      }

      setSelectedInvigilatorRoom((currentRoom) => {
        const currentStillExists =
          currentRoom &&
          rooms.some(
            (room) =>
              normalizeRoom(room.room_no) ===
              normalizeRoom(currentRoom)
          );

        if (currentStillExists) {
          return currentRoom;
        }

        return String(rooms[0].room_no);
      });
    } catch (error) {
      console.error(
        'Unable to load examination rooms:',
        error
      );

      setInvigilatorRooms([]);
    }
  };


  // =========================================================
  // FETCH INVIGILATOR ROOM STREAM
  // =========================================================

  const fetchHallStream = async (roomNo) => {
    if (!roomNo) {
      setInvigilatorStream(null);
      return;
    }

    setStreamLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/invigilator/dashboard-stream/${encodeURIComponent(
          roomNo
        )}`
      );

      setInvigilatorStream(
        response.data || null
      );
    } catch (error) {
      console.error(
        'Unable to load room stream:',
        error
      );

      setInvigilatorStream(null);
    } finally {
      setStreamLoading(false);
    }
  };


  const fetchAdminOperationalData = async () => {
    try {
      const alertsRes = await axios.get(
        `${API_BASE_URL}/admin/action-alerts`,
        { params: { limit: 30 } }
      );

      setActionAlerts(
        Array.isArray(alertsRes.data?.results)
          ? alertsRes.data.results
          : []
      );
    } catch (error) {
      console.error(
        "Unable to load admin operational data:",
        error
      );
    }
  };


  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    fetchAnalyticsAndRegistry();
    fetchInvigilatorRooms();
    fetchAdminOperationalData();

    const interval = window.setInterval(() => {
      fetchAnalyticsAndRegistry(true);
      fetchInvigilatorRooms();
      fetchAdminOperationalData();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);


  useEffect(() => {
    if (selectedInvigilatorRoom) {
      fetchHallStream(
        selectedInvigilatorRoom
      );
    }
  }, [selectedInvigilatorRoom]);


  // =========================================================
  // UNIQUE FILTER OPTIONS
  // =========================================================

  const uniqueRoomsList = useMemo(() => {
    const rooms = masterResults
      .map((student) =>
        safeText(student.room_no, '')
      )
      .filter(Boolean);

    return Array.from(
      new Set(rooms)
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
      })
    );
  }, [masterResults]);


  const uniqueBranchesList = useMemo(() => {
    const branches = masterResults
      .map((student) =>
        safeText(student.branch, '')
          .toUpperCase()
      )
      .filter(Boolean);

    return Array.from(
      new Set(branches)
    ).sort();
  }, [masterResults]);


  const uniqueYearsList = useMemo(() => {
    const years = masterResults
      .map((student) =>
        safeText(student.year, '')
      )
      .filter(Boolean);

    return Array.from(
      new Set(years)
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
      })
    );
  }, [masterResults]);


  const uniqueShiftsList = useMemo(() => {
    const shifts = masterResults
      .map((student) =>
        safeText(student.shift, '')
      )
      .filter(Boolean);

    return Array.from(
      new Set(shifts)
    ).sort();
  }, [masterResults]);


  // =========================================================
  // SEARCH + FILTER
  //
  // IMPORTANT:
  // query empty => ALL students remain visible.
  // query entered => matching cards only.
  // =========================================================

  const filteredResults = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return masterResults.filter((student) => {
      const searchableValues = [
        student.name,
        student.roll_no,
        student.branch,
        student.year,
        student.subject,
        student.room_no,
        student.seat_no,
        student.shift,
        student.slot,
      ]
        .map((value) =>
          String(value ?? '').toLowerCase()
        )
        .join(' ');

      return searchableValues.includes(keyword);
    });
  }, [masterResults, query]);


  // =========================================================
  // SEARCH RESULTS GROUPED ROOM-WISE
  //
  // Example:
  // Search "IT"
  // Room DT-101 -> IT 12
  // then only those 12 matching student cards.
  // =========================================================

  const filteredRoomGroups = useMemo(() => {
    const roomMap = new Map();

    filteredResults.forEach((student) => {
      const rawRoom =
        student.room_no ||
        'Unassigned';

      const roomKey =
        normalizeRoom(rawRoom) ||
        'unassigned';

      if (!roomMap.has(roomKey)) {
        roomMap.set(roomKey, {
          key: roomKey,
          roomNo: rawRoom,
          students: [],
        });
      }

      roomMap
        .get(roomKey)
        .students.push(student);
    });

    return Array.from(
      roomMap.values()
    )
      .map((room) => {
        const branchMap = {};

        room.students.forEach(
          (student) => {
            const branch =
              safeText(
                student.branch,
                'Other'
              );

            branchMap[branch] =
              (branchMap[branch] || 0) +
              1;
          }
        );

        return {
          ...room,
          branchStats:
            Object.entries(
              branchMap
            ).sort(
              (
                [branchA, countA],
                [branchB, countB]
              ) =>
                countB - countA ||
                branchA.localeCompare(
                  branchB
                )
            ),
        };
      })
      .sort((a, b) =>
        String(a.roomNo).localeCompare(
          String(b.roomNo),
          undefined,
          {
            numeric: true,
            sensitivity: 'base',
          }
        )
      );
  }, [filteredResults]);


  // =========================================================
  // ROOM-WISE ALLOCATION
  //
  // Uses MASTER RESULTS deliberately.
  // Search should not change actual room allocation totals.
  // =========================================================

  const roomAllocationData = useMemo(() => {
    const backendRooms = Array.isArray(
      data?.roomData
    )
      ? data.roomData
      : [];

    const roomMap = new Map();

    // First register rooms returned by analytics.
    backendRooms.forEach((room) => {
      const rawRoomNo =
        room.room_no ??
        room.name ??
        '';

      const roomNo = String(rawRoomNo)
        .replace(/^room\s*/i, '')
        .replace(/^hall\s*/i, '')
        .trim();

      if (!roomNo) {
        return;
      }

      const key =
        normalizeRoom(roomNo);

      const configuredCapacity =
        Number(room.capacity);

      roomMap.set(key, {
        roomNo,
        name: `Room ${roomNo}`,
        capacity:
          Number.isFinite(
            configuredCapacity
          ) &&
          configuredCapacity > 0
            ? configuredCapacity
            : 0,

        broken:
          Number(room.broken) || 0,

        rows:
          Number(room.rows) || 0,

        cols:
          Number(room.cols) || 0,

        students: [],
        branchCounts: {},
      });
    });

    // Then allocate every student into
    // his/her actual assigned room.
    masterResults.forEach((student) => {
      const roomNo = safeText(
        student.room_no,
        ''
      );

      if (!roomNo) {
        return;
      }

      const key =
        normalizeRoom(roomNo);

      if (!roomMap.has(key)) {
        roomMap.set(key, {
          roomNo,
          name: `Room ${roomNo}`,
          capacity: 0,
          broken: 0,
          rows: 0,
          cols: 0,
          students: [],
          branchCounts: {},
        });
      }

      const room =
        roomMap.get(key);

      room.students.push(student);

      const branch =
        safeText(
          student.branch,
          'Unspecified'
        ).toUpperCase();

      room.branchCounts[branch] =
        (room.branchCounts[branch] ||
          0) + 1;
    });

    return Array.from(
      roomMap.values()
    )
      .map((room) => ({
        ...room,

        allocated:
          room.students.length,

        available:
          room.capacity > 0
            ? Math.max(
                room.capacity -
                  room.students.length,
                0
              )
            : null,

        utilization:
          room.capacity > 0
            ? Math.min(
                Math.round(
                  (room.students.length /
                    room.capacity) *
                    100
                ),
                100
              )
            : null,

        branchStats:
          Object.entries(
            room.branchCounts
          ).sort(
            (a, b) =>
              b[1] - a[1]
          ),
      }))
      .sort((a, b) =>
        String(a.roomNo).localeCompare(
          String(b.roomNo),
          undefined,
          {
            numeric: true,
          }
        )
      );
  }, [data, masterResults]);


  // =========================================================
  // OVERALL BRANCH SUMMARY
  // =========================================================

  const overallBranchStats = useMemo(() => {
    const counts = {};

    masterResults.forEach(
      (student) => {
        const branch =
          safeText(
            student.branch,
            'Unspecified'
          ).toUpperCase();

        counts[branch] =
          (counts[branch] || 0) + 1;
      }
    );

    return Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    );
  }, [masterResults]);


  // =========================================================
  // FILTER STATUS
  // =========================================================

  const hasActiveFilters =
    Boolean(query.trim()) ||
    selectedShift !== 'All' ||
    selectedYear !== 'All' ||
    selectedBranch !== 'All' ||
    selectedRoom !== 'All';


  const clearFilters = () => {
    setSelectedShift('All');
    setSelectedYear('All');
    setSelectedBranch('All');
    setSelectedRoom('All');
    setQuery('');
  };


  // =========================================================
  // INVIGILATOR GATE SCAN
  // =========================================================

  const handleInvigilatorGateScan =
    async (event) => {
      event.preventDefault();

      if (
        !scanRollNo.trim() ||
        !selectedInvigilatorRoom
      ) {
        return;
      }

      setActionLoading(true);

      setScanStatus({
        type: '',
        message: '',
      });

      try {
        const response =
          await axios.post(
            `${API_BASE_URL}/invigilator/scan-gate/${encodeURIComponent(
              selectedInvigilatorRoom
            )}`,
            {
              roll_no:
                scanRollNo.trim(),
            }
          );

        setScanStatus({
          type: 'success',
          message:
            response.data?.message ||
            'Candidate verified successfully.',
        });

        setScanRollNo('');

        await fetchHallStream(
          selectedInvigilatorRoom
        );

        await fetchAnalyticsAndRegistry(
          true
        );
      } catch (error) {
        setScanStatus({
          type: 'error',

          message:
            error.response?.data
              ?.detail ||
            'Candidate verification failed.',
        });
      } finally {
        setActionLoading(false);
      }
    };


  // =========================================================
  // ATTENDANCE TOGGLE
  // =========================================================

  const handleToggleAttendance =
    async (
      rollNo,
      currentStatus
    ) => {
      const nextStatus =
        currentStatus === 'Present'
          ? 'Absent'
          : 'Present';

      try {
        await axios.patch(
          `${API_BASE_URL}/invigilator/toggle-attendance`,
          {
            roll_no: rollNo,
            status: nextStatus,
          }
        );

        await fetchHallStream(
          selectedInvigilatorRoom
        );

        await fetchAnalyticsAndRegistry(
          true
        );
      } catch (error) {
        window.alert(
          error.response?.data?.detail ||
            'Unable to update attendance.'
        );
      }
    };


  // =========================================================
  // FLAG DAMAGED SEAT
  // =========================================================

  const handleFlagSeatDamage =
    async (roomNo, tableId) => {
      if (!roomNo || !tableId) {
        return;
      }

      const confirmed =
        window.confirm(
          `Report ${tableId} in Room ${roomNo} as damaged?`
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await axios.post(
            `${API_BASE_URL}/invigilator/flag-broken-seat`,
            {
              room_no: roomNo,
              table_id: tableId,
            }
          );

        window.alert(
          response.data?.message ||
            'Seat issue reported.'
        );

        await fetchHallStream(
          selectedInvigilatorRoom
        );

        await fetchAnalyticsAndRegistry(
          true
        );
      } catch (error) {
        window.alert(
          error.response?.data?.detail ||
            'Unable to report damaged seat.'
        );
      }
    };


  // =========================================================
  // ADMIN INFRASTRUCTURE REPORT
  // =========================================================

  const handleMarkBroken =
    async () => {
      if (
        !reportRoom.trim() ||
        !reportSeat.trim()
      ) {
        return;
      }

      setInfraStatus('loading');

      try {
        await axios.patch(
          `${API_BASE_URL}/admin/room/update-infrastructure`,
          {
            room_no:
              reportRoom.trim(),

            table_id:
              reportSeat
                .trim()
                .toUpperCase(),

            is_broken: true,
          }
        );

        setInfraStatus('success');
        setReportSeat('');

        await fetchAnalyticsAndRegistry(
          true
        );

        window.setTimeout(() => {
          setInfraStatus('idle');
        }, 2500);
      } catch (error) {
        console.error(
          'Infrastructure update failed:',
          error
        );

        setInfraStatus('error');
      }
    };


  // =========================================================
  // ADMIN PDF EXPORT
  // =========================================================

  const downloadRegistryPdf = (
    mode
  ) => {
    const doc = new jsPDF(
      'l',
      'mm',
      'a4'
    );

    let exportData = [];
    let title =
      'Master Seating Registry';

    if (
      mode === 'current_filtered'
    ) {
      exportData = [
        ...filteredResults,
      ];

      title =
        'Filtered Seating Registry';
    } else if (mode === 'morning') {
      exportData =
        masterResults.filter(
          (student) =>
            safeText(
              student.shift,
              ''
            ).toLowerCase() ===
            'morning'
        );

      title =
        'Morning Shift Registry';
    } else if (
      mode === 'afternoon'
    ) {
      exportData =
        masterResults.filter(
          (student) =>
            safeText(
              student.shift,
              ''
            ).toLowerCase() ===
            'afternoon'
        );

      title =
        'Afternoon Shift Registry';
    } else {
      exportData = [
        ...masterResults,
      ];
    }

    if (exportData.length === 0) {
      window.alert(
        'No student records are available for this report.'
      );

      return;
    }

    doc.setFontSize(18);
    doc.setTextColor(
      15,
      23,
      42
    );

    doc.text(
      'EcoSeat AI - Examination Management',
      14,
      15
    );

    doc.setFontSize(10);

    doc.text(
      `${title} | ${exportData.length} Students`,
      14,
      22
    );

    const tableRows =
      exportData.map(
        (student) => [
          safeText(
            student.roll_no
          ),

          safeText(
            student.name
          ),

          safeText(
            student.branch
          ),

          safeText(
            student.year
          ),

          safeText(
            student.subject
          ),

          safeText(
            student.room_no
          ),

          safeText(
            student.seat_no
          ),

          safeText(
            student.shift
          ),
        ]
      );

    autoTable(doc, {
      head: [
        [
          'Roll Number',
          'Candidate Name',
          'Branch',
          'Year',
          'Subject',
          'Room',
          'Seat',
          'Shift',
        ],
      ],

      body: tableRows,

      startY: 28,

      theme: 'grid',

      headStyles: {
        fillColor: [37, 99, 235],
        fontSize: 8,
        fontStyle: 'bold',
      },

      styles: {
        fontSize: 8,
        font: 'sans-serif',
      },
    });

    doc.save(
      `EcoSeat_${mode}_Registry.pdf`
    );
  };


  // =========================================================
  // INVIGILATOR PDF
  // =========================================================

  const exportInvigilatorPdf =
    async () => {
      if (!selectedInvigilatorRoom) {
        window.alert(
          'No examination room is selected.'
        );

        return;
      }

      try {
        const response =
          await axios.get(
            `${API_BASE_URL}/invigilator/export-data`,
            {
              params: {
                room_no:
                  selectedInvigilatorRoom,

                branch:
                  selectedBranch,

                year:
                  selectedYear,

                subject: 'All',
              },
            }
          );

        const payload =
          response.data;

        const students =
          Array.isArray(
            payload?.students
          )
            ? payload.students
            : [];

        const doc = new jsPDF(
          'p',
          'mm',
          'a4'
        );

        doc.setFontSize(16);

        doc.text(
          `Invigilation Attendance - Room ${selectedInvigilatorRoom}`,
          14,
          15
        );

        doc.setFontSize(9);

        doc.text(
          `Total Candidates: ${students.length}`,
          14,
          22
        );

        autoTable(doc, {
          head: [
            [
              'Roll No',
              'Candidate',
              'Branch',
              'Year',
              'Seat',
              'Attendance',
            ],
          ],

          body: students.map(
            (student) => [
              safeText(
                student.roll_no
              ),

              safeText(
                student.name
              ),

              safeText(
                student.branch
              ),

              safeText(
                student.year
              ),

              safeText(
                student.seat_no
              ),

              safeText(
                student.attendance_status
              ),
            ]
          ),

          startY: 28,

          theme: 'grid',

          headStyles: {
            fillColor: [
              15,
              23,
              42,
            ],
          },

          styles: {
            fontSize: 8,
          },
        });

        doc.save(
          `Room_${selectedInvigilatorRoom}_Attendance.pdf`
        );
      } catch (error) {
        window.alert(
          error.response?.data?.detail ||
            'Unable to generate attendance PDF.'
        );
      }
    };


  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={34}
            className="animate-spin text-blue-600 mx-auto"
          />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading examination analytics...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Synchronizing rooms and student allocations
          </p>
        </div>
      </div>
    );
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 py-7 space-y-6">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <section className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live examination data
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Examination Analytics
            </h1>

            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              Monitor room allocation, branch distribution,
              student seating and attendance from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                fetchAnalyticsAndRegistry();
                fetchInvigilatorRooms();
                fetchAdminOperationalData();
              }}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
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


          </div>
        </section>


        {/* ===================================================
            ADMIN VIEW START
        =================================================== */}

        <>
            {/* ===============================================
                SUMMARY METRICS
            =============================================== */}

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard
                title="Allocated Students"
                value={
                  data?.totalStudents ??
                  masterResults.length
                }
                description="Current seating plan"
                icon={<Users size={19} />}
                iconClass="bg-blue-50 text-blue-600"
              />

              <MetricCard
                title="Present"
                value={
                  data?.presentCount ?? 0
                }
                description="Verified attendance"
                icon={
                  <UserCheck size={19} />
                }
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <MetricCard
                title="Examination Rooms"
                value={
                  roomAllocationData.length
                }
                description="Configured by Admin"
                icon={
                  <Building2 size={19} />
                }
                iconClass="bg-violet-50 text-violet-600"
              />

              <MetricCard
                title="Utilization"
                value={`${
                  data?.utilization ?? 0
                }%`}
                description="Overall room usage"
                icon={<Zap size={19} />}
                iconClass="bg-amber-50 text-amber-600"
              />
            </section>






            {/* ===============================================
                INVIGILATOR ACTION ALERTS
            =============================================== */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Invigilator Action Alerts
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Invigilators select their active room from their own dashboard.
                    Attendance, broken-seat and seat-reassignment activity appears here.
                  </p>
                </div>
                <ShieldCheck size={19} className="text-blue-600" />
              </div>

              <div className="mt-4 space-y-3 max-h-[340px] overflow-y-auto">
                {actionAlerts.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">
                    No invigilator actions recorded yet.
                  </p>
                ) : actionAlerts.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-blue-600">
                        {safeText(item.actor_username, item.actor_role)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                  </div>
                ))}
              </div>
            </section>


            {/* ===============================================
                REPORT / EXPORT SECTION
            =============================================== */}

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={19} />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Examination Reports
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Export the complete seating registry or
                      only the currently filtered students.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <ExportButton
                    icon={
                      <FileText
                        size={16}
                      />
                    }
                    title="Filtered"
                    description={
                      query.trim()
                        ? `${filteredResults.length} students`
                        : 'Search first'
                    }
                    onClick={() => {
                      if (!query.trim()) {
                        window.alert(
                          'Search a student first to export search results.'
                        );
                        return;
                      }

                      downloadRegistryPdf(
                        'current_filtered'
                      );
                    }}
                  />

                  <ExportButton
                    icon={
                      <Sun size={16} />
                    }
                    title="Morning"
                    description="Morning shift"
                    onClick={() =>
                      downloadRegistryPdf(
                        'morning'
                      )
                    }
                  />

                  <ExportButton
                    icon={
                      <Moon size={16} />
                    }
                    title="Afternoon"
                    description="Afternoon shift"
                    onClick={() =>
                      downloadRegistryPdf(
                        'afternoon'
                      )
                    }
                  />

                  <ExportButton
                    icon={
                      <DownloadCloud
                        size={16}
                      />
                    }
                    title="Master"
                    description={`${masterResults.length} students`}
                    onClick={() =>
                      downloadRegistryPdf(
                        'overall'
                      )
                    }
                  />
                </div>
              </div>


              {/* =============================================
                  BROKEN SEAT CONTROL
              ============================================= */}

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Hammer size={18} />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Seat Maintenance
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Mark a damaged examination table.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-slate-600">
                      Room Number
                    </label>

                    <input
                      type="text"
                      value={reportRoom}
                      onChange={(event) =>
                        setReportRoom(
                          event.target.value
                        )
                      }
                      placeholder="Enter room number"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-slate-600">
                      Table ID
                    </label>

                    <input
                      type="text"
                      value={reportSeat}
                      onChange={(event) =>
                        setReportSeat(
                          event.target.value
                        )
                      }
                      placeholder="Enter table ID"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm uppercase outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  {infraStatus ===
                    'error' && (
                    <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-xs font-medium text-red-700">
                      Unable to update seat
                      status.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      handleMarkBroken
                    }
                    disabled={
                      infraStatus ===
                        'loading' ||
                      !reportRoom.trim() ||
                      !reportSeat.trim()
                    }
                    className={`w-full h-10 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition ${
                      infraStatus ===
                      'success'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed'
                    }`}
                  >
                    {infraStatus ===
                    'loading' ? (
                      <>
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                        Updating...
                      </>
                    ) : infraStatus ===
                      'success' ? (
                      <>
                        <CheckCircle2
                          size={15}
                        />
                        Updated
                      </>
                    ) : (
                      <>
                        <Hammer
                          size={15}
                        />
                        Mark as Broken
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>




            {/* ===============================================
                STUDENT SEARCH
                Search results are grouped room-wise.
            =============================================== */}

            <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="px-5 py-5 border-b border-slate-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Search
                        size={18}
                        className="text-blue-600"
                      />

                      <h2 className="text-base font-bold text-slate-900">
                        Search Student
                      </h2>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Search by student name, roll number, subject,
                      year, branch, room, seat or slot.
                    </p>
                  </div>

                  {query.trim() && (
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                        <span className="text-xs font-semibold text-blue-600">
                          Students
                        </span>

                        <span className="ml-2 text-sm font-bold text-blue-900">
                          {filteredResults.length}
                        </span>
                      </div>

                      <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500">
                          Rooms
                        </span>

                        <span className="ml-2 text-sm font-bold text-slate-900">
                          {filteredRoomGroups.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={query}
                    onChange={(event) =>
                      setQuery(event.target.value)
                    }
                    placeholder="Search name, roll no, subject, year, branch, room or slot..."
                    className="w-full h-12 pl-12 pr-11 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition"
                  />

                  {query && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuery('')
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {!query.trim() ? null : filteredResults.length === 0 ? (
                <EmptyState
                  icon={<Search size={22} />}
                  title="No students found"
                  description="No student matches this name, subject, year, branch, room or slot."
                />
              ) : (
                <div className="p-5 space-y-5">
                  {filteredRoomGroups.map(
                    (room) => (
                      <div
                        key={room.key}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden"
                      >
                        <div className="px-4 py-4 bg-white border-b border-slate-200">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Building2 size={18} />
                              </div>

                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                  Matching Room
                                </p>

                                <h3 className="text-base font-bold text-slate-950">
                                  {String(room.roomNo)
                                    .toLowerCase()
                                    .startsWith('room')
                                    ? room.roomNo
                                    : `Room ${room.roomNo}`}
                                </h3>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {room.branchStats.map(
                                ([branch, count]) => (
                                  <span
                                    key={branch}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100"
                                  >
                                    <span className="text-xs font-bold text-blue-700">
                                      {branch}
                                    </span>

                                    <span className="text-sm font-bold text-slate-950">
                                      {count}
                                    </span>
                                  </span>
                                )
                              )}

                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold">
                                {room.students.length}{' '}
                                students
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                            {room.students.map(
                              (
                                student,
                                index
                              ) => (
                                <StudentCard
                                  key={
                                    student.id ||
                                    student.roll_no ||
                                    `${room.key}-${student.seat_no}-${index}`
                                  }
                                  student={{
                                    ...student,
                                    shift:
                                      student.shift ||
                                      student.slot,
                                  }}
                                />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>


            {/* ===============================================
                ROOM-WISE BRANCH DISTRIBUTION
            =============================================== */}

            <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="px-5 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2
                      size={18}
                      className="text-blue-600"
                    />

                    <h2 className="text-base font-bold text-slate-900">
                      Room-wise Student Allocation
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Actual student count and branch distribution
                    for every examination room.
                  </p>
                </div>

                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-900">
                    {roomAllocationData.length}
                  </span>{' '}
                  rooms •{' '}
                  <span className="font-semibold text-slate-900">
                    {masterResults.length}
                  </span>{' '}
                  students
                </div>
              </div>

              {roomAllocationData.length === 0 ? (
                <EmptyState
                  icon={
                    <Building2 size={22} />
                  }
                  title="No rooms available"
                  description="Upload room and student data to generate room-wise allocation."
                />
              ) : (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {roomAllocationData.map(
                    (room) => (
                      <RoomAllocationCard
                        key={normalizeRoom(room.roomNo)}
                        room={room}
                      />
                    )
                  )}
                </div>
              )}
            </section>


          </>

              </div>
    </div>
  );
};


// ============================================================
// ROOM ALLOCATION CARD
// ============================================================

const RoomAllocationCard = ({
  room,
}) => {
  const utilization =
    room.utilization;

  const hasCapacity =
    room.capacity > 0;

  return (
    <article className="border border-slate-200 rounded-xl bg-white overflow-hidden hover:shadow-md transition-shadow">
      {/* HEADER */}

      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Examination Room
              </p>

              <h3 className="mt-0.5 text-lg font-bold text-slate-950">
                Room {room.roomNo}
              </h3>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            {room.allocated} Students
          </span>
        </div>
      </div>


      {/* ROOM METRICS */}

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <RoomMiniMetric
            label="Allocated"
            value={room.allocated}
          />

          <RoomMiniMetric
            label="Capacity"
            value={
              hasCapacity
                ? room.capacity
                : '—'
            }
          />

          <RoomMiniMetric
            label="Available"
            value={
              room.available !== null
                ? room.available
                : '—'
            }
          />
        </div>


        {/* UTILIZATION */}

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Room utilization
            </span>

            <span className="text-xs font-bold text-slate-700">
              {utilization !== null
                ? `${utilization}%`
                : 'Not configured'}
            </span>
          </div>

          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{
                width:
                  utilization !== null
                    ? `${Math.min(
                        utilization,
                        100
                      )}%`
                    : '0%',
              }}
            />
          </div>
        </div>


        {/* BRANCH COUNTS */}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap
                size={15}
                className="text-slate-500"
              />

              <p className="text-xs font-bold text-slate-700">
                Branch-wise Students
              </p>
            </div>

            <span className="text-[11px] font-semibold text-slate-400">
              {room.branchStats.length}{' '}
              branches
            </span>
          </div>

          {room.branchStats.length ===
          0 ? (
            <div className="px-3 py-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                No students allocated
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {room.branchStats.map(
                ([branch, count]) => (
                  <div
                    key={branch}
                    className="px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <p
                      className="text-[11px] font-bold text-slate-500 truncate"
                      title={branch}
                    >
                      {branch}
                    </p>

                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-950">
                        {count}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        students
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>


        {/* ROOM CONFIGURATION */}

        {(room.rows > 0 ||
          room.cols > 0 ||
          room.broken > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500">
            {room.rows > 0 && (
              <span>
                Rows:{' '}
                <strong className="text-slate-700">
                  {room.rows}
                </strong>
              </span>
            )}

            {room.cols > 0 && (
              <span>
                Columns:{' '}
                <strong className="text-slate-700">
                  {room.cols}
                </strong>
              </span>
            )}

            {room.broken > 0 && (
              <span className="text-amber-700">
                Damaged:{' '}
                <strong>
                  {room.broken}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
};


// ============================================================
// ROOM MINI METRIC
// ============================================================

const RoomMiniMetric = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-3 text-center">
      <p className="text-lg font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
};


// ============================================================
// STUDENT CARD
// ============================================================

const StudentCard = ({
  student,
}) => {
  const name = safeText(
    student.name,
    'Student'
  );

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join('');

  const attendance =
    safeText(
      student.attendance_status,
      'Not Marked'
    );

  const isPresent =
    attendance
      .toLowerCase()
      .includes('present');

  const isAbsent =
    attendance
      .toLowerCase()
      .includes('absent');

  return (
    <article className="group border border-slate-200 rounded-xl bg-white p-4 hover:border-blue-200 hover:shadow-md transition-all">
      {/* STUDENT HEADER */}

      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
          {initials || 'ST'}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-bold text-slate-950 truncate"
            title={name}
          >
            {name}
          </h3>

          <p className="mt-1 text-xs font-medium text-slate-500 truncate">
            {safeText(
              student.roll_no
            )}
          </p>
        </div>

        <span
          className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${
            isPresent
              ? 'bg-emerald-50 text-emerald-700'
              : isAbsent
              ? 'bg-red-50 text-red-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {attendance}
        </span>
      </div>


      {/* BRANCH / YEAR */}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-violet-50 text-violet-700 text-xs font-semibold">
          <GraduationCap size={13} />

          {safeText(
            student.branch
          )}
        </span>

        <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
          Year{' '}
          {safeText(
            student.year
          )}
        </span>

        {student.shift && (
          <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold">
            {safeText(
              student.shift
            )}
          </span>
        )}
      </div>


      {/* DETAILS */}

      <div className="mt-4 space-y-2.5">
        <StudentInfoRow
          label="Subject"
          value={safeText(
            student.subject
          )}
          icon={
            <BookOpen size={14} />
          }
        />

        <StudentInfoRow
          label="Room"
          value={
            student.room_no
              ? `Room ${student.room_no}`
              : '—'
          }
          icon={
            <Building2 size={14} />
          }
        />

        <StudentInfoRow
          label="Seat"
          value={safeText(
            student.seat_no
          )}
          icon={
            <Armchair size={14} />
          }
        />
      </div>


      {/* FOOTER */}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <MapPin size={12} />

          <span>
            {student.room_no
              ? `Room ${student.room_no}`
              : 'Room not assigned'}
          </span>
        </div>

        <span className="text-xs font-bold text-blue-600">
          {safeText(
            student.seat_no,
            'No seat'
          )}
        </span>
      </div>
    </article>
  );
};


// ============================================================
// STUDENT INFO ROW
// ============================================================

const StudentInfoRow = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-slate-400 shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </p>

        <p
          className="mt-0.5 text-xs font-semibold text-slate-700 truncate"
          title={String(value)}
        >
          {value}
        </p>
      </div>
    </div>
  );
};


// ============================================================
// MAIN METRIC CARD
// ============================================================

const MetricCard = ({
  title,
  value,
  description,
  icon,
  iconClass = '',
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};


// ============================================================
// SMALL METRIC
// ============================================================

const SmallMetric = ({
  label,
  value,
  icon,
  valueClass = 'text-slate-950',
}) => {
  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[11px] font-semibold">
          {label}
        </span>
      </div>

      <p
        className={`mt-2 text-xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
};


// ============================================================
// SELECT FILTER
// ============================================================

const SelectFilter = ({
  label,
  value,
  onChange,
  options,
  allLabel,
}) => {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-semibold text-slate-600">
        {label}
      </label>

      <div className="relative">
        <Filter
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />

        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full h-10 pl-9 pr-8 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 appearance-none"
        >
          <option value="All">
            {allLabel}
          </option>

          {options.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            )
          )}
        </select>

        <ChevronDownIcon />
      </div>
    </div>
  );
};


// ============================================================
// SIMPLE SELECT CHEVRON
// No extra icon-library dependency.
// ============================================================

const ChevronDownIcon = () => {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
    >
      <path
        d="M6 8l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};


// ============================================================
// FILTER CHIP
// ============================================================

const FilterChip = ({
  label,
  onRemove,
}) => {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700">
      <span className="max-w-[180px] truncate">
        {label}
      </span>

      <button
        type="button"
        onClick={onRemove}
        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-blue-100 transition"
        aria-label={`Remove ${label} filter`}
      >
        <X size={11} />
      </button>
    </span>
  );
};


// ============================================================
// EXPORT BUTTON
// ============================================================

const ExportButton = ({
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left border border-slate-200 rounded-lg p-3 bg-white hover:border-blue-200 hover:bg-blue-50/40 transition"
    >
      <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold text-slate-900">
        {title}
      </p>

      <p className="mt-0.5 text-xs text-slate-400">
        {description}
      </p>
    </button>
  );
};


// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="py-14 px-5 text-center">
      <div className="w-11 h-11 mx-auto rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
        {icon}
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
        {description}
      </p>
    </div>
  );
};


// ============================================================
// TABLE HELPERS
// ============================================================

const TableHead = ({
  children,
  align = 'left',
}) => {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 ${
        align === 'right'
          ? 'text-right'
          : 'text-left'
      }`}
    >
      {children}
    </th>
  );
};


const TableCell = ({
  children,
  align = 'left',
}) => {
  return (
    <td
      className={`px-4 py-3 text-xs text-slate-600 ${
        align === 'right'
          ? 'text-right'
          : 'text-left'
      }`}
    >
      {children}
    </td>
  );
};


// ============================================================
// EXPORT
// ============================================================

export default Analytics;