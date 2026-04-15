import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  LogOut,
  Zap,
  Clock,
  ChevronRight,
  RotateCcw,
  QrCode,
  Map
} from 'lucide-react';
import apiService from '../services/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { name: 'Analytics', icon: BarChart3, path: '/admin/analytics', label: 'Live Presence Feed' },
    { name: 'Optimization', icon: Database, path: '/admin/upload', label: 'Syllabus Logic' },
    { name: 'Digital Twin', icon: Map, path: '/admin/dashboard', label: 'DT-Building Map' }, // Matches your App.js route
    { name: 'Verify Scan', icon: QrCode, path: '/admin/verify-scan', label: 'Admin Entrance Verification' }, // Matches your App.js route
  ];

  const isActive = (path) => location.pathname === path;

  const handleReset = async () => {
    if (window.confirm("CRITICAL: Wipe seating data and clear current attendance logs?")) {
      try {
        await apiService.resetEngine();
        window.location.reload(); 
      } catch (err) {
        alert("Reset failed. Engine is currently busy with a live session.");
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
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
            <Zap size={24} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase" style={{ fontFamily: '"Times New Roman", serif' }}>
              Eco-Seat <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest -mt-1">Operational Hub</p>
          </div>
        </div>
        
        {/* LIVE CLOCK WIDGET */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400">
            <Clock size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">RBU Time</span>
          </div>
          <span className="text-sm font-mono font-bold text-white tracking-widest">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
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
                <p className="text-sm tracking-tight font-black uppercase">{item.name}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${isActive(item.path) ? 'text-indigo-400' : 'text-slate-400'}`}>
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
        <button 
          onClick={handleReset}
          className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 font-bold hover:text-amber-600 transition-colors text-[9px] uppercase tracking-[0.2em] group"
        >
          <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
          Purge Active Logs
        </button>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-rose-600 text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200"
        >
          <LogOut size={16} /> Terminate Access
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;