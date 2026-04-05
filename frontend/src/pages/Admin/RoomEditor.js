import React, { useState } from 'react';
import { Zap, LayoutGrid, MousePointer2, CheckCircle, ShieldCheck } from 'lucide-react';
import DigitalTwinGrid from '../../components/DigitalTwinGrid';
import apiService from '../../services/api'; // Integrated with Python Backend

const RoomEditor = () => {
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [status, setStatus] = useState('idle');

  const runSolver = async () => {
    setStatus('solving');
    try {
      // Logic: Triggering AI-Based Constraint Modeling [cite: 1]
      // Passes blocked seats as hard constraints to the Recursive Search [cite: 26]
      const response = await apiService.initiateConstraintSolver({
        roomId: "A-101",
        blockedVariables: blockedSeats 
      });
      
      if (response.status === 'success') {
        setStatus('success');
      }
    } catch (error) {
      console.error("CSP Solver Error: Constraints could not be satisfied.");
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          {/* Proposed Solution: Eco-Seat AI [cite: 2] */}
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">
            Digital Twin <span className="text-indigo-600">Mapping</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide">
            Interactive Variable Modeling: Hall A-101 [cite: 3, 30]
          </p>
        </div>
        <button 
          onClick={runSolver}
          disabled={status === 'solving'}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
        >
          {status === 'solving' ? 'Backtracking...' : 'Initiate AI Solver'} <Zap size={14} />
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 overflow-hidden relative">
        <div className="mb-8 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <MousePointer2 size={12} className="text-indigo-600"/> Mark Unusable Seats (Pillars/Broken Benches) [cite: 31]
            </span>
            {status === 'success' && (
              <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                <ShieldCheck size={14}/> Conflict-Free Plan Verified [cite: 13]
              </span>
            )}
        </div>
        
        {/* Seats are treated as variables in the CSP model [cite: 3] */}
        <DigitalTwinGrid 
          rows={10} 
          cols={15} 
          blockedSeats={blockedSeats} 
          onToggleSeat={(id) => {
            // Real-time Adaptation to room changes [cite: 7]
            setBlockedSeats(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
            setStatus('idle');
          }} 
          interactive={true}
        />
        
        <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-8">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Variable</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate Assigned</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Constraint Block (Broken) [cite: 6]</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RoomEditor;