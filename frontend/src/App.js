import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Sidebar from './components/sidebar'; 
import UploadHub from './pages/Admin/UploadHub';
import Analytics from './pages/Admin/Analytics';
import RoomEditor from './pages/Admin/RoomEditor'; 
import StudentDashboard from './pages/Student/StudentDashboard';
import MasterSeatingPDF from './pages/Admin/MasterSeatingPDF';
import VerifyScan from './pages/Admin/VerifyScan';

const AdminLayout = ({ children }) => (
  <div className="flex bg-slate-50 min-h-screen text-slate-900 selection:bg-indigo-100 font-sans">
    <Sidebar /> 
    <main className="flex-1 overflow-y-auto relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="relative z-10 p-8 md:p-12">
        <div className="mb-10 flex items-center gap-4">
          <div className="h-px w-10 bg-indigo-200"></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            System Operations / Infrastructure Node
          </span>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </div>
    </main>
  </div>
);

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  useEffect(() => {
    const handleStorageChange = () => {
      setUserRole(localStorage.getItem('userRole'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="antialiased text-slate-900 bg-slate-50">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/student/dashboard" element={userRole === 'student' ? <StudentDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/admin/dashboard" element={userRole === 'admin' ? <AdminLayout><RoomEditor /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin/upload" element={userRole === 'admin' ? <AdminLayout><UploadHub /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin/analytics" element={userRole === 'admin' ? <AdminLayout><Analytics /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin/verify-scan" element={userRole === 'admin' ? <AdminLayout><VerifyScan /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin/reports" element={userRole === 'admin' ? <MasterSeatingPDF /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;