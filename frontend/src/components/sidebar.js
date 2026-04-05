import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  BarChart3, 
  LogOut,
  ShieldCheck,
  Clock,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import apiService from '../services/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock for the Nagpur Portal
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', label: 'Visual Grid' },
    { name: 'Upload Hub', icon: UploadCloud, path: '/admin/upload', label: 'Data Ingestion' },
    { name: 'Analytics', icon: BarChart3, path: '/admin/analytics', label: 'AI Insights' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleReset = async () => {
    if (window.confirm("CRITICAL: Wipe seating data and unlock the engine?")) {
      try {
        await apiService.resetEngine();
        window.location.reload(); 
      } catch (err) {
        alert("Reset failed. Engine is currently busy.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className="h-screen w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 z-50 shadow-sm">
      
      {/* Branding Section */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight italic">
            Eco-Seat <span className="text-indigo-600">AI</span>
          </h1>
        </div>
        
        {/* LIVE CLOCK WIDGET (Light Version) */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 text-indigo-600">
            <Clock size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">NGP Time</span>
          </div>
          <span className="text-sm font-mono font-bold text-slate-700 tracking-widest">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`
              w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold transition-all group
              ${isActive(item.path) 
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
            `}
          >
            <div className="flex items-center gap-4">
              <span className={isActive(item.path) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'}>
                <item.icon size={20} />
              </span>
              <div className="text-left">
                <p className="text-sm tracking-tight">{item.name}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest ${isActive(item.path) ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {item.label}
                </p>
              </div>
            </div>
            {isActive(item.path) && <ChevronRight size={14} className="text-indigo-300" />}
          </button>
        ))}
      </nav>

      {/* Bottom Profile & Reset Controls */}
      <div className="p-6 mt-auto border-t border-slate-100 space-y-4">
        
        {/* Reset Engine (Safe Light Action) */}
        <button 
          onClick={handleReset}
          className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 font-bold hover:text-amber-600 transition-colors text-[10px] uppercase tracking-[0.2em] group"
        >
          <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
          Reset Seating Grid
        </button>

        {/* Admin Profile Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 border-2 border-white rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm">
            AD
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 uppercase">Administrator</p>
            <p className="text-[10px] text-slate-500 font-bold italic">Nagpur Division</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-2xl border border-slate-200 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <LogOut size={16} /> Terminate Access
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;