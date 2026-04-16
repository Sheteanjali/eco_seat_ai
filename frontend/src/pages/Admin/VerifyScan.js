import React, { useState, useEffect } from 'react';
import {
  QrCode, Loader2, UserCheck, AlertCircle,
  Lock, Smartphone, CheckCircle2, Clock, ShieldAlert
} from 'lucide-react';
import axios from 'axios';

const VerifyScan = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // ✅ Authorization check
  useEffect(() => {
    const token = localStorage.getItem('RBU_DEVICE_KEY');
    if (token === 'RBU_ADMIN_SECURE_TOKEN_2026') {
      setIsAuthorized(true);
    }
  }, []);

  // ✅ Demo enrollment
  const enrollDevice = () => {
    localStorage.setItem('RBU_DEVICE_KEY', 'RBU_ADMIN_SECURE_TOKEN_2026');
    setIsAuthorized(true);
    alert("Device Enrolled");
  };

  // ✅ Error handler
  const getErrorMessage = () => {
    const msg = scanResult?.message;
    if (!msg) return "Unknown Error";

    if (Array.isArray(msg)) return msg[0]?.msg || "Invalid Input";
    if (typeof msg === 'object') return msg.detail || JSON.stringify(msg);

    return msg;
  };

  // 🔥 FINAL VERIFIED FUNCTION
  const handleVerify = async (qrContent) => {
    if (!qrContent || typeof qrContent !== 'string') return;

    const cleanedQR = String(qrContent).trim();

    console.log("Sending QR:", cleanedQR); // 🔍 debug

    setLoading(true);
    setScanResult(null);

    const deviceToken = localStorage.getItem('RBU_DEVICE_KEY');

    try {
      const res = await axios({
        method: "post",
        url: "http://127.0.0.1:8000/api/admin/attendance/verify-scan",
        data: {
          qr_data: cleanedQR
        },
        headers: {
          Authorization: deviceToken,
          "Content-Type": "application/json"
        }
      });

      setScanResult({ success: true, ...res.data });
      setManualQR('');

    } catch (err) {
      console.log("ERROR:", err.response?.data);

      setScanResult({
        success: false,
        message: err.response?.data?.detail || err.response?.data || "Connection Error"
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-6 pb-20 px-6">

      {/* AUTH BAR */}
      <div className="flex justify-between items-center mb-6 bg-slate-900 p-4 rounded-xl text-white">
        <div className="flex items-center gap-2">
          {isAuthorized ? <Smartphone size={16}/> : <ShieldAlert size={16}/>}
          <span>{isAuthorized ? "Authorized Terminal" : "Unauthorized Device"}</span>
        </div>

        {!isAuthorized ? (
          <button onClick={enrollDevice} className="bg-indigo-600 px-3 py-1 rounded">
            Enroll
          </button>
        ) : (
          <span className="text-green-400 text-sm">Active</span>
        )}
      </div>

      {/* MAIN CARD */}
      <div className="bg-white p-10 rounded-3xl text-center shadow-xl">

        <QrCode size={50} className="mx-auto mb-6 text-indigo-600" />

        <input
          type="text"
          placeholder="Scan QR or Enter Roll..."
          value={manualQR}
          onChange={(e) => setManualQR(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify(manualQR)}
          className="w-full p-4 border rounded-xl mb-4"
        />

        <button
          onClick={() => handleVerify(manualQR)}
          disabled={!manualQR || loading}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center mx-auto"
        >
          {loading ? <Loader2 className="animate-spin" /> : <UserCheck />}
        </button>

        {/* RESULT */}
        {scanResult && (
          <div className={`mt-6 p-6 rounded-xl ${scanResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            {scanResult.success ? (
              <>
                <CheckCircle2 className="mx-auto text-green-600 mb-2" />
                <p className="font-bold">{scanResult.name}</p>
                <p>Room: {scanResult.room}</p>
                <p>Seat: {scanResult.seat}</p>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto text-red-600 mb-2" />
                <p>{getErrorMessage()}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-4 text-center text-sm flex justify-center gap-4">
        <span className="flex items-center gap-1"><Lock size={12}/> Secure</span>
        <span className="flex items-center gap-1"><Clock size={12}/> {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default VerifyScan;