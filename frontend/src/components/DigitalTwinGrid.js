import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, User, CheckCircle2 } from 'lucide-react';

const DigitalTwinGrid = ({ 
  occupiedSeats = [], 
  blockedSeats = [], 
  onToggleSeat,      
  userSeat, 
  rows = 10, 
  cols = 10,
  interactive = false,
  roomNo = "N/A"
}) => {

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.005 }
    }
  };

  const seatVars = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  };

  const renderGrid = () => {
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
          <motion.div
            key={seatId}
            variants={seatVars}
            whileHover={{ scale: 1.1, zIndex: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (interactive && onToggleSeat) onToggleSeat(tableId);
            }}
            className={`
              relative aspect-square rounded-md border flex items-center justify-center 
              transition-all duration-200 cursor-pointer shadow-sm overflow-hidden
              ${isBroken 
                ? 'bg-red-600 border-red-700 text-white shadow-[0_4px_10px_rgba(220,38,38,0.3)]' 
                : occupant && occupant.status === 'Present'
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-500'
              }
            `}
          >
            {/* Table ID Label (T0, T1...) */}
            <span className="text-[7px] font-black tracking-tighter opacity-90 uppercase">
              {tableId}
            </span>

            {/* Overlays for different states */}
            {isBroken && (
               <div className="absolute inset-0 flex items-center justify-center bg-red-600">
                  <AlertTriangle size={12} className="text-white animate-pulse" />
               </div>
            )}

            {occupant?.status === 'Present' && !isBroken && (
               <div className="absolute inset-0 flex items-center justify-center bg-emerald-500">
                  <CheckCircle2 size={12} className="text-white" />
               </div>
            )}

            {isUser && (
               <div className="absolute inset-0 flex items-center justify-center bg-amber-400">
                  <User size={12} className="text-slate-900" />
               </div>
            )}
          </motion.div>
        );
      }
    }
    return grid;
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className="grid gap-2 p-4 bg-slate-100/50 rounded-2xl border border-slate-200" 
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(35px, 1fr))`,
          minWidth: 'fit-content'
        }}
      >
        {renderGrid()}
      </motion.div>
      
      <div className="mt-6 flex gap-10 border-t border-slate-100 pt-4 w-full justify-center">
         <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
           Virtual Node Architecture v2.0
         </div>
      </div>
    </div>
  );
};

export default DigitalTwinGrid;