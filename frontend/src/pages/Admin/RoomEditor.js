import React, { useState, useEffect } from 'react';
import { 
  Box, ChevronRight, CheckCircle2, Loader2, RefreshCcw, Activity, List, Cpu, ShieldAlert 
} from 'lucide-react';
import DigitalTwinGrid from '../../components/DigitalTwinGrid';
import axios from 'axios';

const RoomEditor = () => {
  const [rooms, setRooms] = useState([]); 
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [status, setStatus] = useState('idle');

  // 1. Load data from Backend
  const fetchRooms = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/analytics');
      if (res.data && res.data.roomData) {
        setRooms(res.data.roomData);
        
        // Agar pehle se koi selected hai, uska data refresh karo
        if (selectedRoom) {
          const updated = res.data.roomData.find(r => r.room_no === selectedRoom.room_no);
          if (updated) {
            setSelectedRoom(updated);
            const broken = updated.broken_tables ? updated.broken_tables.split(',').filter(Boolean) : [];
            setBlockedSeats(broken);
          }
        } else if (res.data.roomData.length > 0) {
          setSelectedRoom(res.data.roomData[0]);
        }
      }
    } catch (err) { 
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  // Sync blockedSeats when selectedRoom changes
  useEffect(() => {
    if (selectedRoom) {
      const broken = selectedRoom.broken_tables ? selectedRoom.broken_tables.split(',').filter(Boolean) : [];
      setBlockedSeats(broken);
    }
  }, [selectedRoom]);

  // 2. UPDATED: Toggle & Update Logic
  const toggleTableStatus = async (tableId) => {
    if (!selectedRoom) return;

    const isCurrentlyBroken = blockedSeats.includes(tableId);
    
    // --- OPTIMISTIC UPDATE: Instant Color Change ---
    const newBlockedSeats = isCurrentlyBroken 
      ? blockedSeats.filter(s => s !== tableId) 
      : [...blockedSeats, tableId];
    
    setBlockedSeats(newBlockedSeats); // UI will turn RED/BLUE immediately

    try {
      const payload = {
        room_no: String(selectedRoom.room_no), // Ensure it's a string
        table_id: String(tableId),
        is_broken: !isCurrentlyBroken
      };

      const response = await axios.patch('http://127.0.0.1:8000/api/admin/room/update-infrastructure', payload);
      
      if (response.data.status === 'success') {
        console.log("Infrastructure Updated in DB");
        fetchRooms(); // Sync with DB
      }
    } catch (err) {
      console.error("Update Failed:", err.response?.data || err.message);
      alert("Database Sync Failed. Check if API /update-infrastructure exists.");
      fetchRooms(); // Revert UI to match DB
    }
  };

  // 3. Regenerate Logic
  const runAISolver = async () => {
    setStatus('solving');
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/admin/regenerate-plan', { mode: "Double" });
      if (res.data.status === 'success') {
        setStatus('success');
        fetchRooms();
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (error) {
      console.error("Solver Failed");
      setStatus('idle');
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
           <h1 className="text-lg font-black text-slate-900 uppercase italic">
             Eco-Seat <span className="text-indigo-600">AI</span> Digital Twin
           </h1>
           <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
             Hall: {selectedRoom?.room_no || 'None'}
           </span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black text-emerald-700 uppercase">System Online</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-800">Hall Index</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {rooms.map((room) => (
              <button 
                key={room.room_no}
                onClick={() => setSelectedRoom(room)}
                className={`w-full p-4 rounded-xl transition-all flex items-center justify-between ${
                  selectedRoom?.room_no === room.room_no 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Box size={14} className={selectedRoom?.room_no === room.room_no ? 'text-indigo-400' : 'text-slate-300'} />
                  <span className="text-xs font-bold uppercase">Hall {room.room_no}</span>
                </div>
                {room.broken > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER: MAP */}
        <main className="flex-1 bg-[#F9FAFB] p-8 overflow-auto flex flex-col items-center">
           <div className="w-full max-w-5xl">
              <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl border border-slate-200">
                 <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Live Seating Map</h2>
                 <div className="flex gap-6">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-indigo-600 rounded" /><span className="text-[9px] font-black text-slate-600 uppercase">Available</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded" /><span className="text-[9px] font-black text-red-600 uppercase">Faulty</span></div>
                 </div>
              </div>

              <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm flex justify-center">
                 {selectedRoom ? (
                    <DigitalTwinGrid 
                      rows={parseInt(selectedRoom.rows)} 
                      cols={parseInt(selectedRoom.cols)} 
                      blockedSeats={blockedSeats} 
                      onToggleSeat={toggleTableStatus} 
                      interactive={true}
                    />
                 ) : <Loader2 className="animate-spin text-slate-200" size={40} />}
              </div>
           </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-80 bg-white border-l border-slate-200 p-8 flex flex-col shrink-0">
           <div className="flex-1">
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-2.5 bg-indigo-600 text-white rounded-2xl"><Cpu size={18}/></div>
                 <span className="text-xs font-black uppercase text-slate-900">Operations Hub</span>
              </div>
              
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-8">
                 <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Faulty Report</h4>
                 <div className="grid grid-cols-2 gap-2">
                    {blockedSeats.map(t => (
                      <div key={t} className="bg-white/5 text-red-400 px-3 py-2 rounded-lg font-black text-[10px]">{t}</div>
                    ))}
                    {blockedSeats.length === 0 && <p className="text-[10px] text-slate-500 italic">No faults</p>}
                 </div>
              </div>

              <button 
                 onClick={runAISolver}
                 disabled={status === 'solving'}
                 className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl active:scale-95"
              >
                 {status === 'solving' ? <Loader2 className="animate-spin" size={16}/> : <RefreshCcw size={16} />}
                 Sync Matrix
              </button>
           </div>
           
           {status === 'success' && (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14}/> Seating Plan Re-optimized
              </div>
           )}
        </aside>
      </div>
    </div>
  );
};

export default RoomEditor;