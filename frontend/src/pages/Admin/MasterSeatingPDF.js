import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Zap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import apiService from '../../services/api';

const MasterSeatingPDF = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await apiService.getAllSeating();
        const masterList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setData(masterList);
      } catch (err) {
        console.error("Master Seating Fetch Failed");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Generating Final Manifest...</p>
    </div>
  );

  if (!data || data.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-10 text-center">
      <AlertCircle size={48} className="text-amber-500 mb-4" />
      <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">System Data Purged</h2>
      <p className="text-slate-500 text-sm mt-2 max-w-sm">No allocation detected. Ensure the <b>AI Solver</b> has been initiated from the Optimization Hub.</p>
      <button onClick={() => window.history.back()} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Return to Hub</button>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-serif text-slate-900">
      
      {/* PRINT ACTION BAR */}
      <div className="print:hidden p-6 bg-slate-50 border-b flex justify-between items-center fixed top-0 w-full z-50">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.length} Students Allocated</span>
            <button 
                onClick={() => window.print()}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-indigo-600 transition-all"
            >
                <Printer size={16} /> Print Master Manifest
            </button>
        </div>
      </div>

      <div className="p-12 pt-32 max-w-6xl mx-auto print:p-0 print:pt-4">
        
        {/* OFFICIAL RBU HEADER */}
        <div className="text-center mb-12 border-b-4 border-double border-slate-900 pb-8">
          <div className="flex justify-center mb-4">
            <Zap size={44} className="text-indigo-600 fill-indigo-600" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: '"Times New Roman", serif' }}>Ramdeobaba University, Nagpur</h1>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-[0.4em] mt-3">Final Examination Seating & Attendance Record • 2026</p>
        </div>

        {/* MASTER DATA TABLE */}
        <table className="w-full border-collapse border-2 border-slate-900">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-900 p-3 text-[9px] uppercase font-black">Room</th>
              <th className="border border-slate-900 p-3 text-[9px] uppercase font-black">Seat</th>
              <th className="border border-slate-900 p-3 text-[9px] uppercase font-black">Roll Number</th>
              <th className="border border-slate-900 p-3 text-[9px] uppercase font-black text-left">Candidate Name</th>
              <th className="border border-slate-900 p-3 text-[9px] uppercase font-black">Syllabus Group</th>
              <th className="border border-slate-900 p-3 text-[9px] uppercase font-black">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((student, index) => (
              <tr key={index} className="print:break-inside-avoid">
                <td className="border border-slate-400 p-2 text-center text-xs font-black bg-slate-50">{student.room_no}</td>
                <td className="border border-slate-400 p-2 text-center text-xs font-bold uppercase">{student.seat_no}</td>
                <td className="border border-slate-400 p-2 text-center text-xs font-black">{student.roll_no}</td>
                <td className="border border-slate-400 p-2 text-xs uppercase font-medium pl-4">{student.name}</td>
                <td className="border border-slate-400 p-2 text-center text-[10px] font-bold text-indigo-600">{student.paper_group_id}</td>
                <td className={`border border-slate-400 p-2 text-center text-[9px] font-black uppercase ${student.attendance_status === 'Present' ? 'text-emerald-600' : 'text-slate-300'}`}>
                    {student.attendance_status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SIGNATURE & AUTHENTICATION */}
        <div className="mt-16 flex justify-between items-end">
          <div className="text-center">
            <div className="w-40 h-[1px] bg-slate-400 mb-2"></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Invigilator Signature</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-900 tracking-widest italic">Secured by Eco-Seat AI Constraint Engine</p>
            <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                Node ID: RBU_DT_SOLVER_V2 • {new Date().toLocaleString()}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MasterSeatingPDF;