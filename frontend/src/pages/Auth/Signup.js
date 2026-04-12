import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, BookOpen, Lock, ArrowRight, Sparkles, User, GraduationCap, Fingerprint } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      
      {/* Soft Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200 blur-[120px] rounded-full"></div>
      </div>

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-2xl p-6">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200/60 p-8 md:p-12">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-12 text-center md:text-left">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <UserPlus className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Account <span className="text-indigo-600">Activation</span>
              </h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center justify-center md:justify-start gap-2">
                <Sparkles size={12} className="text-indigo-400" /> 
                System Enrollment Protocol
              </p>
            </div>
          </div>
          
          {/* Registration Form Grid */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Legal Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-semibold" 
                  placeholder="e.g. Anjali Sharma" 
                />
              </div>
            </div>

            {/* Roll Number */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Official ID / Roll No</label>
              <div className="relative group">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-semibold" 
                  placeholder="2026CS1001" 
                />
              </div>
            </div>
            
            {/* Academic Branch */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Academic Department</label>
              <div className="relative group">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={18} />
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer appearance-none">
                  <option>Computer Science</option>
                  <option>Cybersecurity</option>
                  <option>AI & Machine Learning</option>
                  <option>Information Technology</option>
                </select>
              </div>
            </div>

            {/* Course Code */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Assigned Course Code</label>
              <div className="relative group">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-semibold" 
                  placeholder="CS401" 
                />
              </div>
            </div>

            {/* Secret Key Creation */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Establish Security Key (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-semibold" 
                  placeholder="••••••••••••" 
                />
              </div>
            </div>

            {/* Action Button */}
            <button className="md:col-span-2 mt-4 w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-3 transform active:scale-[0.98] transition-all tracking-widest text-xs uppercase">
              Activate Registry <ArrowRight size={18} />
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
              Existing member of the network? 
              <button 
                onClick={() => navigate('/login')} 
                className="ml-2 text-indigo-600 font-black hover:text-slate-900 transition-colors underline underline-offset-4"
              >
                Sign In
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;