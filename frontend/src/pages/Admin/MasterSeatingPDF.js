import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import apiService from '../../services/api';

const MasterSeatingPDF = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await apiService.getAllSeating();
        
        // STABILIZATION: Checks if data is in res.data or res.data.data
        const masterList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        console.log("Nagpur Division Payload Received:", masterList.length, "candidates");
        setData(masterList);
      } catch (err) {
        console.error("CRITICAL: Master Seating Fetch Failed. Check apiService.js and Backend.");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // 1. Loading State (Professional Spinner)
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Generating Master Record...</p>
    </div>
  );

  // 2. Empty State (If "Initiate Engine" hasn't been clicked)
  if (!data || data.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-10 text-center">
      <AlertCircle size={48} className="text-amber-500 mb-4" />
      <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">No Allocation Data</h2>
      <p className="text-slate-500 text-sm mt-2 max-w-sm">
        The seating grid is currently empty. Please go to the <b>Upload Hub</b>, upload your CSVs, and click <b>"Initiate Engine"</b> first.
      </p>
      <button 
        onClick={() => window.history.back()} 
        className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
      >
        Return to Hub
      </button>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-serif text-slate-900">
      
      {/* Action Bar - Hidden during Print */}
      <div className="print:hidden p-6 bg-slate-50 border-b flex justify-between items-center fixed top-0 w-full z-50">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16} /> Exit Report
        </button>
        <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.length} Candidates Loaded</span>
            <button 
                onClick={() => window.print()}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
                <Printer size={16} /> Print / Save as PDF
            </button>
        </div>
      </div>

      {/* DOCUMENT START */}
      <div className="p-12 pt-32 max-w-6xl mx-auto print:p-0 print:pt-4">
        
        {/* Official Header */}
        <div className="text-center mb-12 border-b-4 border-double border-slate-900 pb-8">
          <div className="flex justify-center mb-4">
            <ShieldCheck size={44} className="text-slate-900" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Nagpur Smart City Seating Division</h1>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-[0.4em] mt-3">Official Examination Arrangement Plan • Spring 2026</p>
        </div>

        {/* The Data Table */}
        <table className="w-full border-collapse border-2 border-slate-900">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-900 p-3 text-[10px] uppercase font-black">Room No</th>
              <th className="border border-slate-900 p-3 text-[10px] uppercase font-black">Seat ID</th>
              <th className="border border-slate-900 p-3 text-[10px] uppercase font-black">Roll Number</th>
              <th className="border border-slate-900 p-3 text-[10px] uppercase font-black text-left">Candidate Name</th>
              <th className="border border-slate-900 p-3 text-[10px] uppercase font-black">Subject Code</th>
            </tr>
          </thead>
          <tbody>
            {data.map((student, index) => (
              <tr key={index} className="hover:bg-slate-50 print:hover:bg-transparent">
                <td className="border border-slate-400 p-2 text-center text-xs font-black bg-slate-50">{student.room_no}</td>
                <td className="border border-slate-400 p-2 text-center text-xs font-bold uppercase tracking-tighter">{student.seat_no}</td>
                <td className="border border-slate-400 p-2 text-center text-xs font-black text-indigo-700">{student.roll_no}</td>
                <td className="border border-slate-400 p-2 text-xs uppercase font-medium pl-4">{student.name}</td>
                <td className="border border-slate-400 p-2 text-center text-[10px] font-bold">{student.subject}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signature & Authentication Area */}
        <div className="mt-16 flex justify-between items-end">
          <div className="text-center">
            <div className="w-40 h-[1px] bg-slate-400 mb-2"></div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Division In-Charge Signature</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-900 tracking-widest italic">Generated by Eco-Seat AI Engine</p>
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                Timestamp: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MasterSeatingPDF;