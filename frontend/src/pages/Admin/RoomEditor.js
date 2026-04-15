import React, { useState, useEffect } from 'react';
import { Zap, MapPin, AlertTriangle, ShieldCheck, Box, ChevronRight, Info, CheckCircle2, Loader2 } from 'lucide-react';
import DigitalTwinGrid from '../../components/DigitalTwinGrid';
import apiService from '../../services/api'; 
import axios from 'axios';

const RoomEditor = () => {
  const [rooms, setRooms] = useState([]); 
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [status, setStatus] = useState('idle');

  // 1. Initial Infrastructure Sync: Fetch list of all rooms
  useEffect(() => {
    const initInfra = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/admin/rooms');
        setRooms(res.data);
        if (res.data.length > 0) setSelectedRoom(res.data[0]);
      } catch (err) { 
        console.error("Infrastructure Sync Failed: Backend unreachable or 404"); 
      }
    };
    initInfra();
  }, []);

  // 2. Room Switcher: Update local state when selectedRoom changes
  useEffect(() => {
    if (selectedRoom) {
      // Parse the broken_tables string stored in DB (e.g., "T1,T4,T10")
      const broken = selectedRoom.broken_tables 
        ? selectedRoom.broken_tables.split(',').filter(t => t !== "") 
        : [];
      setBlockedSeats(broken);
      setStatus('idle');
    }
  }, [selectedRoom]);

  // 3. On-Time Constraint Marking
  const toggleTableStatus = async (tableId) => {
    const isCurrentlyBroken = blockedSeats.includes(tableId);
    const updatedBlocked = isCurrentlyBroken 
      ? blockedSeats.filter(s => s !== tableId) 
      : [...blockedSeats, tableId];
    
    setBlockedSeats(updatedBlocked);

    try {
      // API call to patch the CSV string in the rooms table
      await axios.patch('http://127.0.0.1:8000/api/admin/room/update-infrastructure', {
        room_no: selectedRoom.room_no,
        table_id: tableId,
        is_broken: !isCurrentlyBroken
      });
      
      // Update local rooms list to keep sync
      setRooms(prev => prev.map(r => 
        r.room_no === selectedRoom.room_no 
          ? { ...r, broken_tables: updatedBlocked.join(',') } 
          : r
      ));
    } catch (err) { 
        console.error("Real-time Constraint Sync Failed"); 
    }
  };

  // 4. Trigger Recursive Solver pass
  const runAISolver = async () => {
    setStatus('solving');
    try {
      // Assuming uploadBulkData handles the re-allocation logic based on updated constraints
      const res = await apiService.uploadBulkData(); 
      if (res.data.status === 'success') {
        setStatus('success');
        // Auto-refresh stats after 2 seconds
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (error) { 
        setStatus('error'); 
        alert("Solver Error: Check Terminal for CSP backtracking logs.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 gap-6 p-6 overflow-hidden animate-in fade-in duration-700">
      
      {/* LEFT: ROOM DIRECTORY SIDEBAR */}
      <div className="w-80 bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col">
        <div className="mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Infrastructure</h3>
            <p className="text-xs font-bold text-slate-900">Select Hall to map constraints</p>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {rooms.map((room) => (
            <button 
              key={room.room_no}
              onClick={() => setSelectedRoom(room)}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                selectedRoom?.room_no === room.room_no 
                ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-x-1' 
                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedRoom?.room_no === room.room_no ? 'bg-indigo-500' : 'bg-white border'}`}>
                    <Box size={14} className={selectedRoom?.room_no === room.room_no ? 'text-white' : 'text-slate-400'} />
                </div>
                <div className="text-left">
                    <p className="text-xs font-black uppercase">Hall {room.room_no}</p>
                    <p className={`text-[8px] font-bold uppercase tracking-tighter ${selectedRoom?.room_no === room.room_no ? 'text-slate-400' : 'text-slate-400'}`}>
                        {room.total_tables} Seats • Floor {room.floor}
                    </p>
                </div>
              </div>
              <ChevronRight size={14} className={`${selectedRoom?.room_no === room.room_no ? 'text-indigo-400' : 'opacity-0'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: INTERACTIVE TWIN & SOLVER NODE */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* HEADER CONTROL BAR */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <MapPin size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                        Digital Twin: <span className="text-indigo-600">{selectedRoom?.room_no}</span>
                    </h2>
                    <div className="flex gap-4 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Info size={10} className="text-indigo-400"/> Grid Layout: {selectedRoom?.rows}x{selectedRoom?.cols}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${blockedSeats.length > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                            <AlertTriangle size={10}/> Broken/Blocked: {blockedSeats.length}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                  onClick={runAISolver}
                  disabled={status === 'solving'}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                >
                  {status === 'solving' ? 'Backtracking...' : 'Recalculate Session Shifts'} <Zap size={16} />
                </button>
            </div>
        </div>

        {/* INTERACTIVE MAPPING AREA */}
        <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm overflow-y-auto relative">
           <div className="mb-6 flex justify-between items-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactive Seat Variable Modeling</p>
               {status === 'success' && (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 animate-in zoom-in">
                      <CheckCircle2 size={14}/>
                      <span className="text-[9px] font-black uppercase tracking-widest">Constraint Matrix Stabilized</span>
                  </div>
               )}
           </div>

           {selectedRoom ? (
             <DigitalTwinGrid 
                rows={parseInt(selectedRoom.rows)} 
                cols={parseInt(selectedRoom.cols)} 
                blockedSeats={blockedSeats} 
                onToggleSeat={toggleTableStatus} 
                interactive={true}
             />
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Loader2 className="animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Initializing Infrastructure Directory...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default RoomEditor;