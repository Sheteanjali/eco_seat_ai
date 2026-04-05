import React from 'react';

const DigitalTwinGrid = ({ rows, cols, blockedSeats, onToggleSeat, interactive }) => {
  const seats = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `${String.fromCharCode(65 + r)}${c + 1}`; // e.g., A1, B2
      const isBlocked = blockedSeats.includes(id);

      seats.push(
        <div
          key={id}
          onClick={() => interactive && onToggleSeat(id)}
          className={`
            aspect-square rounded-lg border flex items-center justify-center text-[8px] font-bold transition-all cursor-pointer
            ${isBlocked 
              ? 'bg-rose-500/40 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)] text-rose-100' 
              : 'bg-indigo-500/5 border-white/5 text-slate-500 hover:border-indigo-500/50 hover:bg-indigo-500/10'}
          `}
        >
          {id}
        </div>
      );
    }
  }

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {seats}
    </div>
  );
};

export default DigitalTwinGrid;