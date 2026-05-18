import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, FileDown, Mail, 
  Users, Search, ShieldCheck, Printer 
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendanceReport = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/search-hub?query=');
      setStudents(res.data.results || []);
    } catch (err) {
      console.error("Audit Fetch Failed");
    } finally {
      setLoading(false);
    }
  };

  // 📊 Filter Logic
  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentList = filtered.filter(s => s.attendance_status === 'Present');
  const absentList = filtered.filter(s => s.attendance_status === 'Absent');

  // 📄 PDF Generation Logic
  const downloadAuditPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text("ECO-SEAT AI: OFFICIAL ATTENDANCE AUDIT", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Ramdeobaba University | Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Total Candidates: ${students.length} | Verified: ${presentList.length} | Missing: ${absentList.length}`, 14, 27);

    const rows = students.map(s => [
      s.roll_no,
      s.name,
      `${s.roll_no.toLowerCase()}@rbu.edu`, // Mock institutional mail
      s.room_no,
      s.seat_no,
      s.attendance_status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [["Roll No", "Full Name", "Institutional Email", "Hall", "Seat ID", "Status"]],
      body: rows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontSize: 10, halign: 'center' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        5: { fontStyle: 'bold', textColor: [20, 150, 80] } // Status Column styling
      }
    });

    doc.save(`Attendance_Report_RBU_${new Date().toLocaleDateString()}.pdf`);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600 mr-3" />
      <span className="font-black uppercase tracking-widest text-slate-400">Loading Audit Data...</span>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Attendance <span className="text-indigo-600">Audit Node</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Live Presence vs Absence Analytics</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Filter by Roll/Name..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={downloadAuditPDF}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
          >
            <Printer size={16}/> Export Full PDF
          </button>
        </div>
      </div>

      {/* SIDE-BY-SIDE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PRESENT LIST */}
        <div className="bg-white rounded-[3rem] border border-emerald-100 shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
            <h2 className="flex items-center gap-3 text-emerald-700 font-black uppercase tracking-widest text-sm">
              <CheckCircle2 size={20} /> Present Students ({presentList.length})
            </h2>
          </div>
          <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar">
            {presentList.map(s => (
              <StudentCard key={s.roll_no} student={s} status="present" />
            ))}
          </div>
        </div>

        {/* ABSENT LIST */}
        <div className="bg-white rounded-[3rem] border border-rose-100 shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-6 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
            <h2 className="flex items-center gap-3 text-rose-700 font-black uppercase tracking-widest text-sm">
              <XCircle size={20} /> Absent Candidates ({absentList.length})
            </h2>
          </div>
          <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar">
            {absentList.map(s => (
              <StudentCard key={s.roll_no} student={s} status="absent" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Reusable Small Card Component ---
const StudentCard = ({ student, status }) => {
  const isPresent = status === 'present';
  return (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-md flex justify-between items-center ${isPresent ? 'bg-emerald-50/30 border-emerald-50' : 'bg-rose-50/30 border-rose-50'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isPresent ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {student.seat_no}
        </div>
        <div>
          <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{student.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Mail size={10} className="text-slate-300" />
            <p className="text-[9px] text-slate-400 font-bold lowercase tracking-wider">
              {student.roll_no.toLowerCase()}@rbu.edu
            </p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[9px] font-black text-slate-400 uppercase">Room {student.room_no}</p>
        <div className={`mt-1 h-1.5 w-12 rounded-full ml-auto ${isPresent ? 'bg-emerald-400' : 'bg-rose-300'}`} />
      </div>
    </div>
  );
};

export default AttendanceReport;