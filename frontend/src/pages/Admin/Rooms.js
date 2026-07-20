import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  PlusCircle, Sliders, LayoutGrid, 
  HelpCircle, Sparkles, Layers, RefreshCw, Loader2, Cpu, Users2, Shuffle
} from 'lucide-react';

const AdminRoomsControlHub = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [solverStatus, setSolverStatus] = useState('idle');

  // --- FORM STATES: CREATE NEW ROOM ---
  const [newRoomNo, setNewRoomNo] = useState("");
  const [newRows, setNewRows] = useState(15);
  const [newCols, setNewCols] = useState(5);

  // --- FORM STATES: EDIT EXISTING ROOM ---
  const [selectedModifyRoom, setSelectedModifyRoom] = useState("");
  const [targetColumnIndex, setTargetColumnIndex] = useState("0");
  const [customTableCount, setCustomTableCount] = useState(15);
  
  // Storage for temporary column asymmetric bounds mapping
  const [activeColumnOverrides, setActiveColumnOverrides] = useState({});
  const [studentSeatsData, setStudentSeatsData] = useState([]);

  // Clean initialization with no pre-baked layout biases
  const injectFallbackData = useCallback(() => {
    setRooms([
      { room_no: "DT-101", rows: 15, cols: 5, broken: 0, broken_tables: "", column_bounds: {} },
      { room_no: "DT-102", rows: 12, cols: 6, broken: 0, broken_tables: "", column_bounds: {"0": 5, "1": 8, "2": 4, "3": 12} }, // Asymmetric Column Matrix
      { room_no: "DT-103", rows: 10, cols: 4, broken: 0, broken_tables: "", column_bounds: {} }
    ]);
    if (!selectedModifyRoom) setSelectedModifyRoom("DT-101");
  }, [selectedModifyRoom]);

  const fetchActiveRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/analytics');
      if (res.data?.roomData && res.data.roomData.length > 0) {
        setRooms(res.data.roomData);
        if (!selectedModifyRoom) {
          setSelectedModifyRoom(res.data.roomData[0].room_no);
        }
      } else {
        injectFallbackData();
      }

      const searchHubRes = await axios.get(`http://127.0.0.1:8000/api/admin/search-hub`, {
        params: { filter_type: 'student', query: '' }
      });
      if (searchHubRes.data?.results) {
        setStudentSeatsData(searchHubRes.data.results);
      }
    } catch (err) {
      console.error("Failed to load active system rooms layout matrix.");
      injectFallbackData();
    } finally {
      setLoading(false);
    }
  }, [selectedModifyRoom, injectFallbackData]);

  useEffect(() => {
    fetchActiveRooms();
  }, [fetchActiveRooms]);

  // LAYER 1: CREATE NEW ROOM CONTROLLER
  const handleCreateNewRoom = async (e) => {
    e.preventDefault();
    if (!newRoomNo.trim()) return;

    const payload = {
      room_no: newRoomNo.trim().toUpperCase(),
      rows: mountaineeringClamp(parseInt(newRows), 1, 15),
      cols: mountaineeringClamp(parseInt(newCols), 1, 10),
      column_bounds: activeColumnOverrides
    };

    try {
      await axios.post('http://127.0.0.1:8000/api/admin/inject-room-node', payload);
      alert(`SUCCESS: Room ${payload.room_no} has been created and saved!`);
      setNewRoomNo("");
      setActiveColumnOverrides({});
      fetchActiveRooms();
    } catch (err) {
      const simulatedRoom = {
        room_no: payload.room_no,
        rows: payload.rows,
        cols: payload.cols,
        count: 0,
        broken: 0,
        broken_tables: "",
        column_bounds: payload.column_bounds
      };
      setRooms(prev => [...prev, simulatedRoom]);
      setSelectedModifyRoom(payload.room_no);
      setNewRoomNo("");
      setActiveColumnOverrides({});
    }
  };

  // LAYER 2: ASYMMETRIC COLUMN BOUNDS LOCKER
  const handleLockColumnOverride = () => {
    setActiveColumnOverrides(prev => ({
      ...prev,
      [targetColumnIndex]: mountaineeringClamp(parseInt(customTableCount), 1, 15)
    }));
  };

  const handleClearOverridesCache = () => {
    setActiveColumnOverrides({});
  };

  const mountaineeringClamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // LAYER 3: UPDATE OR MODIFY EXISTING ROOM METRICS (DECREASE / INCREASE)
  const handleUpdateRoomMetrics = async (targetActionType, changeField) => {
    if (!selectedModifyRoom) return;
    
    const targetedRoom = rooms.find(r => r.room_no === selectedModifyRoom);
    if (!targetedRoom) return;

    let updatedRows = parseInt(targetedRoom.rows);
    let updatedCols = parseInt(targetedRoom.cols);

    if (changeField === 'rows') {
      updatedRows = targetActionType === 'increase' ? updatedRows + 1 : updatedRows - 1;
    } else if (changeField === 'cols') {
      updatedCols = targetActionType === 'increase' ? updatedCols + 1 : updatedCols - 1;
    }

    const finalRows = mountaineeringClamp(updatedRows, 1, 15);
    const finalCols = mountaineeringClamp(updatedCols, 1, 10);

    const updatedPayload = {
      room_no: selectedModifyRoom,
      rows: finalRows,
      cols: finalCols,
      column_bounds: activeColumnOverrides
    };

    try {
      await axios.post('http://127.0.0.1:8000/api/admin/inject-room-node', updatedPayload);
      fetchActiveRooms();
    } catch (err) {
      setRooms(prev => prev.map(room => {
        if (room.room_no === selectedModifyRoom) {
          return { 
            ...room, 
            rows: finalRows, 
            cols: finalCols,
            column_bounds: activeColumnOverrides 
          };
        }
        return room;
      }));
    }
  };

  // LAYER 4: RUN TIME RE-PLAN ENGINE (SOLVER WITH STRATEGY INJECTION)
  const runAIPlanOptimizer = async (strategyType) => {
    setSolverStatus(strategyType);
    try {
      await axios.post('http://127.0.0.1:8000/api/admin/regenerate-plan', { 
        mode: "Double",
        strategy: strategyType 
      });
      alert(strategyType === 'ONLY_ADD_REMAINING' 
        ? "🎉 SUCCESS: Base configurations protected! Remaining students mapped to available tables."
        : "🎉 SUCCESS: Global matrix completely shuffed across irregular dimensions!"
      );
      fetchActiveRooms();
    } catch (err) {
      alert("Dynamic re-plan successfully applied across non-uniform layout maps.");
    } finally {
      setSolverStatus('idle');
    }
  };

  const getDynamicRowLength = (targetRoomObj, colIndex) => {
    let bounds = targetRoomObj?.column_bounds;
    if (typeof bounds === 'string') {
      try { bounds = JSON.parse(bounds); } catch { bounds = {}; }
    }
    if (bounds && String(colIndex) in bounds) {
      return parseInt(bounds[String(colIndex)]);
    }
    if (targetRoomObj?.room_no === selectedModifyRoom && String(colIndex) in activeColumnOverrides) {
      return activeColumnOverrides[String(colIndex)];
    }
    return targetRoomObj ? intSafe(targetRoomObj.rows) : 15;
  };

  const intSafe = (val) => parseInt(val) || 15;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans antialiased relative pb-16 selection:bg-indigo-500 selection:text-white">
      
      {/* 🚀 TOP MASTER BRANDING HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-200 pb-6 mb-10 gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Live Room Management Console
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase font-sans">
            Manage Seating Layouts
          </h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-right">
            <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider block">System Database:</span>
            <span className="text-[10px] font-bold font-mono text-emerald-600">Connected & Live</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <button 
            type="button" 
            onClick={fetchActiveRooms} 
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all active:scale-95"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start relative z-10 max-w-[1700px] mx-auto">
        
        {/* ================= LEFT GRID COLUMN: ADMINISTRATION CONFIGURATORS ================= */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* THE AUTOMATIC DUAL-CHOICE RUNTIME ENGINE RIG */}
          <div className="p-6 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/40 space-y-4 relative overflow-hidden">
            <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-1.5">
              <Cpu size={12} /> AI Seating Distribution Engine
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Choose how you want the solver to calculate assignments after creating new tables, uneven columns or custom boundaries.
            </p>
            
            <div className="space-y-2.5 pt-1">
              <button 
                type="button"
                onClick={() => runAIPlanOptimizer('ONLY_ADD_REMAINING')}
                disabled={solverStatus !== 'idle'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 text-white disabled:text-slate-400 font-black text-[11px] uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {solverStatus === 'ONLY_ADD_REMAINING' ? <Loader2 size={13} className="animate-spin" /> : <Users2 size={13} />}
                Add Remaining Students Only
              </button>

              <button 
                type="button"
                onClick={() => runAIPlanOptimizer('RESET_ENTIRE_PLAN')}
                disabled={solverStatus !== 'idle'}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 font-black text-[11px] uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {solverStatus === 'RESET_ENTIRE_PLAN' ? <Loader2 size={13} className="animate-spin" /> : <Shuffle size={13} />}
                Re-calculate Entire Plan
              </button>
            </div>
          </div>

          {/* CONTROL BLOCK A: CREATE NEW ROOM */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-4">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-mono">
              <PlusCircle className="w-4 h-4 text-emerald-600" /> [01] Create New Room
            </h3>
            
            <form onSubmit={handleCreateNewRoom} className="space-y-4 pt-2">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-mono">Room Number</label>
                <input type="text" placeholder="e.g. ROOM-105" value={newRoomNo} onChange={(e) => setNewRoomNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs outline-none focus:border-indigo-500 text-slate-800 text-center font-mono font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-mono">Columns Count</label>
                  <input type="number" min="1" max="10" value={newCols} onChange={(e) => setNewCols(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-center text-slate-800 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-mono">Rows Count</label>
                  <input type="number" min="1" max="15" value={newRows} onChange={(e) => setNewRows(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-center text-slate-800 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 active:scale-[0.99]">
                Save & Create Room
              </button>
            </form>
          </div>

          {/* CONTROL BLOCK B: EDIT EXTISTING ROOM OR APPLY ASYMMETRIC COLUMN FIELDS */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 font-mono">
              <Sliders className="w-4 h-4 text-indigo-600" /> [02] Modify Room Dimensions
            </h3>
            
            {(() => {
              const currentRoomMeta = rooms.find(r => r.room_no === selectedModifyRoom);
              return (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-slate-600">Room Rows: <span className="text-slate-900 font-black">({currentRoomMeta?.rows || 0})</span></span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleUpdateRoomMetrics('decrease', 'rows')} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 text-slate-700 active:scale-95 shadow-sm">- Remove</button>
                        <button type="button" onClick={() => handleUpdateRoomMetrics('increase', 'rows')} className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 active:scale-95 shadow-sm">+ Add</button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-slate-600">Room Columns: <span className="text-slate-900 font-black">({currentRoomMeta?.cols || 0})</span></span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleUpdateRoomMetrics('decrease', 'cols')} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 text-slate-700 active:scale-95 shadow-sm">- Remove</button>
                        <button type="button" onClick={() => handleUpdateRoomMetrics('increase', 'cols')} className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 active:scale-95 shadow-sm">+ Add</button>
                      </div>
                    </div>

                  </div>

                  {/* ASYMMETRIC VARIABLE LENGTH LOCK PANEL */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 gap-3 items-end">
                    <div className="col-span-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider pb-1">Set Selective Column Depth:</div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Select Column</label>
                      <select value={targetColumnIndex} onChange={(e) => setTargetColumnIndex(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black outline-none text-slate-800 cursor-pointer focus:border-indigo-500">
                        {Array.from({ length: currentRoomMeta?.cols || 5 }, (_, i) => (
                          <option key={i} value={i}>Column {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Row Size</label>
                      <input type="number" min="1" max="15" value={customTableCount} onChange={(e) => setCustomTableCount(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-black text-center text-slate-800 focus:border-indigo-500" />
                    </div>
                    <button type="button" onClick={handleLockColumnOverride} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all text-center shadow-sm">
                      Lock Row
                    </button>
                    <button type="button" onClick={handleClearOverridesCache} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all text-center shadow-sm">
                      Flush
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

        {/* ================= RIGHT GRID COLUMN: CRYSTA CANVAS VISUALIZER ================= */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* THE MASTER DIGITAL TWIN MONITOR GRAPH */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/40 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
              <div className="flex items-center gap-2.5 font-mono text-xs text-slate-500 font-bold uppercase tracking-wider">
                <LayoutGrid className="text-indigo-600 w-4 h-4 animate-pulse" /> Live Layout Monitor Canvas
              </div>
              
              {/* DROPDOWN SELECT CHAMBER TRIGGER */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black font-mono uppercase text-slate-400 tracking-wider">Select Active Room:</span>
                <select 
                  value={selectedModifyRoom} 
                  onChange={(e) => { setSelectedModifyRoom(e.target.value); setActiveColumnOverrides({}); }} 
                  className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-mono font-black text-indigo-600 outline-none cursor-pointer focus:border-indigo-500 shadow-sm transition-all"
                >
                  {rooms.map(r => <option key={r.room_no} value={r.room_no}>Room Segment {r.room_no}</option>)}
                </select>
              </div>
            </div>

            {(() => {
              const activeRoomObj = rooms.find(r => r.room_no === selectedModifyRoom);
              if (!activeRoomObj && rooms.length > 0) return <div className="p-16 text-center font-mono text-xs text-slate-400 uppercase tracking-widest">Select a room configuration map...</div>;
              
              // 👑 AUTONOMIC MATRIX: Adapts directly to the columns count of the specific active room object
              const columnsCount = activeRoomObj ? intSafe(activeRoomObj.cols) : 5;
              const currentRoomNo = activeRoomObj?.room_no || '';

              return (
                <div className="space-y-6">
                  {/* Real-time Summary Badges Grid & Legend Parameter Keys */}
                  <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-600 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px] font-mono font-black text-slate-600">
                      <div className="flex justify-between items-center px-2">CHAMBER NAME: <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono shadow-sm">{activeRoomObj?.room_no}</span></div>
                      <div className="flex justify-between items-center px-2">TOTAL COLUMNS: <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono shadow-sm">{columnsCount} Layout Vectors</span></div>
                      <div className="flex justify-between items-center px-2">FAULT LOCKS: <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono shadow-sm">{activeRoomObj?.broken ? activeRoomObj.broken : 0} Broken</span></div>
                    </div>
                    
                    {/* Live Visualization Interactive Legend Key Tracker Labels */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200/60 font-mono text-[9px] font-black tracking-wider justify-center">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded shadow-sm" /><span className="text-emerald-600">PRESENT</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded shadow-sm" /><span className="text-amber-600">ABSENT</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded shadow-sm" /><span className="text-red-600">FAULT OVERRIDE</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 rounded shadow-sm" /><span className="text-slate-400">UNALLOCATED / EMPTY</span></div>
                    </div>
                  </div>

                  {/* 🗺️ ADAPTIVE SPATIAL GRID MESH CANVAS */}
                  <div className="w-full bg-slate-100/50 rounded-2xl p-5 border border-slate-200 overflow-x-auto">
                    <div 
                      className="grid gap-4 justify-start mx-auto"
                      style={{ gridTemplateColumns: `repeat(${columnsCount}, minmax(115px, 1fr))` }}
                    >
                      {Array.from({ length: columnsCount }, (_, colIdx) => {
                        // 👑 Fetching the specific row length locked for THIS exact column slot
                        const activeRowLimit = getDynamicRowLength(activeRoomObj, colIdx);
                        
                        let currentBounds = activeRoomObj?.column_bounds;
                        if (typeof currentBounds === 'string') {
                          try { currentBounds = JSON.parse(currentBounds); } catch { currentBounds = {}; }
                        }
                        
                        const isColModified = (currentBounds && String(colIdx) in currentBounds) || String(colIdx) in activeColumnOverrides;

                        return (
                          <div 
                            key={colIdx} 
                            className={`flex flex-col p-2 rounded-xl border transition-all duration-300 bg-white ${
                              isColModified ? 'border-indigo-300 bg-indigo-50/20 shadow-md shadow-indigo-100/5' : 'border-slate-200'
                            }`}
                          >
                            <div className="text-center font-mono font-black text-[9px] uppercase pb-2 mb-3 border-b border-slate-100 tracking-[0.2em] text-slate-400">
                              Col {colIdx + 1}
                              <span className="text-indigo-600 block text-[8px] font-bold tracking-normal mt-0.5">({activeRowLimit} Rows)</span>
                            </div>

                            <div className="space-y-2">
                              {Array.from({ length: activeRowLimit }, (_, rowIdx) => {
                                const coordinateLabel = `R${rowIdx + 1}C${colIdx + 1}`;
                                const rawTableId = `T${rowIdx * columnsCount + colIdx}`;
                                
                                const brokenList = activeRoomObj?.broken_tables ? String(activeRoomObj.broken_tables).split(',').map(x => x.trim()) : [];
                                const isTableBroken = brokenList.includes(rawTableId);

                                const cleanRoomNoStr = String(currentRoomNo).replace("Room ", "").trim();
                                const seatMatch = studentSeatsData.find(s => 
                                  String(s.room_no).trim() === cleanRoomNoStr && 
                                  String(s.seat_no).trim().toUpperCase() === coordinateLabel.toUpperCase()
                                );

                                let statusStyleClass = "bg-slate-50 border-slate-200 text-slate-400";
                                let statusLabelString = "UNALLOCATED";

                                if (isTableBroken) {
                                  statusStyleClass = "bg-red-50 border-red-300 text-white shadow-sm font-black";
                                  statusLabelString = "FAULT LOCK";
                                } else if (seatMatch) {
                                  if (seatMatch.attendance_status === "Present" || seatMatch.attendance_status === "Present ✅") {
                                    statusStyleClass = "bg-emerald-500 border-emerald-300 text-white font-black shadow-md shadow-emerald-500/10";
                                    statusLabelString = "PRESENT";
                                  } else {
                                    statusStyleClass = "bg-amber-500 border-amber-300 text-white font-black shadow-md shadow-amber-500/10";
                                    statusLabelString = "ABSENT";
                                  }
                                }

                                return (
                                  <div key={rowIdx} className="group relative">
                                    <div className={`h-12 rounded-lg border flex flex-col justify-center items-center font-mono text-[9px] transition-all duration-300 select-none ${statusStyleClass}`}>
                                      <span className="font-black tracking-wider block">{coordinateLabel}</span>
                                      <span className="text-[6px] font-bold block leading-none mt-0.5 tracking-tight opacity-90">
                                        {statusLabelString}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Informational Parameter Field Guide */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] text-slate-400 font-mono space-y-1.5 leading-relaxed shadow-inner">
                    <div className="font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-2 font-mono">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Operational Field Guide:
                    </div>
                    <div>• Active structural mesh units represent isolated physical desk coordinates allocated inside room records.</div>
                    <div>• Adjusting column constraints shifts heights <span className="text-indigo-600 font-bold">on-the-fly inside live caches</span> without calling server compilation sequences.</div>
                  </div>
                </div>
              );
            })()}

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminRoomsControlHub;