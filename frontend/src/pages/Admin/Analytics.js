import React, { useState, useEffect } from 'react';
import { 
  Users, Loader2, ShieldCheck, Search, Zap, Sun, Moon, 
  AlertCircle, LayoutDashboard, MapPin, Hammer, CheckCircle2, 
  BookOpen, DownloadCloud, FileText, Lock
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DigitalTwinGrid from '../../components/DigitalTwinGrid';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('subject');
  const [selectedShift, setSelectedShift] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [query, setQuery] = useState('');
  const [searchData, setSearchData] = useState({ results: [], summary: {}, total: 0 });

  const [reportRoom, setReportRoom] = useState('');
  const [reportSeat, setReportSeat] = useState('');
  const [infraStatus, setInfraStatus] = useState('idle');

  const branchColorMap = {
    'CS': '#6366f1', 'ME': '#f59e0b', 'CE': '#10b981', 'EE': '#ec4899', 'IT': '#3b82f6', 'EC': '#8b5cf6'
  };

  // ✅ 1. Safe Sync: Auto-refresh with fetch check
  useEffect(() => { 
    fetchAnalytics();
    handleSearch('', 'All', 'All', 'subject');
    
    const interval = setInterval(() => {
        if (!query) fetchAnalytics(); // Only auto-sync if user isn't searching
    }, 15000); 
    return () => clearInterval(interval);
  }, [query]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/analytics');
      if (res.data) setData(res.data);
    } catch (err) { console.error("Sync Failed"); }
    finally { setLoading(false); }
  };

  const handleSearch = async (val, shift = selectedShift, year = selectedYear, type = filterType) => {
    setQuery(val);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/admin/search-hub`, {
        params: { filter_type: type, query: val, shift: shift, year: year }
      });
      // ✅ 2. Payload Protection: Fallback to prevent undefined crashes
      setSearchData({
        results: res.data?.results || [],
        summary: res.data?.summary || {},
        total: res.data?.total || 0
      });
    } catch (err) { console.error("Search failed"); }
  };

  // --- PDF EXPORT ENGINE (RETAINED ALL MODES) ---
  const downloadRegistry = (mode) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    let exportData = [];
    let title = "";

    if (mode === 'morning') {
        exportData = searchData.results.filter(s => s.shift === 'Morning');
        title = "OFFICIAL REGISTRY: MORNING SHIFT (09:30 AM)";
    } else if (mode === 'afternoon') {
        exportData = searchData.results.filter(s => s.shift === 'Afternoon');
        title = "OFFICIAL REGISTRY: AFTERNOON SHIFT (02:00 PM)";
    } else if (mode === 'filtered') {
        exportData = searchData.results;
        title = `FILTERED REGISTRY: ${query.toUpperCase() || 'SEARCH SELECTION'}`;
    } else {
        exportData = searchData.results;
        title = "OVERALL MASTER SEATING REGISTRY";
    }

    if (!exportData || exportData.length === 0) {
        alert("No students found for this selection.");
        return;
    }

    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text("ECO-SEAT AI - RAMDEOBABA UNIVERSITY", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(title, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleString()} | Nodes: ${exportData.length}`, 14, 27);

    const tableColumn = ["Roll No", "Name", "Branch", "Year", "Subject", "Hall", "Seat", "Shift"];
    const tableRows = exportData.map(s => [
      s.roll_no, s.name, s.branch, s.year, s.subject, `Room ${s.room_no}`, s.seat_no, s.shift
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    doc.save(`RBU_Registry_${mode}.pdf`);
  };

  const handleMarkBroken = async () => {
    if (!reportRoom || !reportSeat) return;
    setInfraStatus('loading');
    try {
      await axios.patch('http://127.0.0.1:8000/api/admin/room/update-infrastructure', {
        room_no: reportRoom, table_id: reportSeat, is_broken: true
      });
      setInfraStatus('success');
      fetchAnalytics(); 
      setTimeout(() => setInfraStatus('idle'), 3000);
      setReportSeat('');
    } catch (err) { setInfraStatus('idle'); }
  };

  const getBranchStatsForRoom = (roomName) => {
    if (!searchData.results) return [];
    const roomNum = String(roomName).replace('Room ', '').trim();
    const studentsInRoom = searchData.results.filter(s => String(s.room_no) === roomNum);
    const counts = {};
    studentsInRoom.forEach(s => { counts[s.branch] = (counts[s.branch] || 0) + 1; });
    return Object.entries(counts);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">RBU Neural Syncing...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 px-6 bg-slate-50 min-h-screen pt-8 animate-in fade-in duration-700">
      
      {/* 🛡️ SECURITY STATUS HEADER */}
      <div className="bg-slate-900 p-4 rounded-2xl flex justify-between items-center text-white/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <Lock size={14} className="text-emerald-400" />
          <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Cryptographic Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 italic">Live Feed Connected</span>
        </div>
      </div>

      {/* EXPORT COMMAND CENTER (RETAINED) */}
      <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl shadow-indigo-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Export Control</h2>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest opacity-80 italic">Global Shift & Master PDF Engine</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => downloadRegistry('morning')} className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl text-white flex items-center gap-3 hover:bg-white/30 transition-all border border-white/10 group">
            <Sun size={16} /> <span className="text-[9px] font-black uppercase">Morning PDF</span>
          </button>
          <button onClick={() => downloadRegistry('afternoon')} className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl text-white flex items-center gap-3 hover:bg-white/30 transition-all border border-white/10 group">
            <Moon size={16} /> <span className="text-[9px] font-black uppercase">Afternoon PDF</span>
          </button>
          <button onClick={() => downloadRegistry('overall')} className="bg-slate-900 px-6 py-4 rounded-2xl text-white flex items-center gap-3 hover:scale-95 transition-all shadow-xl">
            <DownloadCloud size={16} /> <span className="text-[9px] font-black uppercase tracking-widest">Master Overall</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STATS SECTION */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><LayoutDashboard size={24}/></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Command Dashboard</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Live Seating Intelligence</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickStat label="Total Seated" value={data?.totalStudents || 0} icon={<Users size={16}/>} color="bg-slate-900" />
              <QuickStat label="Present ✅" value={data?.presentCount || 0} icon={<ShieldCheck size={16}/>} color="bg-emerald-500" />
              <QuickStat label="Active Halls" value={data?.roomData?.length || 0} icon={<MapPin size={16}/>} color="bg-indigo-500" />
              <QuickStat label="Utilization" value={`${data?.utilization || 0}%`} icon={<Zap size={16}/>} color="bg-indigo-600" />
          </div>
        </div>

        {/* INFRA NODE (RETAINED) */}
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <AlertCircle size={18} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Infra Control</span>
                </div>
                <h3 className="text-xl font-black uppercase mb-4 tracking-tighter italic">Mark Broken Seat</h3>
                <div className="space-y-3">
                    <input type="text" placeholder="Room No" value={reportRoom} onChange={(e) => setReportRoom(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-xs outline-none focus:bg-white/20 transition-all" />
                    <input type="text" placeholder="Table ID" value={reportSeat} onChange={(e) => setReportSeat(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-xs outline-none focus:bg-white/20 transition-all" />
                    <button onClick={handleMarkBroken} disabled={infraStatus === 'loading'} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${infraStatus === 'success' ? 'bg-emerald-500' : 'bg-amber-500 text-slate-900 hover:scale-95'}`}>
                        {infraStatus === 'loading' ? <Loader2 className="animate-spin" size={14}/> : infraStatus === 'success' ? <><CheckCircle2 size={14}/> Marked</> : <><Hammer size={14}/> Update Twin</>}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* SEARCH HUB (RETAINED) */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-wrap gap-8 items-center border-b border-slate-100 pb-6 justify-between">
            <div className="flex gap-8">
                <FilterGroup label="Shift" current={selectedShift} options={['All', 'Morning', 'Afternoon']} onChange={(v) => { setSelectedShift(v); handleSearch(query, v, selectedYear); }} />
                <FilterGroup label="Year" current={selectedYear} options={['All', '1', '2', '3', '4']} onChange={(v) => { setSelectedYear(v); handleSearch(query, selectedShift, v); }} />
            </div>
            <button onClick={() => downloadRegistry('filtered')} className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl active:scale-95">
              <FileText size={18}/> Export selection ({searchData.results.length})
            </button>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {['subject', 'student', 'room', 'branch'].map((t) => (
              <button key={t} onClick={() => { setFilterType(t); setQuery(''); handleSearch('', selectedShift, selectedYear, t); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" value={query} placeholder={`Search registry by ${filterType}...`} className="w-full py-5 pl-16 pr-8 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-indigo-500/20 outline-none font-bold text-slate-700 transition-all text-sm" onChange={(e) => handleSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* LIVE CAPACITY GRID (RETAINED & STABILIZED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.roomData?.map((room) => {
              // ✅ 3. Defensive Check: prevent crash if summary is missing
              const currentSummary = searchData?.summary || {};
              const searchCount = currentSummary[room.name] || 0;
              
              if (query && searchCount === 0) return null;
              const branchStats = getBranchStatsForRoom(room.name);

              return (
                  <div key={room.name} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm group hover:border-indigo-300 transition-all relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                          <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{room.name}</span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                          </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-6 min-h-[30px]">
                          {branchStats.map(([br, count]) => (
                              <div key={br} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branchColorMap[br] || '#94a3b8' }} />
                                  <span className="text-[10px] font-black text-slate-700">{br}: {count}</span>
                              </div>
                          ))}
                      </div>
                      <div className="flex items-end justify-between">
                          <p className="text-2xl font-black text-slate-900 tracking-tighter">
                            {query ? searchCount : (room.count || 0)} 
                            <span className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest font-black">Seated</span>
                          </p>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* SEARCH RESULTS STUDENT CARDS (RETAINED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchData.results.map((s, idx) => (
          <div key={idx} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 group hover:shadow-2xl transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1.5 w-full rounded-t-full" style={{ backgroundColor: branchColorMap[s.branch] || '#cbd5e1' }}></div>
              <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl uppercase tracking-tighter">Room {s.room_no}</span>
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{s.seat_no}</p>
              </div>
              <h3 className="font-black text-slate-900 text-xl uppercase italic tracking-tight mb-1">{s.name}</h3>
              <p className="text-[11px] text-slate-500 font-bold mb-6 uppercase tracking-widest">{s.roll_no} • {s.branch}</p>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                      <div className="flex items-center gap-1 mb-1">
                          <BookOpen size={12} className="text-indigo-400"/>
                          <span className="text-[9px] font-black text-slate-400 uppercase">Year {s.year} • {s.shift}</span>
                      </div>
                      <span className="text-xs font-black text-slate-700 uppercase">{s.subject}</span>
                  </div>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, icon, color }) => (
  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
    <div className={`p-3 rounded-xl text-white shadow-lg ${color}`}>{icon}</div>
    <div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">{label}</span>
        <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
    </div>
  </div>
);

const FilterGroup = ({ label, current, options, onChange }) => (
  <div className="flex items-center gap-4">
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}:</span>
    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        {options.map(opt => (
            <button key={opt} onClick={() => onChange(opt)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${current === opt ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                {opt}
            </button>
        ))}
    </div>
  </div>
);

export default Analytics;