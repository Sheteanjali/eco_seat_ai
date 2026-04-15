import React, { useState } from 'react';
import { 
  QrCode, ShieldCheck, Loader2, UserCheck, AlertCircle, 
  Lock, Camera, Smartphone, Fingerprint, CheckCircle2, Clock 
} from 'lucide-react';
import axios from 'axios';

const VerifyScan = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualQR, setManualQR] = useState('');

  const handleVerify = async (qrContent) => {
    if (!qrContent) return;
    setLoading(true);
    setScanResult(null);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/admin/attendance/verify-scan', 
        { qr_data: qrContent },
        { headers: { 'Authorization': 'RBU_ADMIN_SECURE_TOKEN_2026' } }
      );
      setScanResult({ success: true, ...res.data });
      setManualQR('');
    } catch (err) {
      setScanResult({ 
        success: false, 
        message: err.response?.data?.detail || "Verification Failed" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-10 pb-20 px-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between mb-8 bg-slate-900 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl text-white"><Smartphone size={18}/></div>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Authorized Terminal</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-emerald-500 uppercase">Secure Link</span>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-10 text-center relative overflow-hidden">
        <Fingerprint className="absolute -right-10 -top-10 text-slate-50 opacity-10" size={250} />
        <div className="relative z-10">
            <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl ring-8 ring-indigo-50">
              <QrCode className="text-white" size={40} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Verification Portal</h2>
            <div className="space-y-6 max-w-md mx-auto mt-10">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan QR Data..." 
                  className="w-full py-6 px-8 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-500 font-bold text-slate-700"
                  value={manualQR}
                  onChange={(e) => setManualQR(e.target.value)}
                />
                <button 
                  onClick={() => handleVerify(manualQR)}
                  className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 text-white rounded-2xl"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : <UserCheck size={20}/>}
                </button>
              </div>
            </div>

            {scanResult && (
              <div className={`mt-12 p-10 rounded-[2.5rem] border-2 ${scanResult.success ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                {scanResult.success ? (
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="text-emerald-500 mb-4" size={48} />
                    <h4 className="text-2xl font-black text-slate-900 uppercase italic">{scanResult.name}</h4>
                    <div className="mt-4 flex gap-3">
                        <span className="bg-emerald-600 text-white text-[10px] px-4 py-2 rounded-xl font-black">Room {scanResult.room}</span>
                        <span className="bg-slate-900 text-white text-[10px] px-4 py-2 rounded-xl font-black">Seat {scanResult.seat}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <AlertCircle className="text-red-500 mb-4" size={48} />
                    <h4 className="text-lg font-black text-red-700 uppercase">Access Denied</h4>
                    <p className="text-[10px] font-bold text-red-400 mt-2 uppercase">{scanResult.message}</p>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      <div className="mt-10 flex justify-center items-center gap-6 opacity-50">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase"><Lock size={12}/> Encrypted</div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase"><Clock size={12}/> Live Log</div>
      </div>
    </div>
  );
};

export default VerifyScan; // VERY IMPORTANT: Make sure this line exists!