import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, BookOpen, Lock, ArrowRight, Sparkles, User } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans">
      
      {/* Dynamic Background Glows (Matching Login.js) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 blur-[120px] rounded-full animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/15 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>

      {/* Cyber-Glass Registration Card */}
      <div className="relative z-10 w-full max-w-2xl p-6">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-12">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-12 text-center md:text-left">
            <div className="bg-gradient-to-tr from-indigo-500 to-blue-400 p-4 rounded-2xl shadow-lg shadow-indigo-500/30">
              <UserPlus className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Join Eco-Seat <span className="text-indigo-400">AI</span></h2>
              <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <Sparkles size={14} className="text-indigo-400" /> 
                Nagpur Student Registration Hub
              </p>
            </div>
          </div>
          
          {/* Registration Form Grid */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-7" onSubmit={(e) => e.preventDefault()}>
            
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Anjali Sharma" />
              </div>
            </div>

            {/* Roll Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Roll Number</label>
              <input className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="2026CS1001" />
            </div>
            
            {/* Academic Branch */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Academic Branch</label>
              <select className="w-full bg-slate-900/60 border border-white/5 rounded-2xl p-4 text-indigo-400 font-bold outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none">
                <option className="bg-slate-900">Computer Science</option>
                <option className="bg-slate-900">Cybersecurity</option>
                <option className="bg-slate-900">AI & ML</option>
              </select>
            </div>

            {/* Course Code */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Course Code</label>
              <div className="relative group">
                <BookOpen className="absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input className="w-full pl-12 bg-slate-900/40 border border-white/5 rounded-2xl py-4 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="CS401" />
              </div>
            </div>

            {/* Secret Key Creation */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Create Secret Key (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input type="password" className="w-full pl-12 bg-slate-900/40 border border-white/5 rounded-2xl py-4 pr-4 text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="••••••••" />
              </div>
            </div>

            {/* Action Button */}
            <button className="md:col-span-2 mt-4 w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transform active:scale-[0.98] transition-all tracking-widest text-sm uppercase">
              ACTIVATE ACCOUNT <ArrowRight size={20} />
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 font-medium text-sm">
              Already registered in the grid? 
              <button 
                onClick={() => navigate('/login')} 
                className="ml-2 text-indigo-400 font-black hover:text-indigo-300 transition-colors uppercase text-xs tracking-widest"
              >
                Sign In Now
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;