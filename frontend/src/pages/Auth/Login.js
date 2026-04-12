import React, { useState } from 'react';
import { ShieldCheck, User, Key, ArrowRight, Sparkles, Loader2, AlertCircle, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    rollNo: '',
    secretKey: '', 
    role: 'student'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Backend synchronization point
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.rollNo,
          password: formData.secretKey, 
          role: formData.role
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Secure Session Persistence
        localStorage.setItem('userRollNo', data.roll_no || formData.rollNo);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.username || 'Candidate');
        localStorage.setItem('isLoggedIn', 'true');

        // Route Authorization
        if (data.role === 'admin') {
          navigate('/admin/dashboard'); 
        } else {
          navigate('/student/dashboard');
        }
      } else {
        // Context-aware error reporting
        setError(data.detail || "Authentication Failed: Please verify credentials.");
      }
    } catch (err) {
      setError("Connection Failure: Authorization server is currently unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      
      {/* Ambient Visual Layers */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-indigo-200 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-blue-200 blur-[140px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-[440px] p-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-200/60 p-10 md:p-12">
          
          {/* Brand Identity */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200/50 mb-6 transition-transform hover:scale-105 duration-300">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">
              Eco-Seat <span className="text-indigo-600">AI</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-px w-4 bg-slate-200"></div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em]">
                Secure Entry Portal
              </p>
              <div className="h-px w-4 bg-slate-200"></div>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            
            {/* Identity Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Identifier</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-semibold placeholder:text-slate-300" 
                  placeholder="ID / Roll Number"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Secret Key Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-semibold placeholder:text-slate-300" 
                  placeholder="Security Key" 
                  value={formData.secretKey}
                  onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Authorization Level */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorization Node</label>
              <div className="relative group">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-10 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="student">Candidate Registry</option>
                  <option value="admin">System Console</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>

            {/* Notification Hub */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[11px] font-bold leading-tight">{error}</p>
              </div>
            )}

            {/* Submission Action */}
            <button 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.97] uppercase text-[11px] tracking-[0.2em] mt-2 group"
            >
              {isLoading ? (
                <>Synchronizing <Loader2 size={18} className="animate-spin text-white/50" /></>
              ) : (
                <>Initialize Session <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Infrastructure Signature */}
          <div className="mt-10 flex flex-col items-center border-t border-slate-50 pt-8">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-indigo-400 animate-pulse" />
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em]">
                Decentralized Deployment Unit
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;