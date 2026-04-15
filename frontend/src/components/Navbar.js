import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Map, UserCircle, LogOut, Zap } from 'lucide-react';

const Navbar = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="flex justify-between items-center px-10 py-5 bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/80">
      
      {/* BRANDING: Times New Roman for Official Identity */}
      <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-transform">
          <Zap size={20} className="text-white fill-white" />
        </div>
        <div>
          <h1 className="font-black text-xl text-slate-900 tracking-tighter uppercase" style={{ fontFamily: '"Times New Roman", serif' }}>
            Eco-Seat <span className="text-indigo-600">AI</span>
          </h1>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] -mt-1">Operational Node</p>
        </div>
      </div>

      {/* NAVIGATION LINKS */}
      <div className="hidden md:flex items-center space-x-2">
        {userRole === 'admin' ? (
          <>
            <NavLink to="/admin/analytics" label="Analytics" icon={<LayoutDashboard size={14} />} active={isActive('/admin/analytics')} />
            <NavLink to="/admin/upload" label="Optimization" icon={<Database size={14} />} active={isActive('/admin/upload')} />
            <NavLink to="/admin/map" label="Digital Twin" icon={<Map size={14} />} active={isActive('/admin/map')} />
          </>
        ) : (
          <NavLink to="/student/seat" label="My Entry Pass" icon={<UserCircle size={14} />} active={isActive('/student/seat')} />
        )}
      </div>

      {/* ACTION AREA */}
      <div className="flex items-center gap-6">
        <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
        <button 
          onClick={() => navigate('/login')} 
          className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-black text-[10px] uppercase tracking-widest transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};

// Internal Helper for Nav Styling
const NavLink = ({ to, label, icon, active }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active 
        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 translate-y-[-1px]' 
        : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
    }`}
  >
    {icon} {label}
  </Link>
);

export default Navbar;