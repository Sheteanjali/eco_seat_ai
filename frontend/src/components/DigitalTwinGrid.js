import React from 'react';

/**
 * DigitalTwinGrid: Advanced Spatial Mapping for RBU-DT Building.
 * Features: On-time Broken Bench Marking & Live Attendance Visualization.
 */
const DigitalTwinGrid = ({ 
  occupiedSeats = [], 
  blockedSeats = [], // T1, T2 format for broken tables
  onToggleSeat,      // Function to mark broken on-time
  userSeat, 
  rows = 15, 
  cols = 5,
  interactive = false 
}) => {
  
  const grid = [];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seatId = `R${r}C${c}`;
      const tableIndex = r * cols + c;
      const tableId = `T${tableIndex}`;
      
      const isUser = seatId === userSeat;
      const isBroken = blockedSeats.includes(tableId);
      const occupant = occupiedSeats.find(s => s.seat === seatId);

      grid.push(
        <div
          key={seatId}
          onClick={() => {
            if (interactive) {
              // Admin toggles broken status on-time
              onToggleSeat(tableId);
            } else if (occupant) {
              alert(
                `REGISTRY VERIFIED\n------------------\n` +
                `Candidate: ${occupant.name}\n` +
                `Status: ${occupant.status === 'Present' ? '✅ PRESENT' : '⏳ ABSENT'}\n` +
                `Syllabus Group: ${occupant.paper_group_id || 'N/A'}\n` +
                `Assigned Seat: ${seatId}`
              );
            }
          }}
          className={`
            aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
            ${isBroken 
              ? 'bg-rose-100 border-rose-200 text-rose-400 opacity-60' 
              : isUser 
                ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-100 ring-4 ring-white z-10 scale-110' 
                : occupant 
                  ? occupant.status === 'Present'
                    ? 'bg-emerald-500 border-emerald-400 text-white' // Scanned by Admin
                    : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200' // Allocated but Absent
                  : 'bg-slate-50 border-slate-100 border-dashed text-slate-200'}
          `}
        >
          {/* Seat Coordinate Label */}
          <span className={`text-[7px] font-bold uppercase mb-0.5 tracking-tighter 
            ${isUser || (occupant && occupant.status === 'Present') ? 'text-white/70' : 'text-slate-300'}`}>
            {isBroken ? 'BROKEN' : tableId}
          </span>
          
          {isUser && (
            <span className="text-[10px] font-black text-white leading-none uppercase tracking-widest">You</span>
          )}
          
          {occupant && occupant.status === 'Present' && !isUser && (
            <span className="text-[8px] font-black text-white leading-none uppercase">IN</span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 h-fit animate-in fade-in duration-700">
      
      {/* Dynamic Legend */}
      <div className="flex flex-wrap justify-between items-start border-b border-slate-50 pb-4 gap-4">
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", serif' }}>
            Infrastructure Monitor
          </h4>
          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
            {interactive ? "Interactive Mode: Click to mark/unmark broken tables" : "Viewer Mode: Visualizing live occupancy"}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <LegendItem color="bg-rose-400" label="Broken (Skip)" />
          <LegendItem color="bg-emerald-500" label="Present (In)" />
          <LegendItem color="bg-slate-200" label="Absent (Out)" />
          <LegendItem color="bg-indigo-600" label="You" />
        </div>
      </div>

      {/* Seating Grid */}
      <div 
        className="grid gap-2.5" 
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {grid}
      </div>

      {/* Directional Indicator */}
      <div className="pt-2">
        <div className="bg-slate-900 py-2 rounded-xl">
          <p className="text-[8px] font-black text-white text-center uppercase tracking-[0.4em]">
            EXAMINER TABLE / ENTRANCE
          </p>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 ${color} rounded-full`}></div>
    <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter">{label}</span>
  </div>
);

export default DigitalTwinGrid;