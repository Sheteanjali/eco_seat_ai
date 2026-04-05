import React, { useState } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, Lock, 
  Zap, Play, AlertCircle, RefreshCcw, ShieldCheck
} from 'lucide-react';
import apiService from '../../services/api';

const UploadHub = () => {
  const [studentFile, setStudentFile] = useState(null);
  const [roomFile, setRoomFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | processing | success | error

  const handleProcess = async () => {
    if (!studentFile || !roomFile) return;
    setStatus('processing');
    
    // 1. Data Ingest: Packaging variables for the CSP Solver
    const formData = new FormData();
    formData.append('student_file', studentFile);
    formData.append('room_file', roomFile);
    
    try {
      // 2. Constraint Processing: Triggering the Recursive Search backend
      const response = await apiService.uploadBulkData(formData);
      
      if (response.data.status === 'success') {
        setStatus('success');
        // Logic: System stabilization state locked for exam integrity
        localStorage.setItem('systemStatus', 'LOCKED');
      }
    } catch (err) {
      console.error("AI Engine Sync Failed:", err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER: NAGPUR DIVISION OPTIMIZATION HUB */}
      <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Optimization <span className="text-indigo-600">Hub</span></h2>
            <p className="text-slate-500 mt-1 font-medium italic">Configure and stabilize the 1,500 candidate seating grid.</p>
          </div>
          <div className="bg-slate-950 px-6 py-2.5 rounded-2xl border border-slate-800 shadow-xl shadow-slate-200">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Status: Secure_v2.1</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: DATA INGESTION (VARIABLE INPUTS) */}
        <div className="space-y-6">
          <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 ${studentFile ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-slate-200 border-dashed'}`}>
            <div className="flex items-center gap-8">
              <div className={`p-5 rounded-[1.5rem] ${studentFile ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-slate-100 text-slate-400'}`}>
                <FileText size={28} />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Variable 01: Student Registry</h4>
                <input type="file" id="stFile" className="hidden" accept=".csv" onChange={(e) => setStudentFile(e.target.files[0])} />
                <label htmlFor="stFile" className="text-sm text-slate-900 font-bold cursor-pointer hover:text-indigo-600 transition-colors block">
                  {studentFile ? studentFile.name : "Upload candidates_list.csv"}
                </label>
              </div>
            </div>
          </div>

          <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 ${roomFile ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-200 border-dashed'}`}>
            <div className="flex items-center gap-8">
              <div className={`p-5 rounded-[1.5rem] ${roomFile ? 'bg-blue-600 text-white shadow-2xl' : 'bg-slate-100 text-slate-400'}`}>
                <UploadCloud size={28} />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Variable 02: Classroom Grid</h4>
                <input type="file" id="rmFile" className="hidden" accept=".csv" onChange={(e) => setRoomFile(e.target.files[0])} />
                <label htmlFor="rmFile" className="text-sm text-slate-900 font-bold cursor-pointer hover:text-blue-600 transition-colors block">
                  {roomFile ? roomFile.name : "Upload room_layout.csv"}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: CSP ENGINE CONTROL (AI OPTIMIZATION) */}
        <div className="bg-white border border-slate-200 rounded-[3rem] p-12 flex flex-col justify-between shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          {status === 'success' && <ShieldCheck className="absolute top-[-20px] right-[-20px] text-emerald-50/50" size={150} />}
          
          <div className="space-y-10 relative z-10">
            <div className="flex items-center justify-between pb-8 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <CheckCircle2 size={18} className={status === 'success' ? 'text-emerald-500' : 'text-slate-200'} />
                Stabilization Engine
              </h3>
              {status === 'processing' && <RefreshCcw size={18} className="text-indigo-500 animate-spin" />}
            </div>
            
            <div className="space-y-5">
               <IngestRow label="Candidate Variables" ready={!!studentFile} />
               <IngestRow label="Resource Infrastructure" ready={!!roomFile} />
            </div>
          </div>

          <div className="mt-12 relative z-10">
            {status === 'success' ? (
              <div className="bg-emerald-500 p-6 rounded-[2rem] flex items-center justify-center gap-4 text-white shadow-xl shadow-emerald-100 animate-in zoom-in duration-500">
                 <Lock size={20} />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">Conflict-Free Plan Verified • Data Locked</p>
              </div>
            ) : (
              <button 
                onClick={handleProcess}
                disabled={!studentFile || !roomFile || status === 'processing'}
                className={`w-full py-6 rounded-[2rem] font-black transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-[0.4em]
                  ${(!studentFile || !roomFile) 
                    ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                    : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-2xl shadow-indigo-200 active:scale-95'}
                `}
              >
                {status === 'error' ? (
                  <>Retry Optimization <AlertCircle size={20} /></>
                ) : status === 'processing' ? (
                  "AI Backtracking..."
                ) : (
                  <>Initiate AI Solver <Play size={20} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Component for Row UI
const IngestRow = ({ label, ready }) => (
  <div className="flex justify-between items-center bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
    <span className="text-xs font-bold text-slate-500">{label}:</span>
    <span className={`text-[10px] font-black uppercase tracking-widest ${ready ? "text-emerald-600" : "text-slate-300"}`}>
      {ready ? "Variable Loaded" : "Waiting..."}
    </span>
  </div>
);

export default UploadHub;