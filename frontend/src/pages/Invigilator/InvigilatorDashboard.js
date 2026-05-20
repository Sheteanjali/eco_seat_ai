import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Shield, CheckCircle, XCircle, Users, Layers, 
  Search, RefreshCw, Radio, FileText, Fingerprint,
  ScanLine, Hammer, AlertTriangle, Download
} from 'lucide-react';

const InvigilatorDashboard = () => {
  // 🧭 DROP-DOWN CONTROL MATRIX: Enabled room-switching state for seamless evaluation
  const [roomNo, setRoomNo] = useState("Ex-101"); 
  const [metrics, setMetrics] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);

  const fetchIntegrityMetrics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/invigilator/dashboard-stream/${roomNo}`);
      setMetrics(res.data.room_metrics);
      setRegistry(res.data.registry);
      pushLog(`Handshake secured. Stream initialized for structural grid: ${roomNo}.`);
    } catch (err) {
      pushLog(`System Fault: Failed to establish pipeline sync for node ${roomNo}.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const pushLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [`[${timestamp}] [${type.toUpperCase()}] ${text}`, ...prev.slice(0, 4)]);
  };

  // 🔍 1. INTERACTIVE ENTRANCE CHECKPOINT SCANNER
  const handleGateScanSubmit = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    setScanStatus(null);
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/invigilator/scan-gate/${roomNo}`, { roll_no: scanInput.trim() });
      setScanStatus({ success: true, message: res.data.message });
      pushLog(`Scan Verified: Candidate ${scanInput} registered present inside Room ${roomNo}.`, 'success');
      setScanInput("");
      fetchIntegrityMetrics(); 
    } catch (err) {
      setScanStatus({ success: false, message: err.response?.data?.detail || "Verification Refused." });
      pushLog(`Access Denied: Scan validation rejected for sequence '${scanInput}'.`, 'error');
    }
  };

  // ⚠️ 2. PRIVILEGE-ISOLATED CHAIR FAULT EVENT LOGGER
  const handleFlagBrokenChair = async (studentId, studentName) => {
    if (!window.confirm(`Flag Infrastructure Mismatch:\nAre you sure the seat assigned to ${studentName} is broken?\nThis locks candidate status parameters and pushes an emergency scheduling alert to the Admin Panel.`)) return;
    try {
      await axios.post(`http://127.0.0.1:8000/api/invigilator/flag-broken-seat`, {
        student_id: studentId,
        room_no: roomNo
      });
      pushLog(`CRITICAL INFRASTRUCTURE FAULT: Seat anomaly for ${studentName} dispatched to Admin Terminal.`, 'warn');
      alert(`Incident Tracked!\nStudent status shifted to "Pending Admin Reroute". Admin can now see this on their dashboard to relocate the student to an empty class.`);
      fetchIntegrityMetrics();
    } catch (err) {
      pushLog(`Fault Transmission Interrupted.`, 'error');
    }
  };

  // 📊 3. jsPDF AUTOMATED REVENUE REPORT COMPILER
  const exportIntegrityPDFReport = () => {
    if (!metrics) return;
    const doc = new jsPDF();
    doc.setFont("courier");
    doc.setFontSize(16);
    doc.text(`ECO-SEAT AI: INFRASTRUCTURE & ATTENDANCE AUDIT LEDGER`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Operational Target Node: Room ${roomNo} • Compiled On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 26);
    doc.text(`Institution Cluster: Ramdeobaba University Production Subsystem Node`, 14, 31);
    
    doc.text(`Total Allocated Capacities : ${metrics.allocated_candidates} Candidates`, 14, 42);
    doc.text(`Active Present Entries      : ${metrics.verified_count}`, 14, 47);
    doc.text(`Flagged Absent Structures   : ${metrics.absent_count}`, 14, 52);
    doc.text(`Reported Compromised Chairs : ${metrics.broken_chairs_count}`, 14, 57);

    const tableRows = filteredRegistry.map(s => [s.seat_no, s.name, s.roll_no, s.branch, `Set-${s.paper_group_id || 'A'}`, s.attendance_status]);
    doc.autoTable({
      startY: 65,
      head: [['Seat ID', 'Candidate Name', 'Identity Roll', 'Branch', 'Paper Code', 'MFA Access Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [11, 19, 43], font: 'courier', fontStyle: 'bold' },
      styles: { font: 'courier' }
    });

    doc.save(`Audit_Report_Room_${roomNo}.pdf`);
    pushLog(`Audit Trail PDF successfully compiled and downloaded for Room ${roomNo}.`, 'success');
  };

  useEffect(() => {
    fetchIntegrityMetrics();
  }, [roomNo]);

  const filteredRegistry = registry.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080B10] text-[#E2E8F0] p-6 font-sans selection:bg-[#00F2FE] selection:text-black">
      
      {/* 🚀 TOP HEADER NAV DECK */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-[#1A2333] pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00F2FE] uppercase tracking-widest text-xs font-bold mb-1">
            <Radio className="w-4 h-4 animate-pulse text-red-500" /> Live Integrity Node Terminal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#E2E8F0] to-[#4A5D78] bg-clip-text text-transparent">
            Invigilator Control Panel <span className="text-[#00F2FE]">v2.7</span>
          </h1>
        </div>

        {/* Action Controller Block Deck (With Active Room Selector Dropdown) */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          <button 
            onClick={exportIntegrityPDFReport}
            className="flex items-center gap-2 bg-[#111C35] hover:bg-[#1A2D54] border border-[#223A6E] text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#111C35]/50"
          >
            <Download className="w-4 h-4 text-[#00F2FE]" /> Export Audit Ledger (PDF)
          </button>

          {/* 🧭 SELECTOR: Allows switching across different exam halls dynamically during presentation */}
          <div className="flex items-center gap-3 bg-[#111827] border border-[#223047] p-1.5 rounded-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 pl-2">Assigned Block:</span>
            <select 
              value={roomNo} 
              onChange={(e) => {
                setRoomNo(e.target.value);
                setScanStatus(null);
              }}
              className="bg-[#0B132B] text-[#00F2FE] font-bold border border-[#1E293B] px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F2FE]"
            >
              <option value="Ex-101">Room Ex-101 (Floor 1)</option>
              <option value="Ex-102">Room Ex-102 (Floor 1)</option>
              <option value="Ex-201">Room Ex-201 (Floor 2)</option>
            </select>
            <button onClick={fetchIntegrityMetrics} className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-gray-400">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00F2FE]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 🛠️ MIDDLE GRID DECK: SCANNER & TELEMETRY CARDS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        
        {/* OUT-OF-BAND ENTRANCE GATEWAY SCANNER WIDGET */}
        <div className="xl:col-span-4 bg-[#0B1222] border border-[#1F355E] p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#00F2FE] flex items-center gap-2 mb-2">
              <ScanLine className="w-4 h-4 text-red-400 animate-pulse" /> Checkpoint Intake Scanner Box
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Camera pipeline simulation interface. Type student roll number below at the entry gate of **Room {roomNo}** to record authorization presence.
            </p>
            
            <form onSubmit={handleGateScanSubmit} className="space-y-3">
              <input 
                type="text"
                placeholder="INPUT ROLL SEQUENCE..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full bg-[#050914] border border-[#1E293B] font-mono tracking-widest text-center text-white font-black rounded-xl py-3 text-sm focus:outline-none focus:border-[#00F2FE] transition-colors"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#00F2FE] hover:bg-[#00D4DE] text-black font-black uppercase text-xs tracking-wider transition-transform active:scale-[0.98]">
                Commit Gate Verification
              </button>
            </form>
          </div>

          {scanStatus && (
            <div className={`mt-4 p-3 rounded-xl border text-xs font-bold uppercase tracking-tight flex items-center gap-2 global-toast ${
              scanStatus.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-red-950/40 border-red-900 text-red-400'
            }`}>
              <AlertTriangle className="w-4.5 h-4.5 shrink-0" /> {scanStatus.message}
            </div>
          )}
        </div>

        {/* METRICS DISPATCH PANELS TRACKERS */}
        {metrics && (
          <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0F1626] border border-[#1E293B] p-5 rounded-2xl flex flex-col justify-between hover:border-[#00F2FE]/40 transition-all">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Total Allocated</p>
              <h3 className="text-4xl font-black text-white mt-2">{metrics.allocated_candidates}</h3>
              <div className="text-[10px] text-slate-500 mt-2 font-semibold">Total capacity: <span className="text-white">{metrics.total_seats} slots</span></div>
            </div>

            <div className="bg-[#0F1626] border border-[#1E293B] p-5 rounded-2xl flex flex-col justify-between border-l-4 border-l-emerald-500 hover:border-emerald-500/40 transition-all">
              <p className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Present Matrix</p>
              <h3 className="text-4xl font-black text-emerald-400 mt-2">{metrics.verified_count}</h3>
              <div className="text-[10px] text-slate-500 mt-2 font-semibold">Verified presence loops.</div>
            </div>

            <div className="bg-[#0F1626] border border-[#1E293B] p-5 rounded-2xl flex flex-col justify-between border-l-4 border-l-red-500 hover:border-red-500/40 transition-all">
              <p className="text-xs uppercase tracking-wider text-red-400 font-bold">Flagged Missing</p>
              <h3 className="text-4xl font-black text-red-400 mt-2">{metrics.absent_count}</h3>
              <div className="text-[10px] text-slate-500 mt-2 font-semibold">Awaiting scan entry logs.</div>
            </div>

            <div className="bg-[#0F1626] border border-[#1E293B] p-5 rounded-2xl flex flex-col justify-between border-l-4 border-l-amber-500 hover:border-amber-500/40 transition-all">
              <p className="text-xs uppercase tracking-wider text-amber-500 font-bold">Broken Chairs</p>
              <h3 className="text-4xl font-black text-amber-500 mt-2">{metrics.broken_chairs_count}</h3>
              <div className="text-[10px] text-slate-500 mt-2 font-semibold">Pending Admin actions.</div>
            </div>
          </div>
        )}
      </div>

      {/* 📡 ENGINE LIVE SECURITY INTERACTIVE AUDIT LOGGER TUNNEL */}
      <div className="bg-[#090F1C] border border-[#1F2E4D] rounded-2xl p-4 mb-6 font-mono text-xs text-[#38BDF8]">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider mb-2 text-gray-400 text-[10px]">
          <Fingerprint className="w-3.5 h-3.5 text-[#00F2FE]" /> Live Execution Micro-Logs Subsystem Trace
        </div>
        <div className="flex flex-col gap-1 h-20 overflow-y-auto">
          {terminalLogs.length === 0 ? (
            <span className="text-gray-600">Executing background loop diagnostics... Pipeline clear.</span>
          ) : (
            terminalLogs.map((log, index) => <div key={index} className="truncate text-glow">{log}</div>)
          )}
        </div>
      </div>

      {/* 📋 CANDIDATES CONTROLLER LIST MATRIX TABLE */}
      <div className="bg-[#0F1626] border border-[#1E293B] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1E293B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00F2FE]" /> Active Room Student Seat Allocation Grids
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search Roll, Name, or Branch Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0B1220] text-sm text-white placeholder-gray-500 pl-9 pr-4 py-2 w-full rounded-xl border border-[#22314D] focus:outline-none focus:border-[#00F2FE]"
            />
          </div>
        </div>

        {/* STRUCTURAL LAYOUT INTEGRITY ROWS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#131C31] text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-[#1E293B]">
                <th className="p-4">Seat Location</th>
                <th className="p-4">Candidate Identity</th>
                <th className="p-4">Academic Branch</th>
                <th className="p-4">Question paper set</th>
                <th className="p-4">MFA Access Status</th>
                <th className="p-4 text-center">Structural Disasters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18233C]">
              {filteredRegistry.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 font-semibold">
                    No active student allocations captured for selected room cluster node.
                  </td>
                </tr>
              ) : (
                filteredRegistry.map((student) => (
                  <tr key={student.id} className={`transition-colors group ${
                    student.is_chair_broken ? 'bg-amber-950/20 hover:bg-amber-950/30 border-l-2 border-l-amber-500' : 'hover:bg-[#121B30]'
                  }`}>
                    <td className="p-4 font-mono font-black text-white text-sm group-hover:text-[#00F2FE] transition-colors">
                      {student.seat_no || "N/A"}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[#E2E8F0]">{student.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{student.roll_no}</div>
                      {student.incident_logs && (
                        <div className="text-[10px] text-amber-400 mt-1 max-w-xs font-mono truncate">{student.incident_logs}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="bg-[#111F38] border border-[#233554] text-gray-300 text-xs px-2.5 py-1 rounded-md uppercase font-mono">
                        {student.branch}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 bg-purple-950/30 border border-purple-900/50 w-fit px-2.5 py-1 rounded-md">
                        <FileText className="w-3.5 h-3.5" /> Paper: {student.paper_group_id || "A"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                        student.attendance_status === "Present" || student.attendance_status === "Present (Admin Swapped)"
                          ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                          : student.attendance_status === "Pending Admin Reroute"
                          ? "bg-amber-950/40 border-amber-800 text-amber-400"
                          : "bg-red-950/40 border-red-900 text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          student.attendance_status === "Present" || student.attendance_status === "Present (Admin Swapped)" 
                            ? "bg-emerald-400 animate-pulse" 
                            : student.attendance_status === "Pending Admin Reroute"
                            ? "bg-amber-400 animate-bounce"
                            : "bg-red-400"
                        }`} />
                        {student.attendance_status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        disabled={student.is_chair_broken}
                        onClick={() => handleFlagBrokenChair(student.id, student.name)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-xl border transition-all uppercase ${
                          student.is_chair_broken 
                            ? "border-gray-800 text-gray-600 bg-transparent cursor-not-allowed" 
                            : "border-amber-950 text-amber-500 hover:bg-amber-500 hover:text-black shadow-md"
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" /> Flag Broken
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvigilatorDashboard;