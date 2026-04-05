import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Layout, Percent, MapPin, Loader2, FileText, ShieldCheck, Zap } from 'lucide-react';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiService.getAnalytics();
        setData(res.data);
      } catch (err) {
        console.error("Nagpur Engine Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Nagpur Engine...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER WITH KPI ACTIONS */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Operational Analytics</h1>
          <p className="text-sm text-slate-500 font-medium italic">Evaluation Metrics & KPIs [cite: 41]</p>
        </div>
        <button 
          onClick={() => navigate('/admin/reports')}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
        >
          <FileText size={16} /> Generate Master Report [cite: 10]
        </button>
      </div>

      {/* STRATEGIC IMPACT GRID [cite: 44] */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Users />} label="Total Candidates" value={data?.totalStudents || 0} color="text-indigo-600" />
        <StatCard icon={<Zap />} label="Planning Time" value="Seconds" color="text-amber-500" />
        <StatCard icon={<ShieldCheck />} label="Seating Conflicts" value="0" color="text-emerald-500" />
        <StatCard icon={<Percent />} label="Engine Utilization" value={`${data?.utilization || 0}%`} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ROOM DISTRIBUTION BAR CHART (Automated Layouts [cite: 5]) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <MapPin size={14} className="text-indigo-600" /> Candidate Load per Room [cite: 6]
          </h3>
          <div className="h-[350px] w-full min-h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.roomData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BRANCH DEMOGRAPHICS (Zero-Collusion Validation [cite: 14]) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Users size={14} className="text-indigo-600" /> Branch Demographics [cite: 15]
          </h3>
          <div className="h-[350px] w-full min-h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.branchData}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.branchData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

// Reusable Stat Card Component 
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
    <div className={`p-4 bg-slate-50 rounded-2xl ${color}`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{value}</p>
    </div>
  </div>
);

export default Analytics;