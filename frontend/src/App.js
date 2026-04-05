import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Sidebar from './components/sidebar'; 
import UploadHub from './pages/Admin/UploadHub';
import Analytics from './pages/Admin/Analytics';
import RoomEditor from './pages/Admin/RoomEditor'; 
import StudentDashboard from './pages/Student/StudentDashboard';
import MasterSeatingPDF from './pages/Admin/MasterSeatingPDF';

/**
 * AdminLayout: The "Gatekeeper" for the Optimization Hub.
 * Provides consistent Sidebar and branding for all Admin pages.
 */
const AdminLayout = ({ children }) => (
  <div className="flex bg-[#F8FAFC] min-h-screen text-slate-900 selection:bg-indigo-100">
    <Sidebar /> 
    <main className="flex-1 overflow-y-auto relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 p-6 md:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-[2px] w-8 bg-indigo-600"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Nagpur Smart City / Optimization Hub
          </span>
        </div>
        {children}
      </div>
    </main>
  </div>
);

function App() {
  // We use state for the role to ensure the UI updates immediately on login/logout
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  // Listen for changes in localStorage (Triggered by Login.js window.location.href)
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="antialiased font-sans text-slate-900 bg-[#F8FAFC]">
        <Routes>
          {/* --- PUBLIC ACCESS --- */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* --- STUDENT WORLD --- */}
          <Route 
            path="/student/dashboard" 
            element={
              userRole === 'student' 
                ? <StudentDashboard /> 
                : <Navigate to="/login" replace />
            } 
          />

          {/* --- ADMIN WORLD (Wrapped in AdminLayout) --- */}
          <Route 
            path="/admin/dashboard" 
            element={
              userRole === 'admin' 
                ? <AdminLayout><RoomEditor /></AdminLayout> 
                : <Navigate to="/login" replace />
            } 
          />

          <Route 
            path="/admin/upload" 
            element={
              userRole === 'admin' 
                ? <AdminLayout><UploadHub /></AdminLayout> 
                : <Navigate to="/login" replace />
            } 
          />
          
          <Route 
            path="/admin/analytics" 
            element={
              userRole === 'admin' 
                ? <AdminLayout><Analytics /></AdminLayout> 
                : <Navigate to="/login" replace />
            } 
          />

          {/* --- MASTER REPORT (Full Screen View) --- */}
          <Route 
            path="/admin/reports" 
            element={
              userRole === 'admin' 
                ? <MasterSeatingPDF /> 
                : <Navigate to="/login" replace />
            } 
          />

          {/* Security Fallback: If no route matches, go to Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;