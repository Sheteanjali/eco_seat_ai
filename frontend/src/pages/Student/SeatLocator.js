import React from 'react';

import { QRCodeSVG } from 'qrcode.react'; // Standard library for QR generation
import DigitalTwinGrid from '../../components/DigitalTwinGrid';

const SeatLocator = ({ assignment }) => {
  // Logic to calculate seat coordinates from the label (e.g., A12 -> Row 0, Col 11)
  const mySeatId = `${assignment.row}-${assignment.col}`;

  return (
    <div className="p-8 bg-white max-w-2xl mx-auto rounded-3xl shadow-2xl mt-10">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-slate-700">Scan for Hall Entry</h3>
        <p className="text-sm text-slate-400">Show this QR to the invigilator at the entrance</p>
      </div>

      {/* QR-Integrated Access Slip */}
      <div className="flex justify-center bg-slate-100 p-6 rounded-2xl mb-8">
        <QRCodeSVG 
          value={assignment.qr_code_data} 
          size={180} 
          level={"H"} 
          includeMargin={true} 
        />
      </div>

      <div className="mt-6">
        <h4 className="font-bold text-slate-800 mb-4">Your Seat Location (Visual Guide)</h4>
        {/* High-fidelity 2D visualization with the student's seat highlighted */}
        <div className="border-2 border-slate-100 rounded-xl overflow-hidden p-2">
          <DigitalTwinGrid 
            rows={15} 
            cols={20} 
            blockedSeats={[mySeatId]} // In this view, we highlight the student's seat as "blocked/red"
            interactive={false}
          />
        </div>
        <p className="mt-4 text-xs text-center text-slate-400">
          Teacher's Desk (Front of Hall) is at the top of the grid.
        </p>
      </div>
    </div>
  );
};

export default SeatLocator;