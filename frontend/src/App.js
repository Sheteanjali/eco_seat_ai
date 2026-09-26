// File: frontend/src/App.js

import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

import Sidebar from './components/sidebar';

import UploadHub from './pages/Admin/UploadHub';
import Analytics from './pages/Admin/Analytics';
import RoomEditor from './pages/Admin/RoomEditor';
import MasterSeatingPDF from './pages/Admin/MasterSeatingPDF';
import VerifyScan from './pages/Admin/VerifyScan';
import AdminRoomsControlHub from './pages/Admin/Rooms';

import StudentDashboard from './pages/Student/StudentDashboard';
import InvigilatorDashboard from './pages/Invigilator/InvigilatorDashboard';

/* ============================================================
   ADMIN APPLICATION LAYOUT
   UI updated only - route logic remains unchanged
============================================================ */

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN APPLICATION AREA */}
      <main className="min-w-0 flex-1">

        {/* DESKTOP WORKSPACE */}
        <div className="min-h-screen">

          {/* SMALL TOP BAR */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur md:px-8 lg:px-10">

            <div className="flex min-w-0 items-center gap-3">

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Examination Management System
                </p>

                <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">
                  Administrative Workspace
                </p>
              </div>

            </div>

            <div className="flex items-center gap-3">

              <div className="hidden items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  System Online
                </span>
              </div>

            </div>

          </header>

          {/* PAGE CONTENT */}
          <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 lg:px-10 lg:py-8">

            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

/* ============================================================
   PROTECTED ROUTE
   Existing authorization logic preserved
============================================================ */

const ProtectedRoute = ({
  userRole,
  allowedRoles,
  children,
}) => {
  const location = useLocation();

  if (!userRole) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'admin') {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    if (userRole === 'invigilator') {
      return (
        <Navigate
          to="/invigilator/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/student/dashboard"
        replace
      />
    );
  }

  return children;
};

/* ============================================================
   APPLICATION
============================================================ */

function App() {
  /* ----------------------------------------------------------
     ROLE RETRIEVAL
     Existing keys preserved
  ---------------------------------------------------------- */

  const getStoredRole = () =>
    localStorage.getItem('userRole') ||
    localStorage.getItem('role');

  const [userRole, setUserRole] =
    useState(getStoredRole());

  /* ----------------------------------------------------------
     AUTH STATE SYNC
  ---------------------------------------------------------- */

  useEffect(() => {
    const handleRoleSync = () => {
      setUserRole(getStoredRole());
    };

    // Cross-tab synchronization
    window.addEventListener(
      'storage',
      handleRoleSync
    );

    // Same-tab login/logout synchronization
    window.addEventListener(
      'authChange',
      handleRoleSync
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleRoleSync
      );

      window.removeEventListener(
        'authChange',
        handleRoleSync
      );
    };
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >

      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">

        <Routes>

          {/* ==================================================
              PUBLIC ROUTES
          ================================================== */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          {/* ==================================================
              STUDENT ROUTES
          ================================================== */}

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={['student']}
              >
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              INVIGILATOR ROUTES
          ================================================== */}

          <Route
            path="/invigilator/dashboard"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={['invigilator']}
              >
                <InvigilatorDashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ADMIN - DIGITAL TWIN / DASHBOARD
          ================================================== */}

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={['admin']}
              >
                <AdminLayout>
                  <RoomEditor />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ADMIN - UPLOAD / ALLOCATION
          ================================================== */}

          <Route
            path="/admin/upload"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={['admin']}
              >
                <AdminLayout>
                  <UploadHub />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ADMIN - ANALYTICS
          ================================================== */}

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={['admin']}
              >
                <AdminLayout>
                  <Analytics />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ADMIN - GATE VERIFICATION
          ================================================== */}

          <Route
            path="/admin/verify-scan"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={['admin']}
              >
                <AdminLayout>
                  <VerifyScan />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ADMIN - ROOM CONFIGURATION
          ================================================== */}

          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={['admin']}
              >
                <AdminLayout>
                  <AdminRoomsControlHub />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ADMIN - REPORTS
              Kept outside AdminLayout so print view remains clean
          ================================================== */}

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={['admin']}
              >
                <MasterSeatingPDF />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              FALLBACK
          ================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>

      </div>

    </Router>
  );
}

export default App;