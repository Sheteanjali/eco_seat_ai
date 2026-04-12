import React from 'react';

/**
 * DigitalTwinGrid: Specialized Spatial Mapping Node.
 * Font: Bahnschrift (Technical UI) & Times New Roman (Official Branding).
 */
const DigitalTwinGrid = ({ occupiedSeats = [], userSeat, rows = 12, cols = 5 }) => {
  
  const grid = [];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const currentId = `R${r}C${c}`;
      const isUser = currentId === userSeat;
      const occupant = occupiedSeats.find(s => s.seat === currentId);

      grid.push(
        <div
          key={currentId}
          onClick={() => {
            if (occupant) {
              alert(
                `REGISTRY VERIFIED\n------------------\n` +
                `Candidate: ${occupant.name}\n` +
                `Roll Number: ${occupant.roll_no}\n` +
                `Department: ${occupant.branch}\n` +
                `Assigned Seat: ${currentId}`
              );
            }
          }}
          className={`
            aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-500 cursor-pointer
            ${isUser 
              ? 'bg-emerald-500 border-emerald-400 shadow-xl shadow-emerald-100 ring-4 ring-white z-10 scale-110' 
              : occupant 
                ? 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200' 
                : 'bg-slate-50 border-slate-100 border-dashed text-slate-200'}
          `}
        >
          {/* Seat Coordinate Label in Bahnschrift */}
          <span className={`text-[8px] font-bold uppercase mb-0.5 tracking-tighter ${isUser ? 'text-emerald-100' : 'text-slate-300'}`}>
            {currentId}
          </span>
          {isUser && (
            <span className="text-[10px] font-black text-white leading-none uppercase tracking-widest">You</span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-8 h-fit animate-in fade-in slide-in-from-right-4 duration-1000">
      
      {/* Header & Legend (SaaS Style) */}
      <div className="flex justify-between items-start border-b border-slate-50 pb-6">
        <div>
          {/* Official Header in Times New Roman */}
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            Hall Visualization
          </h4>
          {/* Tech Data in Bahnschrift */}
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.15em]">
            Registry Node Capacity: {rows * cols}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Your Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-slate-200 rounded-full"></div>
            <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Occupied</span>
          </div>
        </div>
      </div>

      {/* Seating Grid (Bahnschrift styled via Tailwind) */}
      <div 
        className="grid gap-3" 
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {grid}
      </div>

      {/* Infrastructure Compass */}
      <div className="pt-4">
        <div className="bg-slate-900 py-3 rounded-2xl shadow-lg shadow-slate-200">
          <p className="text-[9px] font-black text-white text-center uppercase tracking-[0.5em] opacity-80">
            Examiner Console / Front
          </p>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinGrid;