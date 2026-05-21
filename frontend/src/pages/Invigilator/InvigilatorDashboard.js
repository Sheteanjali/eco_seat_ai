import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import {
  Radio,
  RefreshCw,
  Download,
  Grid,
  ScanLine,
  Search,
  Layers,
  AlertTriangle,
  Users,
  Hammer
} from 'lucide-react';

const InvigilatorDashboard = () => {
  const [roomNo, setRoomNo] = useState("DT-101");
  const [metrics, setMetrics] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);

  // 👑 VIVA VALIDATION LAYOUT FLAGS
  const [selectedBranchTab, setSelectedBranchTab] = useState("IT");

  const availableRoomsList = [
    "DT-101", "DT-102", "DT-103",
    "DT-201", "DT-202", "DT-203",
    "DT-301", "DT-302", "DT-303"
  ];

  const institutionalBranches = ["IT", "CS", "CE", "EE", "ME", "EC"];

  // FETCH DATA
  const fetchIntegrityMetrics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/invigilator/dashboard-stream/${roomNo}`
      );

      if (res.data && res.data.room_metrics && res.data.registry && res.data.registry.length > 0) {
        setMetrics(res.data.room_metrics);
        setRegistry(res.data.registry);
      } else {
        handleDummyData();
      }
    } catch (err) {
      handleDummyData();
    } finally {
      setLoading(false);
    }
  };

  // DUMMY DATA (Grouped sequentially branch-wise matching your 90 seated matrix)
  const handleDummyData = () => {
    const mockRegistry = [];
    const branchDistribution = [
      ...Array(15).fill("IT"), ...Array(14).fill("CS"), ...Array(13).fill("CE"),
      ...Array(20).fill("EE"), ...Array(19).fill("ME"), ...Array(9).fill("EC")
    ];

    for (let i = 1; i <= 90; i++) {
      const tableNum = Math.ceil(i / 2);
      const side = i % 2 === 1 ? "L" : "R";
      const roomNumClean = roomNo.replace(/\D/g, "") || "101";

      mockRegistry.push({
        id: i,
        table_no: `T${tableNum}`,
        seat_no: `R${Math.ceil(tableNum / 5)}C${(tableNum % 5) === 0 ? 5 : tableNum % 5}_${side}`,
        name: i % 9 === 0 ? "Manan Sharma" : i % 11 === 0 ? "Drishthi Vyas" : `Student Candidate ${roomNumClean}-${100 + i}`,
        roll_no: `2026RBU${roomNumClean}${i < 10 ? '0' + i : i}`,
        branch: branchDistribution[i - 1] || "CSE",
        attendance_status: "Absent",
        is_chair_broken: false
      });
    }

    setMetrics({
      allocated_candidates: 90,
      verified_count: 0,
      absent_count: 90,
      broken_chairs_count: 0
    });
    setRegistry(mockRegistry);
  };

  // SCAN WITH STRICT ROLE AND BRANCH VALIDATION LOOKUP
  const handleGateScanSubmit = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const updated = [...registry];
    const index = updated.findIndex(
      (s) => s.roll_no.toLowerCase() === scanInput.trim().toLowerCase()
    );

    if (index !== -1) {
      const targetStudent = updated[index];

      // 🚨 CRITICAL GATE CONSTRAINT BOUNDARY ENFORCEMENT
      if (targetStudent.branch !== selectedBranchTab) {
        setScanStatus({
          success: false,
          message: `FRAUD EXCEPTION: Candidate belongs to branch '${targetStudent.branch}', but verification loop is locked inside the '${selectedBranchTab} Module'. Select correct branch tab first!`
        });
        return;
      }

      if (targetStudent.is_chair_broken) {
        setScanStatus({
          success: false,
          message: "Verification Blocked: Table assigned to this candidate has structural defect alerts."
        });
        return;
      }

      updated[index].attendance_status = "Present";
      setRegistry(updated);

      const presentCount = updated.filter((s) => s.attendance_status === "Present").length;
      const brokenCount = updated.filter((s) => s.is_chair_broken).length;

      setMetrics({
        ...metrics,
        verified_count: presentCount,
        absent_count: metrics.allocated_candidates - presentCount - brokenCount
      });

      setScanStatus({
        success: true,
        message: `Attendance Confirmed: ${targetStudent.name} authenticated at Seat ${targetStudent.seat_no}`
      });
      setScanInput("");
    } else {
      setScanStatus({
        success: false,
        message: "Student Not Found in this classroom ledger map."
      });
    }
  };

  // 👥 DUAL WORKSPACE HARDWARE FAULT SIGNALING LOOP
  const handleFlagBrokenChair = async (tableNo) => {
    if (!window.confirm(`Disaster Alert Workflow:\nAre you sure Table ${tableNo} is broken?\nThis will flag both student slots allocated to this workspace bench structure.`)) return;

    const updated = [...registry];
    updated.forEach((student) => {
      if (student.table_no === tableNo) {
        student.is_chair_broken = true;
        student.attendance_status = "Pending Admin Reroute";
      }
    });

    setRegistry(updated);

    const presentCount = updated.filter((s) => s.attendance_status === "Present").length;
    const brokenCount = updated.filter((s) => s.is_chair_broken).length;

    setMetrics({
      ...metrics,
      verified_count: presentCount,
      broken_chairs_count: brokenCount,
      absent_count: metrics.allocated_candidates - presentCount - brokenCount
    });

    try {
      await axios.post('http://127.0.0.1:8000/api/invigilator/flag-broken-seat', {
        room_no: roomNo,
        table_id: tableNo
      });
    } catch (err) {
      console.log("Admin polling service notified locally via state loops.");
    }
  };

  // EXPORT PDF
  const exportIntegrityPDFReport = () => {
    const doc = new jsPDF();
    doc.text(`Invigilator Audit Report - Room ${roomNo}`, 14, 20);

    const rows = filteredRegistry.map((s) => [
      s.seat_no,
      s.name,
      s.roll_no,
      s.branch,
      s.attendance_status
    ]);

    doc.autoTable({
      startY: 30,
      head: [["Seat ID", "Name", "Roll No", "Branch", "Status Matrix"]],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [29, 78, 216] }
    });

    doc.save(`Audit_Report_Room_${roomNo}.pdf`);
  };

  useEffect(() => {
    fetchIntegrityMetrics();
  }, [roomNo]);

  // Dynamic filter pipeline: Isolate records belonging strictly to the selected verification module branch tab
  const filteredRegistry = registry.filter(
    (student) =>
      student.branch === selectedBranchTab &&
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fbff] via-[#eef4ff] to-[#dfe9ff] text-gray-800 p-6 font-sans">
      
      {/* HEADER NAVBAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-blue-200 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 uppercase tracking-widest text-xs font-bold mb-1">
            <Radio className="w-4 h-4 animate-pulse text-pink-500" /> Smart Monitoring Integrity Dashboard
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-indigo-600 bg-clip-text text-transparent">
            Invigilator Control Panel v4.5
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportIntegrityPDFReport}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 transition-all text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm"
          >
            <Download className="w-4 h-4" /> Export Report (PDF)
          </button>

          <div className="flex items-center gap-3 bg-white border border-blue-100 p-2 rounded-2xl shadow-md">
            <span className="text-xs font-bold text-gray-500 uppercase">Room:</span>
            <select
              value={roomNo}
              onChange={(e) => { setRoomNo(e.target.value); setScanStatus(null); }}
              className="bg-blue-50 text-blue-700 font-bold border border-blue-200 px-3 py-2 rounded-xl focus:outline-none"
            >
              {availableRoomsList.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
            <button onClick={fetchIntegrityMetrics} className="p-2 rounded-xl hover:bg-blue-100 transition">
              <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS TRACK */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
            <p className="text-sm text-gray-500 font-semibold uppercase">Total Allocated</p>
            <h2 className="text-5xl font-black text-blue-700 mt-3">{metrics.allocated_candidates}</h2>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-3xl p-6 shadow-lg">
            <p className="text-sm uppercase font-semibold">Verified Present</p>
            <h2 className="text-5xl font-black mt-3">{metrics.verified_count}</h2>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-rose-500 text-white rounded-3xl p-6 shadow-lg">
            <p className="text-sm uppercase font-semibold">Absent Matrix</p>
            <h2 className="text-5xl font-black mt-3">{metrics.absent_count}</h2>
          </div>
          <div className="bg-gradient-to-br from-amber-300 to-orange-400 text-white rounded-3xl p-6 shadow-lg">
            <p className="text-sm uppercase font-semibold">Compromised Slots</p>
            <h2 className="text-5xl font-black mt-3">{metrics.broken_chairs_count}</h2>
          </div>
        </div>
      )}

      {/* 🎨 INTERACTIVE DUAL CANDIDATE SEATING ENVIRONMENT LAYOUT GRID */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 mb-6">
        <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2 mb-5">
          <Grid className="w-5 h-5" /> Dual-Bench Physical Classroom Row Layout Twin Visualizer
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: Math.ceil(registry.length / 2) }, (_, index) => {
            const currentTableId = `T${index + 1}`;
            const dualCandidatesOnBench = registry.filter(s => s.table_no === currentTableId);
            const isWorkspaceDamaged = dualCandidatesOnBench.some(s => s.is_chair_broken);

            return (
              <div key={currentTableId} className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isWorkspaceDamaged ? 'bg-amber-50 border-amber-300 shadow-inner' : 'bg-slate-50/70 border-blue-100 shadow-sm'
              }`}>
                {/* Desk Shared Identification Header */}
                <div className="flex justify-between items-center border-b border-gray-200/60 pb-1.5 mb-2.5">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" /> Desk Node {currentTableId}
                  </span>
                  <button 
                    onClick={() => handleFlagBrokenChair(currentTableId)}
                    disabled={isWorkspaceDamaged}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-black transition-all ${
                      isWorkspaceDamaged ? 'bg-amber-200 text-amber-800' : 'bg-amber-400/10 hover:bg-amber-500 hover:text-black text-amber-600'
                    }`}
                  >
                    {isWorkspaceDamaged ? "Damaged" : "Flag"}
                  </button>
                </div>

                {/* Left and Right Seats Subgrid rendering both student frames */}
                <div className="space-y-1.5">
                  {dualCandidatesOnBench.map((student) => {
                    const isStudentPresent = student.attendance_status === "Present";
                    let stateColor = "border-red-200 bg-red-50 text-red-700";
                    if (isStudentPresent) stateColor = "border-emerald-200 bg-emerald-50 text-emerald-700";
                    if (student.is_chair_broken) stateColor = "border-amber-300 bg-amber-100 text-amber-800 animate-pulse";

                    return (
                      <div key={student.id} className={`p-2 rounded-xl border text-xs font-semibold ${stateColor}`}>
                        <div className="flex justify-between items-center opacity-70 mb-0.5">
                          <span className="font-mono font-bold text-[9px]">{student.seat_no.split("_")[1] === "L" ? "Left Slot" : "Right Slot"}</span>
                          <span className="font-mono font-black text-[9px] bg-white px-1.5 rounded shadow-sm text-indigo-600">{student.branch}</span>
                        </div>
                        <div className="font-bold truncate text-gray-900">{student.name}</div>
                        <div className="font-mono text-[9px] opacity-70 mt-0.5">{student.roll_no}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BRANCH IDENTIFICATION LOOKUP VERIFICATION PIPELINE BAR */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-100 mb-6 space-y-4">
        <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" /> Step 1: Query Candidate Declared Academic Branch Module
        </h3>
        <div className="flex flex-wrap gap-2">
          {institutionalBranches.map((branchCode) => (
            <button
              key={branchCode}
              onClick={() => { setSelectedBranchTab(branchCode); setScanStatus(null); }}
              className={`px-6 py-3 rounded-xl font-mono text-xs font-black tracking-widest transition-all ${
                selectedBranchTab === branchCode 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl scale-105' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {branchCode} REGISTRY LAYER
            </button>
          ))}
        </div>
      </div>

      {/* ATTENDANCE CHECKPOINT SCANNER FORM */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-100 mb-6">
        <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2 mb-4">
          <ScanLine className="w-5 h-5" /> Step 2: Validate Target Identity Token inside '{selectedBranchTab}' Space
        </h3>

        <form onSubmit={handleGateScanSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder={`Type Roll number to authenticate inside ${selectedBranchTab} network grid...`}
            className="flex-1 border border-blue-200 rounded-2xl px-4 py-3 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
          />
          <button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 transition-all text-white px-8 py-3 rounded-2xl font-bold shadow-lg uppercase text-xs tracking-wider">
            Commit Attendance Node
          </button>
        </form>

        {scanStatus && (
          <div className={`mt-4 p-4 rounded-2xl font-semibold flex items-center gap-2 text-xs uppercase ${
            scanStatus.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            <AlertTriangle className="w-5 h-5 shrink-0" /> {scanStatus.message}
          </div>
        )}
      </div>

      {/* ISOLATED CANDIDATE RECORD DATA TABLES */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-blue-100">
        <div className="p-5 flex flex-col sm:flex-row justify-between gap-4 border-b border-blue-100 items-center">
          <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Layers className="w-5 h-5" /> Module Registry Filter Grid: <span className="text-indigo-600">{selectedBranchTab} Canditates</span>
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name or Roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-blue-200 rounded-2xl bg-blue-50 pl-10 pr-4 py-2 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 text-left">Seat Coordinate</th>
                <th className="p-4 text-left">Student Identity</th>
                <th className="p-4 text-left">Branch Code</th>
                <th className="p-4 text-left">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRegistry.map((student) => (
                <tr key={student.id} className={`border-b hover:bg-blue-50/60 transition ${student.is_chair_broken ? 'bg-amber-50/40' : ''}`}>
                  <td className="p-4 font-mono font-black text-blue-700">{student.seat_no}</td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{student.roll_no}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-indigo-50 text-indigo-700 font-black px-2.5 py-1 rounded-md text-xs font-mono border border-indigo-100">
                      {student.branch}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                      student.attendance_status === "Present"
                        ? "bg-green-100 text-green-700"
                        : student.is_chair_broken
                        ? "bg-amber-200 text-amber-800"
                        : "bg-red-100 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${student.attendance_status === "Present" ? 'bg-green-500' : 'bg-red-500'}`} />
                      {student.is_chair_broken ? "Pending Admin Reroute" : student.attendance_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvigilatorDashboard;