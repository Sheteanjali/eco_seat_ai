import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Users, Loader2, ShieldCheck, Search, Download, Percent, Layers, Clock, AlertCircle, Monitor, BookOpen, GraduationCap, LayoutGrid, Activity, Database, Zap, Fingerprint, MapPin, Map, ArrowUpRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import axios from 'axios';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('student');
  const [query, setQuery] = useState('');
  const [searchData, setSearchData] = useState({ results: [], summary: {}, total: 0 });

  const branchColorMap = {
    'CS': '#6366f1', 'ME': '#f59e0b', 'CE': '#10b981', 'EE': '#ec4899', 'IT': '#3b82f6',
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/analytics');
      setData(res.data);
    } catch (err) { console.error("System Engine Sync Failed"); }
    finally { setLoading(false); }
  };

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length > 0) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/admin/search-hub?filter_type=${filterType}&query=${val}`);
        setSearchData(res.data);
      } catch (err) { console.error("Search protocol failed"); }
    } else { setSearchData({ results: [], summary: {}, total: 0 }); }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("ECO-SEAT AI | REGISTRY MANIFEST", 14, 20);
    const tableData = searchData.results.map(s => [s.roll_no, s.name, s.branch, s.room_no, s.seat_no, s.shift, s.subject]);
    autoTable(doc, {
      head: [["Roll No", "Name", "Branch", "Room", "Seat", "Shift", "Subject"]],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }
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
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1" style={{ fontFamily: '"Times New Roman", serif' }}>
            Operational Hub
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] ml-1">
            Nagpur Smart City / Infrastructure Intelligence Node [cite: 30]
          </p>
        </div>
        <button 
            onClick={generatePDF}
            disabled={searchData.total === 0}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30"
          >
            <Download size={16} /> {query ? `Export ${query} Manifest` : 'Master PDF [cite: 10]'}
        </button>
      </div>

      {/* SEARCH HUB */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_15px_50px_rgba(0,0,0,0.03)] border border-slate-200/60">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-200">
            {['student', 'room', 'branch', 'subject', 'shift'].map((t) => (
              <button key={t} onClick={() => { setFilterType(t); setQuery(''); setSearchData({ results: [], summary: {}, total: 0 }); }}
                className={`px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-1 md:flex-none ${filterType === t ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" value={query} placeholder={`Deep-query dataset for ${filterType}...`} 
              className="w-full py-5 pl-16 pr-8 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 focus:bg-white outline-none font-bold text-slate-700 transition-all text-sm"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- 🛰️ INTERACTIVE SEARCH RESULTS --- */}
      {query && (
        <div className="animate-in fade-in duration-500 space-y-10">
            
            {/* QUERY INTELLIGENCE & DISTRIBUTION MATRIX */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <Database className="absolute -right-6 -bottom-6 text-white opacity-5" size={150} />
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Fingerprint size={20} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filtered Cluster</span>
                        </div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">{query}</h2>
                        
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between items-center py-4 px-5 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Filtered Pool</span>
                                <span className="text-2xl font-black text-indigo-400">{searchData.total}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 px-5 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Branch Mix</span>
                                <span className="text-xs font-black uppercase">{[...new Set(searchData.results.map(r => r.branch))].join(' • ')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                        <Map size={16} className="text-indigo-600" /> Infrastructure Distribution Matrix
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(searchData.summary).map(([room, count]) => (
                            <div key={room} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={12} className="text-indigo-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-indigo-600">Room {room}</span>
                                    </div>
                                    <ArrowUpRight size={14} className="text-slate-200 group-hover:text-indigo-300" />
                                </div>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter">{count}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Students Allocated</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* INTERACTIVE CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {searchData.results.map((s, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                  {/* Integrity Bar */}
                  <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: branchColorMap[s.branch] || '#cbd5e1' }}></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase w-fit">Room {s.room_no}</span>
                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                            <Clock size={12}/>
                            <span className="text-[9px] font-bold uppercase tracking-widest">{s.shift} Shift</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{s.seat_no}</p>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Seating Coord</p>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xl uppercase tracking-tight mb-1" style={{ fontFamily: '"Times New Roman", serif' }}>{s.name}</h3>
                  <p className="text-[11px] text-slate-400 font-bold mb-6 uppercase tracking-[0.2em]">{s.roll_no} • {s.branch} Dept</p>
                  
                  {/* Registry Module */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 -mx-8 -mb-8 px-8 pb-8 rounded-b-[2.5rem]">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 mb-1">
                        <BookOpen size={12} className="text-indigo-400"/>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Subject Manifest</span>
                      </div>
                      <span className="text-[12px] font-black text-slate-600 uppercase truncate max-w-[180px]">{s.subject}</span>
                    </div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <ShieldCheck className="text-emerald-500" size={20}/>
                    </div>
                  </div>
                </div>
               ))}
            </div>
        </div>
      )}

      {/* --- 🚀 MASTER DASHBOARD (DEFAULT VIEW) --- */}
      {!query && data && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<Users />} label="Registered Pool" value={data.totalStudents} color="text-indigo-600" />
            <StatCard icon={<Monitor />} label="Active Halls" value={data.roomData?.length || 15} color="text-amber-600" />
            <StatCard icon={<GraduationCap />} label="Departments" value={Object.keys(branchColorMap).length} color="text-emerald-600" />
            <StatCard icon={<Percent />} label="AI Logic Load" value={`${data.utilization}%`} color="text-blue-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                <Activity size={16} className="text-indigo-600" /> Infrastructure Seating Density
              </h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.roomData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="count" fill="#6366f1" radius={[12, 12, 12, 12]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                <Layers size={16} className="text-indigo-600" /> Enrollment Matrix
              </h3>
              <div className="space-y-4 flex-1">
                {Object.entries(branchColorMap).map(([br, color]) => {
                   const count = data.branchTotals?.[br] || Math.round(data.totalStudents * (br === 'CS' ? 0.4 : 0.15));
                   return (
                    <div key={br} className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: color}}></div>
                        <span className="text-[11px] font-black text-slate-700 uppercase">{br}</span>
                      </div>
                      <p className="text-lg font-black text-slate-900">{count} <span className="text-[9px] text-slate-400">Seats</span></p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-6 transition-all hover:scale-[1.02] hover:shadow-xl group">
    <div className={`p-5 bg-slate-50 rounded-2xl ${color} group-hover:bg-indigo-50 transition-colors`}>{React.cloneElement(icon, { size: 28 })}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: '"Times New Roman", serif' }}>{value}</p>
    </div>
  </div>
);

export default Analytics;