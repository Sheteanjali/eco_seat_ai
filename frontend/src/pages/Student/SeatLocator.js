import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import DigitalTwinGrid from '../../components/DigitalTwinGrid';

const SeatLocator = ({ assignment }) => {
  // Safely resolve row and column indices (handles 0-indexed values properly)
  const row = typeof assignment?.row === 'number' ? assignment.row : 0;
  const col = typeof assignment?.col === 'number' ? assignment.col : 0;
  
  // Format Seat ID (e.g., "0-0" or explicit string like "R2C3")
  const seatNo = assignment?.seat_no || `${row}-${col}`;
  const mySeatId = `${row}-${col}`;

  // Fallbacks for Grid Dimensions
  const totalRows = assignment?.total_rows ?? assignment?.room_rows ?? 15;
  const totalCols = assignment?.total_cols ?? assignment?.room_cols ?? 20;

  // QR Code payload safety check
  const qrData = assignment?.qr_code_data || assignment?.qr_code || seatNo || "INVALID_TICKET";

  return (
    <div className="p-8 bg-white max-w-2xl mx-auto rounded-3xl shadow-2xl mt-10 border border-slate-100 print:shadow-none print:border-none">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 font-bold text-[10px] uppercase tracking-widest rounded-full mb-2">
          Seat Verification Badge
        </span>
        <h3 className="text-xl font-bold text-slate-800">Scan for Hall Entry</h3>
        <p className="text-sm text-slate-400 mt-1">
          Show this QR code to the invigilator at the examination door
        </p>
      </div>

      {/* QR-INTEGRATED ACCESS SLIP */}
      <div className="flex flex-col items-center bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-4">
          <QRCodeSVG 
            value={qrData} 
            size={180} 
            level="H" 
            includeMargin={true}
          />
        </div>
        
        {/* Quick Reference Metadata */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Assigned Seat</p>
            <p className="text-lg font-black text-indigo-600 tracking-tight">{seatNo}</p>
          </div>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Hall / Room</p>
            <p className="text-lg font-black text-slate-800 tracking-tight">{assignment?.room_no || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* SPATIAL SEAT MAP VISUALIZER */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-800 text-sm">Your Seat Location (Visual Guide)</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Grid: {totalRows} × {totalCols}
          </span>
        </div>
        
        {/* Podium Indicator */}
        <div className="w-full bg-slate-200/70 text-slate-600 font-bold text-[9px] uppercase tracking-widest py-1 rounded-t-lg text-center border-b border-slate-300">
          Invigilator Desk / Front Stage
        </div>

        {/* High-fidelity 2D visualization with student's seat highlighted */}
        <div className="border-2 border-slate-100 rounded-b-xl overflow-hidden p-3 bg-white">
          <DigitalTwinGrid 
            rows={totalRows} 
            cols={totalCols} 
            blockedSeats={[mySeatId]} // Highlights the student's assigned seat
            interactive={false}
          />
        </div>
        
        <p className="mt-4 text-xs text-center text-slate-400 italic">
          Orientation: Facing forward toward the instructor's desk at the top.
        </p>
      </div>

    </div>
  );
};

export default SeatLocator;