import React, { useState } from 'react';
import { ShieldCheck, User, Key, ArrowRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    rollNo: '',
    secretKey: '', // This will now be compared against the 'Branch' in the backend
    role: 'student'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // --- DYNAMIC BACKEND CONNECTION ---
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.rollNo,
          password: formData.secretKey, // Sent to backend to check against student.branch
          role: formData.role
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // --- SESSION PERSISTENCE ---
        localStorage.setItem('userRollNo', data.roll_no || formData.rollNo);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.username || 'Candidate');
        localStorage.setItem('isLoggedIn', 'true');

        // --- DYNAMIC REDIRECT ---
        if (data.role === 'admin') {
          console.log("Nagpur Division: Admin Authorized");
          navigate('/admin/dashboard'); 
        } else {
          console.log("Nagpur Division: Candidate Authorized");
          navigate('/student/dashboard');
        }
      } else {
        // Specific error if student isn't found or branch is wrong
        setError(data.detail || "Verification Failed: Check Identity or Key");
      }
    } catch (err) {
      console.error("Network Error:", err);
      setError("System Offline: Check Backend Connection");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden font-sans">
      
      {/* Visual Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10">
          
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 mb-6">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Eco-Seat <span className="text-indigo-600">AI</span></h1>
            <p className="text-slate-500 mt-2 font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
              <Sparkles size={12} className="text-indigo-500" /> Nagpur Smart City Node
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Identity */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity (Roll No)</label>
              <div className="relative group">
                <User className="absolute left-4 top-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold" 
                  placeholder="e.g. 101 or admin"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Secret Key (Linked to Branch) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Key (Your Branch)</label>
              <div className="relative group">
                <Key className="absolute left-4 top-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold" 
                  placeholder="e.g. CSE or ME" 
                  value={formData.secretKey}
                  onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Portal Access Level</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-indigo-600 font-black outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm appearance-none"
              >
                <option value="student">Student Portal</option>
                <option value="admin">Admin Dashboard</option>
              </select>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-red-600 border border-red-100 animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            {/* Action Button */}
            <button 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transform active:scale-[0.98] transition-all tracking-widest text-xs uppercase"
            >
              {isLoading ? (
                <>Verifying Identity <Loader2 size={18} className="animate-spin" /></>
              ) : (
                <>Initiate Secure Access <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              Nagpur Division <span className="text-indigo-600">Secure Node</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;