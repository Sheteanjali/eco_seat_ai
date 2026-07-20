import React, { useState, useEffect } from 'react';
import { 
  Users, Loader2, ShieldCheck, Search, Zap, Sun, Moon, 
  AlertCircle, LayoutDashboard, MapPin, Hammer, CheckCircle2, 
  BookOpen, DownloadCloud, FileText, Lock
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 👑 ADVANCED MULTI-AXIS FILTER STATES
  const [selectedShift, setSelectedShift] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedRoom, setSelectedRoom] = useState('All');
  const [query, setQuery] = useState('');
  
  const [masterResults, setMasterResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [roomSummary, setRoomSummary] = useState({});

  const [reportRoom, setReportRoom] = useState('');
  const [reportSeat, setReportSeat] = useState('');
  const [infraStatus, setInfraStatus] = useState('idle');

  const branchColorMap = {
    'CS': '#6366f1', 'ME': '#f59e0b', 'CE': '#10b981', 'EE': '#ec4899', 'IT': '#3b82f6', 'EC': '#8b5cf6'
  };

  // Fetch full data cluster on mount & auto-sync parameters loop
  useEffect(() => { 
    fetchAnalyticsAndRegistry();
    const interval = setInterval(() => {
        fetchAnalyticsAndRegistry();
    }, 15000); 
    return () => clearInterval(interval);
  }, []);

  // 🔥 CORE SEAMLESS RUNTIME SEARCH FILTER ENGINE
  useEffect(() => {
    let dataset = [...masterResults];

    if (selectedShift !== 'All') {
      dataset = dataset.filter(s => String(s.shift).toLowerCase() === selectedShift.toLowerCase());
    }

    if (selectedYear !== 'All') {
      dataset = dataset.filter(s => String(s.year) === String(selectedYear));
    }

    if (selectedBranch !== 'All') {
      dataset = dataset.filter(s => String(s.branch).toUpperCase() === selectedBranch.toUpperCase());
    }

    if (selectedRoom !== 'All') {
      dataset = dataset.filter(s => String(s.room_no) === String(selectedRoom));
    }

    if (query.trim()) {
      const keyword = query.toLowerCase().trim();
      dataset = dataset.filter(s => 
        String(s.name).toLowerCase().includes(keyword) ||
        String(s.roll_no).toLowerCase().includes(keyword) ||
        String(s.subject).toLowerCase().includes(keyword) ||
        String(s.room_no).toLowerCase().includes(keyword) ||
        String(s.branch).toLowerCase().includes(keyword)
      );
    }

    setFilteredResults(dataset);

    const summaryMap = {};
    dataset.forEach(s => {
      const rName = `Room ${s.room_no}`;
      summaryMap[rName] = (summaryMap[rName] || 0) + 1;
    });
    setRoomSummary(summaryMap);

  }, [query, selectedShift, selectedYear, selectedBranch, selectedRoom, masterResults]);

  const fetchAnalyticsAndRegistry = async () => {
    try {
      const statsRes = await axios.get('http://127.0.0.1:8000/api/admin/analytics');
      if (statsRes.data) setData(statsRes.data);

      const searchHubRes = await axios.get(`http://127.0.0.1:8000/api/admin/search-hub`, {
        params: { filter_type: 'student', query: '' }
      });
      if (searchHubRes.data?.results) {
        setMasterResults(searchHubRes.data.results);
      }
    } catch (err) { 
      console.error("Neural Matrix Sync Failed:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const downloadRegistryPdf = (mode) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    let exportData = [];
    let reportHeaderTitle = "";

    if (mode === 'current_filtered') {
      exportData = [...filteredResults];
      reportHeaderTitle = `SEGMENTED REPORT: COMBINATORIAL FILTER SELECTION MATRIX`;
    } else if (mode === 'morning') {
      exportData = masterResults.filter(s => String(s.shift).toLowerCase() === 'morning');
      reportHeaderTitle = "OFFICIAL REGISTRY: AM SHIFT PIPELINE (09:30 AM)";
    } else if (mode === 'afternoon') {
      exportData = masterResults.filter(s => String(s.shift).toLowerCase() === 'afternoon');
      reportHeaderTitle = "OFFICIAL REGISTRY: PM SHIFT PIPELINE (02:00 PM)";
    } else {
      exportData = [...masterResults];
      reportHeaderTitle = "OVERALL REGULATORY MASTER SEATING REGISTRY INDEX";
    }

    if (!exportData || exportData.length === 0) {
      alert("Verification Error: Selected dataset segment boundaries are completely empty.");
      return;
    }

    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("ECO-SEAT AI - SPATIAL ANALYTICS HUB", 14, 15);
    doc.setFontSize(9);
    doc.setFont("monospace", "bold");
    doc.text(`${reportHeaderTitle} • GENERATED RECORDS COUNT: ${exportData.length}`, 14, 22);

    const tableColumn = ["Roll Number", "Candidate Name", "Branch Track", "Year", "Subject Domain", "Allocated Room", "Seat Block ID", "Active Shift"];
    const tableRows = exportData.map(s => [
      s.roll_no, s.name.toUpperCase(), s.branch, s.year, s.subject, `Room ${s.room_no}`, s.seat_no, s.shift
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, font: "sans-serif" }
    });

    doc.save(`RBU_Seating_Report_${mode}_2026.pdf`);
  };

  const handleMarkBroken = async () => {
    if (!reportRoom || !reportSeat) return;
    setInfraStatus('loading');
    try {
      await axios.patch('http://127.0.0.1:8000/api/admin/room/update-infrastructure', {
        room_no: reportRoom.trim().toUpperCase(), 
        table_id: reportSeat.trim().toUpperCase(), 
        is_broken: true
      });
      setInfraStatus('success');
      fetchAnalyticsAndRegistry(); 
      setTimeout(() => setInfraStatus('idle'), 3000);
      setReportSeat('');
    } catch (err) { 
      setInfraStatus('idle'); 
    }
  };

  const getBranchStatsForRoom = (roomName, maxAllowedCapacity) => {
    const roomNum = String(roomName).replace('Room ', '').trim();
    const studentsInRoom = filteredResults.filter(s => String(s.room_no) === roomNum);
    
    const compliantStudents = studentsInRoom.slice(0, maxAllowedCapacity);
    const counts = {};
    compliantStudents.forEach(s => { counts[s.branch] = (counts[s.branch] || 0) + 1; });
    return Object.entries(counts);
  };

  const uniqueRoomsList = Array.from(new Set(masterResults.map(s => String(s.room_no)))).sort();
  const uniqueBranchesList = Array.from(new Set(masterResults.map(s => String(s.branch).toUpperCase()))).sort();

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">RBU Neural Syncing...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 px-6 bg-slate-50 min-h-screen pt-8 animate-in fade-in duration-700">
      
      {/* 🛡️ SECURITY STATUS CONTROLLER HEADER */}
      <div className="bg-slate-900 p-4 rounded-2xl flex justify-between items-center text-white/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <Lock size={14} className="text-cyan-400" />
          <span className="text-[9px] font-black uppercase tracking-widest font-mono">End-to-End Cryptographic Hub Vector</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 italic font-mono">Telemetry Active</span>
        </div>
      </div>

      {/* EXPORT MANAGEMENT CONTROL PLATFORM BAR */}
      <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl shadow-indigo-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Global Export Engine</h2>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest opacity-80 italic">Automated Document Generation Framework</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => downloadRegistryPdf('morning')} className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl text-white flex items-center gap-3 hover:bg-white/30 transition-all border border-white/10 group font-mono">
            <Sun size={14} /> <span className="text-[9px] font-black uppercase">Export Morning</span>
          </button>
          <button onClick={() => downloadRegistryPdf('afternoon')} className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl text-white flex items-center gap-3 hover:bg-white/30 transition-all border border-white/10 group font-mono">
            <Moon size={14} /> <span className="text-[9px] font-black uppercase">Export Afternoon</span>
          </button>
          <button onClick={() => downloadRegistryPdf('overall')} className="bg-slate-900 px-6 py-4 rounded-2xl text-white flex items-center gap-3 hover:scale-95 transition-all shadow-xl font-mono tracking-wider">
            <DownloadCloud size={14} /> <span className="text-[9px] font-black uppercase">Master Registry</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADMINISTRATIVE COUNTER PANELS */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><LayoutDashboard size={24}/></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Command Dashboard</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Live Seating Array Intelligence</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickStat label="Total Seated" value={data?.totalStudents || 0} icon={<Users size={16}/>} color="bg-slate-900" />
              <QuickStat label="Present Verification" value={data?.presentCount || 0} icon={<ShieldCheck size={16}/>} color="bg-emerald-500" />
              <QuickStat label="Active Halls" value={data?.roomData?.length || 0} icon={<MapPin size={16}/>} color="bg-indigo-500" />
              <QuickStat label="Utilization Rate" value={`${data?.utilization || 0}%`} icon={<Zap size={16}/>} color="bg-indigo-600" />
          </div>
        </div>

        {/* PHYSICAL FAULT INFRA LOCK NODE */}
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <AlertCircle size={18} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest font-mono">Structural Overrides</span>
                </div>
                <h3 className="text-xl font-black uppercase mb-4 tracking-tighter italic">Mark Broken Seat</h3>
                <div className="space-y-3">
                    <input type="text" placeholder="Room Number (e.g. 101)" value={reportRoom} onChange={(e) => setReportRoom(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:bg-white/20 transition-all text-white font-mono uppercase text-center" />
                    <input type="text" placeholder="Table Coordinates Label (e.g. T4)" value={reportSeat} onChange={(e) => setReportSeat(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:bg-white/20 transition-all text-white font-mono uppercase text-center" />
                    <button onClick={handleMarkBroken} disabled={infraStatus === 'loading'} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${infraStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-900 hover:scale-95'}`}>
                        {infraStatus === 'loading' ? <Loader2 className="animate-spin" size={14}/> : infraStatus === 'success' ? <><CheckCircle2 size={14}/> Marked</> : <><Hammer size={14}/> Inject Fault Lock</>}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* ================= MULTI-AXIS COMBINATORIAL SEARCH GATEWAY PANEL ================= */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 space-y-6">
        
        {/* DROPDOWN FILTER GROUPS BAR */}
        <div className="flex flex-wrap gap-6 items-center border-b border-slate-100 pb-6 justify-between">
            <div className="flex flex-wrap gap-6 items-center">
                <FilterGroup label="Shift" current={selectedShift} options={['All', 'Morning', 'Afternoon']} onChange={setSelectedShift} />
                <FilterGroup label="Year" current={selectedYear} options={['All', '1', '2', '3', '4']} onChange={setSelectedYear} />
                
                {/* ADVANCED FILTER: BRANCH SELECT MODULE */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Branch:</span>
                  <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="bg-slate-100 p-2 text-[10px] font-black uppercase rounded-xl border border-slate-200 outline-none text-slate-700 font-mono cursor-pointer">
                    <option value="All">ALL BRANCHES</option>
                    {uniqueBranchesList.map(b => <option key={b} value={b}>{b} MATRIX</option>)}
                  </select>
                </div>

                {/* ADVANCED FILTER: ROOM SELECT MODULE */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Hall No:</span>
                  <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="bg-slate-100 p-2 text-[10px] font-black uppercase rounded-xl border border-slate-200 outline-none text-slate-700 font-mono cursor-pointer">
                    <option value="All">ALL HALLS</option>
                    {uniqueRoomsList.map(rm => <option key={rm} value={rm}>ROOM {rm}</option>)}
                  </select>
                </div>
            </div>

            {/* HIGHLY ACCURATE SEGMENTED REPORT GENERATION BUTTON */}
            <button 
              onClick={() => downloadRegistryPdf('current_filtered')} 
              className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl active:scale-95 font-mono"
            >
              <FileText size={16}/> Export Filtered Matrix ({filteredResults.length})
            </button>
        </div>

        {/* COMBINED INTELLIGENT KEYWORD INPUT ELEMENT */}
        <div className="relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={query} 
            placeholder="Universal Tracker Node: Search across student names, roll numbers, subjects, room codes, branches..." 
            className="w-full py-5 pl-16 pr-8 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-indigo-500/30 outline-none font-bold text-slate-700 transition-all text-sm shadow-inner" 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </div>
      </div>

      {/* ================= DYNAMIC CAPACITY MATRIX VIEWS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.roomData?.map((room) => {
              const baseCapacity = room.capacity || 75;
              const studentsPerBench = 2; 
              const maxPhysicalLimit = baseCapacity * studentsPerBench;

              const searchCount = roomSummary[room.name] || 0;
              const finalSeatedCount = Math.min(room.count || 0, maxPhysicalLimit);

              if ((query || selectedShift !== 'All' || selectedYear !== 'All' || selectedBranch !== 'All' || selectedRoom !== 'All') && searchCount === 0) return null;
              
              const branchStats = getBranchStatsForRoom(room.name, maxPhysicalLimit);

              return (
                  <div key={room.name} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all relative overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-start mb-6">
                          <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none font-mono">{room.name}</span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 font-mono">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Node
                          </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-6 min-h-[30px]">
                          {branchStats.map(([br, count]) => (
                              <div key={br} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 shadow-sm font-mono">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branchColorMap[br] || '#94a3b8' }} />
                                  <span className="text-[10px] font-black text-slate-700">{br}: {count} Candidates</span>
                              </div>
                          ))}
                      </div>

                      <div className="flex items-end justify-between border-t border-slate-100 pt-4 font-mono">
                          <p className="text-2xl font-black text-slate-900 tracking-tighter">
                            {(query || selectedShift !== 'All' || selectedYear !== 'All' || selectedBranch !== 'All' || selectedRoom !== 'All') ? searchCount : finalSeatedCount} 
                            <span className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest font-black font-sans">
                              / {maxPhysicalLimit} Max Capacity Bounds
                            </span>
                          </p>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* ================= FILTERED TARGET CANDIDATE INDEX RESULTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResults.map((s, idx) => (
          <div key={idx} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 group hover:shadow-2xl transition-all relative overflow-hidden animate-in slide-in-from-bottom-3 duration-300">
              <div className="absolute top-0 left-0 h-1.5 w-full rounded-t-full" style={{ backgroundColor: branchColorMap[s.branch] || '#cbd5e1' }}></div>
              <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl uppercase tracking-tighter font-mono">Room {s.room_no}</span>
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none font-mono">{s.seat_no}</p>
              </div>
              <h3 className="font-black text-slate-900 text-xl uppercase italic tracking-tight mb-1">{s.name}</h3>
              <p className="text-[11px] text-slate-500 font-bold mb-6 uppercase tracking-widest font-mono">{s.roll_no} • {s.branch} MODULE</p>
              
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                      <div className="flex items-center gap-1.5 mb-1 font-mono">
                          <BookOpen size={12} className="text-indigo-400"/>
                          <span className="text-[9px] font-black text-slate-400 uppercase">Year {s.year} Track • {s.shift}</span>
                      </div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{s.subject}</span>
                  </div>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, icon, color }) => (
  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-xl text-white shadow-lg ${color}`}>{icon}</div>
    <div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1.5 font-mono">{label}</span>
        <p className="text-xl font-black text-slate-900 leading-none font-mono">{value}</p>
    </div>
  </div>
);

const FilterGroup = ({ label, current, options, onChange }) => (
  <div className="flex items-center gap-4">
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">{label}:</span>
    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {options.map(opt => (
            <button key={opt} onClick={() => onChange(opt)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${current === opt ? 'bg-white text-indigo-600 shadow-sm font-black' : 'text-slate-400 hover:text-slate-600'}`}>
                {opt}
            </button>
        ))}
    </div>
  </div>
);

export default Analytics;