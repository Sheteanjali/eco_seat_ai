import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ShieldCheck, AlertOctagon, UserCheck, MapPin, Loader2, RefreshCcw } from 'lucide-react';
import axios from 'axios';

const QRScanner = ({ currentRoom = "DT-101" }) => {
  const [scanData, setScanData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleScan = async (data) => {
    if (!data || status === 'verifying') return;

    setStatus('verifying');
    try {
      // 1. Parse RBU QR Protocol: "RBU|RollNo|PaperGroup|RoomID"
      const rawValue = data[0].rawValue;
      const [prefix, rollno, paperGroup, assignedRoom] = rawValue.split('|');

      // 2. Front-End Pre-Verification (Correct Hall Check)
      if (assignedRoom !== currentRoom) {
        throw new Error(`WRONG HALL: Assigned to ${assignedRoom}`);
      }

      // 3. Backend Verification & Attendance Marking
      const response = await axios.post('http://127.0.0.1:8000/api/admin/attendance/verify-scan', {
        rollno: rollno,
        room_no: currentRoom,
        admin_id: "ADMIN_NODE_01"
      });

      if (response.data.status === "Success") {
        setScanData(response.data);
        setStatus('success');
        // Auto-reset after 3 seconds for next student
        setTimeout(() => { setStatus('idle'); setScanData(null); }, 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      
      {/* SCANNER HEADER */}
      <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter italic">Entry <span className="text-indigo-400">Scanner</span></h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
            <MapPin size={10} className="text-indigo-400"/> Current Node: {currentRoom}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${status === 'verifying' ? 'animate-spin' : ''}`}>
            <RefreshCcw size={18} className="text-slate-500" />
        </div>
      </div>

      {/* SCANNER VIEWPORT */}
      <div className="p-6 relative">
        <div className={`relative rounded-3xl overflow-hidden border-4 transition-all duration-300 ${
            status === 'success' ? 'border-emerald-500' : status === 'error' ? 'border-rose-500' : 'border-slate-100'
        }`}>
          <Scanner onScan={handleScan} />
          
          {/* OVERLAYS */}
          {status === 'verifying' && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="text-white animate-spin" size={40} />
            </div>
          )}
        </div>
      </div>

      {/* FEEDBACK MODULE */}
      <div className="p-8 pt-0 text-center">
        {status === 'idle' && (
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ready for Verification...</p>
        )}

        {status === 'success' && (
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 animate-in zoom-in">
            <UserCheck className="mx-auto text-emerald-500 mb-2" size={32} />
            <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">{scanData.student_name}</p>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Verified: Seat {scanData.seat_assigned}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 animate-in shake duration-300">
            <AlertOctagon className="mx-auto text-rose-500 mb-2" size={32} />
            <p className="text-xs font-black text-rose-600 uppercase tracking-widest">{errorMsg}</p>
            <button onClick={() => setStatus('idle')} className="mt-4 text-[9px] font-black text-slate-400 uppercase underline">Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;