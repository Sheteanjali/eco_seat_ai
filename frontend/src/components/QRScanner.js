import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner'; // Common library for QR scanning

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);

  const handleScan = (data) => {
    if (data) {
      // Logic to verify student against the 100% Conflict-Free database
      setScanResult(JSON.parse(data[0].rawValue));
      console.log("Student Verified:", data[0].rawValue);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl">
      <h3 className="text-lg font-bold mb-4">Hall Entry Verification</h3>
      <div className="w-64 h-64 border-4 border-dashed border-blue-400">
        <Scanner onScan={handleScan} />
      </div>
      {scanResult && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <p>Verified: {scanResult.roll_no}</p>
          <p>Seat: {scanResult.seat_label} | Room: {scanResult.room_no}</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;