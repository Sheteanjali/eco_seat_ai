import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, MapPin, Loader2, ShieldCheck, Search, Download, Percent, Layers, Clock, AlertCircle, Monitor } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import axios from 'axios';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('student');
  const [query, setQuery] = useState('');
  const [searchData, setSearchData] = useState({ results: [], summary: {}, total: 0 });

  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];
  
  // Mapping branches to specific colors for the Spatial Map
  const branchColorMap = {
    'CS': '#6366f1', // Indigo
    'ME': '#f59e0b', // Amber
    'CE': '#10b981', // Emerald
    'EE': '#ec4899', // Pink
    'ET': '#3b82f6', // Blue
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/analytics');
      setData(res.data);
    } catch (err) { 
      console.error("System Engine Sync Failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length > 0) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/admin/search-hub?filter_type=${filterType}&query=${val}`);
        setSearchData(res.data);
      } catch (err) { 
        console.error("Search protocol failed"); 
      }
    } else { 
      setSearchData({ results: [], summary: {}, total: 0 }); 
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Official Registry Report: ${filterType.toUpperCase()}`, 14, 22);
    autoTable(doc, {
      head: [["Roll No", "Name", "Branch", "Room", "Seat", "Shift", "Status"]],
      body: searchData.results.map(s => [s.roll_no, s.name, s.branch, s.room_no, s.seat_no, s.shift, s.attendance_status]),
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], font: 'times' }
    });
    doc.save(`Registry_${filterType}_${query || 'Master'}.pdf`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Synchronizing Infrastructure Data...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 px-6 bg-slate-50 min-h-screen pt-8 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1" style={{ fontFamily: '"Times New Roman", serif' }}>
            Operational Hub
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] ml-1">
            Infrastructure Monitoring & Spatial Intelligence
          </p>
        </div>
        <button 
          onClick={generatePDF} 
          disabled={searchData.total === 0} 
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Export Registry PDF
        </button>
      </div>

      {/* SEARCH HUB */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_15px_50px_rgba(0,0,0,0.03)] border border-slate-200/60">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-200">
            {['student', 'room', 'branch', 'subject', 'shift'].map((t) => (
              <button 
                key={t}
                onClick={() => { 
                  setFilterType(t); 
                  setSearchData({ results: [], summary: {}, total: 0 }); 
                  setQuery(''); 
                }}
                className={`px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-1 md:flex-none ${filterType === t ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              value={query}
              placeholder={`Verify ${filterType} records...`} 
              className="w-full py-5 pl-16 pr-8 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 focus:bg-white outline-none font-bold text-slate-700 transition-all text-sm placeholder:text-slate-300 placeholder:uppercase placeholder:tracking-widest"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- 🛰️ ROOM INTELLIGENCE: SPATIAL VISUALIZATION --- */}
      {filterType === 'room' && searchData.total > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
          <div className="flex items-center gap-4 px-2">
            <Monitor size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", serif' }}>
              Spatial Audit: Room <span className="text-indigo-600 underline decoration-indigo-100 italic">{query}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Legend & Stats */}
            <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-fit">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Branch Distribution Map</p>
              <div className="space-y-4 mb-8">
                {Object.entries(branchColorMap).map(([br, color]) => (
                  <div key={br} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-md shadow-sm" style={{ backgroundColor: color }}></div>
                      <span className="text-[11px] font-black text-slate-700 uppercase">{br} Department</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {searchData.results.filter(s => s.branch === br).length} Seats
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                 <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">AI Logic Status</p>
                 <p className="text-[11px] text-indigo-900/60 font-semibold leading-relaxed">Checkerboard pattern active. Peer-branch proximity is limited to {'>'} 2.5 meters.</p>
              </div>
            </div>

            {/* LIVE SPATIAL MAP */}
            <div className="lg:col-span-8 bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Monitor size={200} className="text-white" />
               </div>
               
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.5em]">Real-Time Infrastructure Grid</p>
                  </div>

                  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                    {searchData.results.map((student, i) => (
                      <div 
                        key={i} 
                        title={`${student.name} (${student.branch})`}
                        className="aspect-square rounded-xl flex items-center justify-center text-[9px] font-black transition-all hover:scale-125 hover:z-20 cursor-help ring-2 ring-white/5"
                        style={{ 
                          backgroundColor: branchColorMap[student.branch] || '#475569',
                          color: 'white',
                          boxShadow: `0 4px 15px -2px ${branchColorMap[student.branch]}55`
                        }}
                      >
                        {student.seat_no.replace('R','').replace('C','-')}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-12 py-4 border-2 border-dashed border-white/10 rounded-2xl text-center bg-white/5">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.7em]">Examiner Desk / Front Portal</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STANDARD RESULTS (Show if filter is NOT 'room') --- */}
      {filterType !== 'room' && searchData.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {searchData.results.map((s, idx) => (
            <div key={idx} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden">
              <div className={`h-2 w-full ${s.attendance_status === 'Present' ? 'bg-emerald-500' : s.attendance_status === 'Absent' ? 'bg-rose-500' : 'bg-amber-400'}`}></div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">Room {s.room_no}</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> {s.shift}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xl font-black text-slate-900 tracking-tighter italic">{s.seat_no}</p>
                     <p className={`text-[9px] font-black uppercase mt-1 tracking-widest ${s.attendance_status === 'Present' ? 'text-emerald-600' : 'text-rose-600'}`}>{s.attendance_status}</p>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-lg uppercase tracking-tight mb-1" style={{ fontFamily: '"Times New Roman", serif' }}>{s.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold mb-6 uppercase tracking-widest">{s.roll_no} • {s.branch}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MAIN DASHBOARD KPIS (Hidden during search) */}
      {!query && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-8 duration-1000">
          <StatCard icon={<Users />} label="Registered Pool" value={data?.totalStudents || 0} color="text-indigo-600" />
          <StatCard icon={<ShieldCheck />} label="Verified Entry" value={data?.presentCount || 0} color="text-emerald-600" />
          <StatCard icon={<AlertCircle />} label="Absentee Load" value={data?.absentCount || 0} color="text-rose-600" />
          <StatCard icon={<Percent />} label="Engine Load" value={`${data?.utilization || 0}%`} color="text-blue-600" />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 transition-all hover:scale-[1.02]">
    <div className={`p-5 bg-slate-50 rounded-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: '"Times New Roman", serif' }}>{value}</p>
    </div>
  </div>
);

const ChartCard = ({ title, icon, children }) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
      {React.cloneElement(icon, { size: 16, className: "text-indigo-600" })} {title}
    </h3>
    <div className="h-[320px] w-full">{children}</div>
  </div>
);

export default Analytics;