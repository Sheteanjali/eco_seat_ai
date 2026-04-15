import React, { useState, useEffect } from 'react';
// Added BookOpen to imports to fix the ESLint Error
import { 
  Users, Loader2, ShieldCheck, Search, Zap, Fingerprint, Sun, Moon, 
  AlertCircle, Clock, LayoutDashboard, MapPin, Hammer, CheckCircle2, 
  Smartphone, Building2, BookOpen 
} from 'lucide-react';
import axios from 'axios';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('subject'); // Default to subject as requested
  const [selectedShift, setSelectedShift] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [query, setQuery] = useState('');
  const [searchData, setSearchData] = useState({ results: [], summary: {}, total: 0 });

  // Infrastructure Reporting States
  const [reportRoom, setReportRoom] = useState('');
  const [reportSeat, setReportSeat] = useState('');
  const [infraStatus, setInfraStatus] = useState('idle');

  const branchColorMap = {
    'CS': '#6366f1', 'ME': '#f59e0b', 'CE': '#10b981', 'EE': '#ec4899', 'IT': '#3b82f6', 'EC': '#8b5cf6'
  };

  useEffect(() => { 
    fetchAnalytics();
    handleSearch('', 'All', 'All', 'subject');
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/analytics');
      setData(res.data);
    } catch (err) { console.error("Sync Failed"); }
    finally { setLoading(false); }
  };

  const handleSearch = async (val, shift = selectedShift, year = selectedYear, type = filterType) => {
    setQuery(val);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/admin/search-hub`, {
        params: { 
          filter_type: type, 
          query: val, 
          shift: shift, 
          year: year 
        }
      });
      setSearchData(res.data);
    } catch (err) { console.error("Search failed"); }
  };

  const handleMarkBroken = async () => {
    if (!reportRoom || !reportSeat) return;
    setInfraStatus('loading');
    try {
      // Updates the Digital Twin in the backend
      await axios.patch('http://127.0.0.1:8000/api/admin/room/update-infrastructure', {
        room_no: reportRoom,
        table_id: reportSeat,
        is_broken: true
      });
      setInfraStatus('success');
      setTimeout(() => setInfraStatus('idle'), 3000);
      setReportSeat('');
    } catch (err) {
      setInfraStatus('idle');
      alert("Infrastructure Sync Failed");
    }
  };

  const getBranchCounts = (results) => {
    const counts = {};
    results.forEach(s => { counts[s.branch] = (counts[s.branch] || 0) + 1; });
    return counts;
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">RBU Neural Syncing...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 px-6 bg-slate-50 min-h-screen pt-8 animate-in fade-in duration-700">
      
      {/* SECTION 1: COMMAND DASHBOARD (Digital Twin & Verify Scan Logic) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STATS OVERVIEW */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><LayoutDashboard size={24}/></div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Command Dashboard</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Verify Scan & Digital Twin Live</p>
              </div>
            </div>
            <div className="hidden md:flex gap-2">
                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black flex items-center gap-2 border border-emerald-100">
                    <ShieldCheck size={14}/> Verify Scan Active
                </div>
                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black flex items-center gap-2 border border-blue-100">
                    <Building2 size={14}/> Twin Linked
                </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <QuickStat label="Total Seated" value={data?.totalStudents || 0} icon={<Users size={16}/>} color="bg-slate-900" />
             <QuickStat label="Present" value={data?.presentCount || 0} icon={<ShieldCheck size={16}/>} color="bg-emerald-500" />
             <QuickStat label="Active Halls" value={data?.roomData?.length || 0} icon={<MapPin size={16}/>} color="bg-indigo-500" />
             <QuickStat label="Utilization" value={`${data?.utilization || 0}%`} icon={<Zap size={16}/>} color="bg-indigo-600" />
          </div>
        </div>

        {/* INFRASTRUCTURE: MARK BROKEN CHAIR */}
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <AlertCircle size={18} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Infrastructure Control</span>
                </div>
                <h3 className="text-xl font-black uppercase mb-4 tracking-tighter italic">Mark Broken Seat</h3>
                <div className="space-y-3">
                    <input 
                      type="text" placeholder="Room No (e.g. 702)" value={reportRoom}
                      onChange={(e) => setReportRoom(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-xs outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
                    />
                    <input 
                      type="text" placeholder="Table ID (e.g. T12)" value={reportSeat}
                      onChange={(e) => setReportSeat(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-xs outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
                    />
                    <button 
                      onClick={handleMarkBroken} disabled={infraStatus === 'loading'}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 
                      ${infraStatus === 'success' ? 'bg-emerald-500' : 'bg-amber-500 text-slate-900 hover:scale-95'}`}
                    >
                        {infraStatus === 'loading' ? <Loader2 className="animate-spin" size={14}/> : 
                         infraStatus === 'success' ? <><CheckCircle2 size={14}/> Marked</> : 
                         <><Hammer size={14}/> Update Twin</>}
                    </button>
                </div>
            </div>
            <Hammer className="absolute -right-6 -bottom-6 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700" size={120} />
        </div>
      </div>

      {/* SECTION 2: SEARCH & ANALYTICS FILTERS */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-wrap gap-8 items-center border-b border-slate-100 pb-6">
           <FilterGroup label="Shift" current={selectedShift} options={['All', 'Morning', 'Afternoon']} onChange={(v) => { setSelectedShift(v); handleSearch(query, v, selectedYear); }} />
           <FilterGroup label="Year" current={selectedYear} options={['All', '1', '2', '3', '4']} onChange={(v) => { setSelectedYear(v); handleSearch(query, selectedShift, v); }} />
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {['subject', 'student', 'room', 'branch'].map((t) => (
              <button key={t} onClick={() => { setFilterType(t); setQuery(''); handleSearch('', selectedShift, selectedYear, t); }}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" value={query} placeholder={`Search registry by ${filterType}...`} 
              className="w-full py-5 pl-16 pr-8 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-indigo-500/20 focus:bg-white outline-none font-bold text-slate-700 transition-all text-sm"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: ROOM STATUS & SUBJECT CARDS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                <Fingerprint size={16} className="text-indigo-600" /> Result Matrix ({searchData.total})
            </h3>
        </div>

        {/* Dynamic Room Capacity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(searchData.summary || {}).map(([room, count]) => (
                <div key={room} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-slate-800">{room}</span>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">{count} Seated</span>
                    </div>
                    <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-slate-100">
                        {Object.entries(getBranchCounts(searchData.results.filter(s => `Room ${s.room_no}` === room))).map(([br, brCount]) => (
                            <div key={br} style={{ width: `${(brCount/count)*100}%`, backgroundColor: branchColorMap[br] || '#cbd5e1' }} />
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchData.results.map((s, idx) => (
            <div key={idx} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 group hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: branchColorMap[s.branch] || '#cbd5e1' }}></div>
                <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl uppercase tracking-tighter">Room {s.room_no}</span>
                    <div className="text-right">
                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{s.seat_no}</p>
                        <p className="text-[8px] font-black uppercase text-slate-400 mt-1">Allocation ID</p>
                    </div>
                </div>
                <h3 className="font-black text-slate-900 text-xl uppercase mb-1 italic tracking-tight">{s.name}</h3>
                <p className="text-[11px] text-slate-500 font-bold mb-6 uppercase tracking-widest">{s.roll_no} • {s.branch}</p>
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 mb-1">
                            <BookOpen size={12} className="text-indigo-400"/>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Year {s.year} • {s.shift}</span>
                        </div>
                        <span className="text-xs font-black text-slate-700 uppercase truncate max-w-[160px]">{s.subject}</span>
                    </div>
                    <div className={`p-3 rounded-2xl ${s.shift === 'Morning' ? 'text-amber-500 bg-amber-50' : 'text-indigo-500 bg-indigo-50'}`}>
                        {s.shift === 'Morning' ? <Sun size={20}/> : <Moon size={20}/>}
                    </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const QuickStat = ({ label, value, icon, color }) => (
  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
    <div className={`p-3 rounded-xl text-white ${color} shadow-lg shadow-slate-200`}>{icon}</div>
    <div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
        <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const FilterGroup = ({ label, current, options, onChange }) => (
  <div className="flex items-center gap-4">
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}:</span>
    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        {options.map(opt => (
            <button key={opt} onClick={() => onChange(opt)} 
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${current === opt ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                {opt}
            </button>
        ))}
    </div>
  </div>
);

export default Analytics;