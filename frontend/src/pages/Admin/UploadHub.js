import React, { useState } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, Lock, 
  Zap, Play, AlertCircle, RefreshCcw, ShieldCheck,
  Users, LayoutGrid, Settings2, Loader2, Clock
} from 'lucide-react';
import apiService from '../../services/api';

const UploadHub = () => {
  const [studentFile, setStudentFile] = useState(null);
  const [roomFile, setRoomFile] = useState(null);
  const [seatingMode, setSeatingMode] = useState('Double'); 
  const [status, setStatus] = useState('idle'); 

  const handleProcess = async () => {
    if (!studentFile || !roomFile) return;
    
    // START PROCESSING
    setStatus('processing');
    
    const formData = new FormData();
    formData.append('student_file', studentFile);
    formData.append('room_file', roomFile);
    formData.append('mode', seatingMode); 
    
    try {
      // Calling the stabilized backend
      const response = await apiService.uploadBulkData(formData);
      
      if (response.data.status === 'success') {
        setStatus('success');
        localStorage.setItem('systemStatus', 'LOCKED');
      } else {
        // If backend returns 200 but status isn't success
        setStatus('error');
      }
    } catch (err) {
      // FIX: Resetting status to 'error' stops the infinite spinner
      console.error("AI Engine Sync Failed. Detailed Error:", err.response?.data || err.message);
      setStatus('error');
      
      // Optional: Inform user about potential column name mismatch
      if (err.response?.status === 500) {
        alert("Server Error (500): Check if CSV headers match (rollno, nameid, etc.)");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER: SHIFT CONFIGURATION */}
      <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Optimization <span className="text-indigo-600">Hub</span>
            </h2>
            <p className="text-slate-500 mt-1 font-medium italic">9:30 AM & 2:00 PM Multi-Shift Logic [v3.5]</p>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            {['Single', 'Double'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSeatingMode(mode)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  seatingMode === mode 
                    ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {mode} per Bench
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* DATA INPUTS */}
        <div className="space-y-6">
          <UploadCard 
            label="Input 01: Student Registry"
            subLabel={studentFile ? studentFile.name : "Upload students.csv (rollno, nameid, year)"}
            icon={<FileText size={28} />}
            active={!!studentFile}
            inputId="stFile"
            onChange={(e) => setStudentFile(e.target.files[0])}
            color="indigo"
          />

          <UploadCard 
            label="Input 02: Building Infrastructure"
            subLabel={roomFile ? roomFile.name : "Upload room.csv (rows, cols, floor)"}
            icon={<LayoutGrid size={28} />}
            active={!!roomFile}
            inputId="rmFile"
            onChange={(e) => setRoomFile(e.target.files[0])}
            color="blue"
          />
        </div>

        {/* AI ENGINE CONTROL PANEL */}
        <div className="bg-white border border-slate-200 rounded-[3rem] p-12 flex flex-col justify-between shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          {status === 'success' && <ShieldCheck className="absolute top-[-20px] right-[-20px] text-emerald-500/10" size={150} />}
          
          <div className="space-y-10 relative z-10">
            <div className="flex items-center justify-between pb-8 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Clock size={18} className="text-indigo-500" />
                Shift Scheduling Matrix
              </h3>
              {status === 'processing' && <Loader2 size={18} className="text-indigo-600 animate-spin" />}
            </div>
            
            <div className="space-y-4">
               <IngestRow label="Primary Shift" value="09:30 AM (Morning)" ready={true} />
               <IngestRow label="Overflow Logic" value="02:00 PM (Afternoon)" ready={true} />
               <IngestRow label="Infrastructure Check" value={roomFile ? "Ready to Map" : "Awaiting CSV"} ready={!!roomFile} />
            </div>
          </div>

          <div className="mt-12 relative z-10">
            {status === 'success' ? (
              <div className="bg-emerald-500 p-6 rounded-[2rem] flex items-center justify-center gap-4 text-white shadow-xl shadow-emerald-100 animate-in zoom-in">
                 <Lock size={20} />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">RBU Plan Finalized & Locked</p>
              </div>
            ) : (
              <button 
                onClick={handleProcess}
                disabled={!studentFile || !roomFile || status === 'processing'}
                className={`w-full py-6 rounded-[2rem] font-black transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-[0.4em] 
                  ${(!studentFile || !roomFile) 
                    ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                    : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-2xl shadow-indigo-100 active:scale-95'
                  }`}
              >
                {status === 'error' ? (
                  <>RETRY ENGINE SYNC <AlertCircle size={20} /></>
                ) : status === 'processing' ? (
                  <>GENERATING SHIFTS... <Loader2 className="animate-spin" size={20} /></>
                ) : (
                  <>INITIATE AI SOLVER <Play size={20} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-Components
const UploadCard = ({ label, subLabel, icon, active, inputId, onChange, color }) => (
  <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 ${active ? 'bg-slate-50 border-indigo-200' : 'bg-white border-slate-200 border-dashed hover:border-indigo-300'}`}>
    <div className="flex items-center gap-8">
      <div className={`p-5 rounded-[1.5rem] ${active ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h4>
        <input type="file" id={inputId} className="hidden" accept=".csv" onChange={onChange} />
        <label htmlFor={inputId} className="text-sm text-slate-900 font-bold cursor-pointer hover:text-indigo-600 transition-colors block">
          {subLabel}
        </label>
      </div>
    </div>
  </div>
);

const IngestRow = ({ label, value, ready }) => (
  <div className="flex justify-between items-center bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
    <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-bold ${ready ? "text-slate-800" : "text-slate-300"}`}>{value}</span>
    </div>
    <div className={`w-2 h-2 rounded-full ${ready ? "bg-emerald-500 animate-pulse" : "bg-slate-200"}`} />
  </div>
);

export default UploadHub;