import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import DigitalTwinGrid from '../../components/DigitalTwinGrid';
import axios from 'axios';
import { 
  ShieldCheck, LogOut, Clock, Sparkles, AlertCircle, 
  BookOpen, Download, User, Calendar, MapPin, 
  Loader2 
} from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [seatData, setSeatData] = useState(null);
  const [roomLayout, setRoomLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const rollNo = localStorage.getItem('userRollNo');
  const userName = localStorage.getItem('userName');

  // Branch-to-Color Mapping for the "Social Shuffle" Logic
  const branchColorMap = {
    'CS': '#6366f1', // Indigo
    'ME': '#f59e0b', // Amber
    'CE': '#10b981', // Emerald
    'EE': '#ec4899', // Pink
    'ET': '#3b82f6', // Blue
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!rollNo) {
        navigate('/login');
        return;
      }
      try {
        const response = await apiService.getStudentSeat(rollNo);
        const studentData = response.data;
        setSeatData(studentData);

        if (studentData && studentData.room_no) {
          const layoutRes = await axios.get(`http://127.0.0.1:8000/api/admin/room-layout/${studentData.room_no}`);
          setRoomLayout(layoutRes.data);
        }
      } catch (error) {
        console.error("Critical Sync Error:", error);
        setSeatData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [rollNo, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-[3px] border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Bahnschrift' }}>Synchronizing Spatial Framework...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-12 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
              <ShieldCheck size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none" style={{ fontFamily: '"Times New Roman", serif' }}>
                Eco-Seat <span className="text-indigo-600">AI</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Candidate Control Panel</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-all font-bold text-[10px] uppercase tracking-widest bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: DIGITAL PASS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ATTENDANCE WARNING */}
            {seatData?.attendance_status === "Absent" && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
                <AlertCircle size={20} className="text-rose-500" />
                <div>
                  <p className="text-[10px] font-black text-rose-600 uppercase">Access Revoked</p>
                  <p className="text-xs font-bold text-rose-900">Marked ABSENT: Security threshold exceeded.</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 p-6 text-center">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]" style={{ fontFamily: '"Times New Roman", serif' }}>Official Entry Pass</h2>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1 italic">Authorized ID: {rollNo}</p>
              </div>

              {seatData ? (
                <div className="p-8">
                  <div className="flex flex-col items-center">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 shadow-inner">
                      <img src={seatData.qr_code} alt="QR" className="w-32 h-32 object-contain grayscale" />
                    </div>
                    
                    <div className="text-center space-y-2 mb-10">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Candidate Identity</p>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{seatData.name || userName}</h3>
                      <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-widest">
                        {seatData.branch} Department
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><MapPin size={10}/> Room</p>
                        <p className="text-lg font-black text-slate-900 uppercase italic">{seatData.room_no}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><User size={10}/> Seat ID</p>
                        <p className="text-lg font-black text-slate-900 uppercase italic">{seatData.seat_no}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-20 text-center text-slate-300 font-bold uppercase text-[10px]">Awaiting Allocation...</div>
              )}
            </div>
            
            <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
              <Download size={16} /> Export Verification Slip
            </button>
          </div>

          {/* RIGHT: SPATIAL INTEGRITY MAP */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-fit">
               <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", serif' }}>Room Social Shuffle</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Branch-Aware Spatial Distribution</p>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Your Seat</span>
                      <div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-sm"></div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Classmates ({seatData?.branch})</span>
                      <div className="w-3 h-3 border-2 border-emerald-500 rounded-sm"></div>
                    </div>
                  </div>
               </div>

               {/* THE INTELLIGENT GRID */}
               <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                  {roomLayout.map((s, i) => {
                    const isUser = s.roll_no === rollNo;
                    const isSameBranch = s.branch === seatData?.branch;
                    const branchColor = branchColorMap[s.branch] || '#cbd5e1';

                    return (
                      <div 
                        key={i}
                        title={`Seat ${s.seat} | ${s.branch}`}
                        className={`aspect-square rounded-xl flex items-center justify-center text-[8px] font-black transition-all cursor-default
                          ${isUser ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 ring-2 ring-white scale-110 z-10' : 
                            isSameBranch ? 'border-2 border-emerald-500 text-slate-900' : 
                            'text-white'}
                        `}
                        style={{ 
                          backgroundColor: (isUser || isSameBranch) ? '' : branchColor,
                          borderColor: isSameBranch ? '#10b981' : ''
                        }}
                      >
                        {isUser ? 'YOU' : s.seat.replace('R','').replace('C','-')}
                      </div>
                    );
                  })}
               </div>

               <div className="mt-10 py-6 border-t border-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Branch Shuffle Key</p>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {Object.entries(branchColorMap).map(([br, color]) => (
                      <div key={br} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
                        <span className="text-[9px] font-bold text-slate-600 uppercase">{br}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 relative overflow-hidden group">
               <Sparkles size={60} className="absolute -right-4 -top-4 text-indigo-200/50 group-hover:rotate-12 transition-transform duration-700" />
               <div className="flex items-center gap-2 mb-3">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Spatial Audit Notice</p>
               </div>
               <p className="text-[11px] text-indigo-900/60 font-semibold leading-relaxed">
                 The AI has implemented a checkerboard distribution strategy. Peers of the same branch are highlighted with <span className="text-emerald-600 font-bold underline">Green Outlines</span> to verify class-wide allocation integrity.
               </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const ScheduleRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
    <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{value}</span>
  </div>
);

export default StudentDashboard;