import React, { useState, useEffect } from 'react';
import {
  QrCode, Loader2, UserCheck, AlertCircle,
  Lock, Smartphone, CheckCircle2, Clock, ShieldAlert
} from 'lucide-react';
import axios from 'axios';

const VerifyScan = () => {
  // 1. All States Defined Properly
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 2. Authorization check
  useEffect(() => {
    const token = localStorage.getItem('RBU_DEVICE_KEY');
    if (token === 'RBU_ADMIN_SECURE_TOKEN_2026') {
      setIsAuthorized(true);
    }
  }, []);

  // 3. Device Enrollment
  const enrollDevice = () => {
    localStorage.setItem('RBU_DEVICE_KEY', 'RBU_ADMIN_SECURE_TOKEN_2026');
    setIsAuthorized(true);
    alert("Device Enrolled Successfully!");
  };

  // 4. Error Message Helper
  const getErrorMessage = () => {
    const msg = scanResult?.message;
    if (!msg) return "Identity Not Found";
    if (typeof msg === 'object') return msg.detail || "Invalid Data";
    return msg;
  };

  // 5. Verification Logic
  const handleVerify = async (qrContent) => {
    if (!qrContent) return;
    
    setLoading(true);
    setScanResult(null);

    const deviceToken = localStorage.getItem('RBU_DEVICE_KEY');

    try {
      const res = await axios({
        method: "post",
        url: "http://127.0.0.1:8000/api/admin/attendance/verify-scan",
        data: { qr_data: String(qrContent).trim() },
        headers: { 
          Authorization: deviceToken,
          "Content-Type": "application/json"
        }
      });

      setScanResult({ success: true, ...res.data });
      setManualQR(''); 

    } catch (err) {
      setScanResult({
        success: false,
        message: err.response?.data?.detail || "Connection Error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-10 pb-20 px-6">
      {/* AUTH STATUS BAR */}
      <div className={`flex justify-between items-center mb-8 p-4 rounded-2xl border ${isAuthorized ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-900 text-white border-slate-800'}`}>
        <div className="flex items-center gap-3">
          {isAuthorized ? <Smartphone size={18} className="text-emerald-600"/> : <ShieldAlert size={18} className="text-rose-500"/>}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isAuthorized ? "Authorized Terminal Active" : "Unauthorized Device"}
          </span>
        </div>

        {!isAuthorized && (
          <button onClick={enrollDevice} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">
            Enroll Device
          </button>
        )}
      </div>

      {/* SEARCH CARD */}
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
           <QrCode size={40} />
        </div>

        <h2 className="text-2xl font-black text-slate-900 uppercase italic mb-2">Gate <span className="text-indigo-600">Verification</span></h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-10">Scan Student QR or Enter Roll No</p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="WAITING FOR SIGNAL..."
            value={manualQR}
            onChange={(e) => setManualQR(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify(manualQR)}
            className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-2xl font-black text-center text-indigo-600 tracking-widest focus:border-indigo-500 focus:outline-none transition-all uppercase"
          />

          <button
            onClick={() => handleVerify(manualQR)}
            disabled={!manualQR || loading}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : <UserCheck size={18}/>}
            {loading ? "Verifying..." : "Verify Identity"}
          </button>
        </div>

        {/* RESULT SECTION */}
        {scanResult && (
          <div className={`mt-10 p-8 rounded-[2rem] border-2 animate-in zoom-in duration-300 ${scanResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            {scanResult.success ? (
              <div className="text-center">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-black text-slate-800 uppercase">{scanResult.name}</h3>
                <div className="flex justify-center gap-4 mt-6">
                  <div className="text-left bg-white px-5 py-3 rounded-2xl shadow-sm border border-emerald-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Room</p>
                    <p className="text-sm font-black text-slate-900">{scanResult.room}</p>
                  </div>
                  <div className="text-left bg-white px-5 py-3 rounded-2xl shadow-sm border border-emerald-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Seat</p>
                    <p className="text-sm font-black text-slate-900">{scanResult.seat}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-rose-600">
                <ShieldAlert size={48} className="mx-auto mb-4" />
                <p className="font-black text-[10px] uppercase tracking-widest">{getErrorMessage()}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER STATS */}
      <div className="mt-8 flex justify-center gap-8 text-slate-400">
        <div className="flex items-center gap-2">
          <Lock size={14}/>
          <span className="text-[9px] font-black uppercase tracking-widest">AES-256 Encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14}/>
          <span className="text-[9px] font-black uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

// ❗ YE SABSE ZAROORI HAI: Export karna mat bhoolna
export default VerifyScan;