import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import axios from 'axios';
import { 
  ShieldCheck, LogOut, Clock, Sparkles, AlertCircle, 
  BookOpen, Download, User, MapPin, 
  CheckCircle2, Fingerprint, Zap
} from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [seatData, setSeatData] = useState(null);
  const [roomLayout, setRoomLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const rollNo = localStorage.getItem('userRollNo');

  // RBU Branch-to-Color Logic
  const branchColorMap = {
    'CS': '#6366f1', 'IT': '#3b82f6', 'ME': '#f59e0b', 
    'CE': '#10b981', 'EE': '#ec4899', 'EC': '#8b5cf6'
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!rollNo) { navigate('/login'); return; }
      try {
        const response = await apiService.getStudentSeat(rollNo);
        setSeatData(response.data);

        if (response.data?.allocation?.room_no) {
          const layoutRes = await axios.get(`http://127.0.0.1:8000/api/admin/room-layout/${response.data.allocation.room_no}`);
          setRoomLayout(layoutRes.data);
        }
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
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

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-[3px] border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Verifying Neural Seat Mapping...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP NAVIGATION / BRANDING */}
        <header className="flex justify-between items-center mb-12 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
              <Zap size={24} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic" style={{ fontFamily: '"Times New Roman", serif' }}>
                Eco-Seat <span className="text-indigo-600">AI</span>
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">RBU Candidate Node</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest bg-white px-5 py-2.5 rounded-xl border border-slate-200 transition-all">
            <LogOut size={14} /> End Session
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* DIGITAL ENTRY PASS SECTION */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* LIVE ATTENDANCE FEEDBACK */}
            <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-all duration-500 ${
                seatData?.live_status?.attendance === 'Present' 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-amber-50 border-amber-200 animate-pulse'
            }`}>
              {seatData?.live_status?.attendance === 'Present' ? (
                  <CheckCircle2 size={24} className="text-emerald-500" />
              ) : (
                  <Clock size={24} className="text-amber-500" />
              )}
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${seatData?.live_status?.attendance === 'Present' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    Verification Status
                </p>
                <p className="text-sm font-bold text-slate-900">
                    {seatData?.live_status?.attendance === 'Present' ? `Entry Verified at ${new Date(seatData.live_status.entry_time).toLocaleTimeString()}` : 'Awaiting Admin QR Scan at Door'}
                </p>
              </div>
            </div>

            {/* THE PASS */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden relative">
              <div className="bg-slate-900 p-6 text-center">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]" style={{ fontFamily: '"Times New Roman", serif' }}>Digital Hall Ticket</h2>
              </div>

              {seatData ? (
                <div className="p-8">
                  <div className="flex flex-col items-center">
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-8 shadow-inner">
                      <img src={seatData.allocation.qr_code} alt="QR" className="w-40 h-40 object-contain" />
                    </div>
                    
                    <div className="text-center space-y-2 mb-8">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{seatData.personal_info.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{rollNo} • {seatData.personal_info.branch} Dept</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mb-6">
                      <DataBox label="Assigned Room" value={seatData.allocation.room_no} icon={<MapPin size={12}/>} />
                      <DataBox label="Seat ID" value={seatData.allocation.seat_no} icon={<User size={12}/>} />
                    </div>

                    <div className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Syllabus Group</span>
                            <span className="text-xs font-bold text-indigo-600">{seatData.exam_details.paper_group_id}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200"></div>
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Session</span>
                            <span className="text-xs font-bold text-slate-900">{seatData.exam_details.shift}</span>
                        </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-20 text-center text-slate-300 font-bold uppercase text-[10px]">Registry Sync Pending...</div>
              )}
            </div>

            <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
              <Download size={16} /> Download Verification PDF
            </button>
          </div>

          {/* SPATIAL ANALYTICS SECTION */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", serif' }}>Room Social Blueprint</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Syllabus-Aware Spatial Distribution</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <LegendItem color="bg-emerald-500" label="Your Position" />
                    <LegendItem color="border-2 border-indigo-400" label="Same Syllabus" />
                  </div>
                </div>

                <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                  {roomLayout.map((s, i) => {
                    const isUser = s.roll_no === rollNo;
                    const isSyllabusMatch = s.paper_group_id === seatData?.exam_details?.paper_group_id;
                    const branchColor = branchColorMap[s.branch] || '#cbd5e1';

                    return (
                      <div 
                        key={i}
                        className={`aspect-square rounded-xl flex items-center justify-center text-[7px] font-black transition-all duration-500
                          ${isUser ? 'bg-indigo-600 text-white shadow-xl scale-110 z-10' : 
                            isSyllabusMatch ? 'border-2 border-indigo-400 text-slate-900' : 'text-white/40'}
                        `}
                        style={{ backgroundColor: (isUser || isSyllabusMatch) ? '' : branchColor }}
                      >
                        {isUser ? 'YOU' : s.seat_no.replace('R','').replace('C','-')}
                      </div>
                    );
                  })}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-start gap-6 relative overflow-hidden">
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                    <Fingerprint size={24} />
                </div>
                <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zero-Collusion Logic Verified</h5>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        The AI Solver has mapped your seat based on your <span className="text-indigo-600 font-bold">Paper Group ({seatData?.exam_details?.paper_group_id})</span>. 
                        No candidate with the same syllabus is seated in your immediate orthogonal or diagonal vicinity.
                    </p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const DataBox = ({ label, value, icon }) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">{icon} {label}</p>
        <p className="text-lg font-black text-slate-900 uppercase italic">{value}</p>
    </div>
);

const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-2">
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className={`w-3 h-3 rounded-sm ${color}`}></div>
    </div>
);

export default StudentDashboard;