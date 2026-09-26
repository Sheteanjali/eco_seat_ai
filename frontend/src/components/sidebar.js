// File: frontend/src/components/Sidebar.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  BarChart3,
  Database,
  LogOut,
  Clock,
  ChevronRight,
  RotateCcw,
  QrCode,
  Map,
  Settings2,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';

import apiService from '../services/api';

/* ============================================================
   SIDEBAR
============================================================ */

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [resetting, setResetting] = useState(false);

  /* ==========================================================
     CURRENT USER
  ========================================================== */

  const username =
    localStorage.getItem('username') ||
    'Administrator';

  /* ==========================================================
     LIVE CLOCK
  ========================================================== */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ==========================================================
     ADMIN MENU
  ========================================================== */

  const menuItems = [
    {
      name: 'Analytics',
      icon: BarChart3,
      path: '/admin/analytics',
      label: 'System Overview',
    },
    {
      name: 'Optimization',
      icon: Database,
      path: '/admin/upload',
      label: 'Seating Allocation',
    },
    {
      name: 'Digital Twin',
      icon: Map,
      path: '/admin/dashboard',
      label: 'Building & Hall View',
    },
    {
      name: 'Manage Rooms',
      icon: Settings2,
      path: '/admin/rooms',
      label: 'Room Configuration',
    },
    {
      name: 'Verify Scan',
      icon: QrCode,
      path: '/admin/verify-scan',
      label: 'Entry Verification',
    },
  ];

  /* ==========================================================
     ACTIVE ROUTE
  ========================================================== */

  const isActive = (path) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  /* ==========================================================
     RESET ENGINE
  ========================================================== */

  const handleReset = async () => {
    const confirmed = window.confirm(
      'This will clear the current seating and attendance session. Do you want to continue?'
    );

    if (!confirmed || resetting) {
      return;
    }

    try {
      setResetting(true);

      await apiService.resetEngine();

      window.location.reload();
    } catch (error) {
      console.error(
        'Reset engine failed:',
        error
      );

      alert(
        error?.response?.data?.detail ||
          'Unable to reset the current session. Please try again.'
      );
    } finally {
      setResetting(false);
    }
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRollNo');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('assigned_room');
    localStorage.removeItem('assignedRoomNo');

    window.dispatchEvent(
      new Event('authChange')
    );

    navigate('/login', {
      replace: true,
    });
  };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <aside
      className="
        sticky
        top-0
        z-40
        flex
        h-screen
        w-72
        shrink-0
        flex-col
        border-r
        border-slate-200
        bg-white
      "
    >
      {/* =====================================================
          BRAND
      ===================================================== */}

      <div
        className="
          border-b
          border-slate-100
          px-6
          pb-5
          pt-6
        "
      >
        <button
          type="button"
          onClick={() =>
            navigate('/admin/analytics')
          }
          className="
            group
            flex
            w-full
            items-center
            gap-3
            text-left
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-indigo-100
              bg-indigo-50
              text-indigo-600
              transition-all
              duration-200
              group-hover:bg-indigo-100
            "
          >
            <ShieldCheck
              size={22}
              strokeWidth={2.2}
            />
          </div>

          <div className="min-w-0">
            <div
              className="
                flex
                items-center
                gap-1
              "
            >
              <h1
                className="
                  text-lg
                  font-extrabold
                  tracking-tight
                  text-slate-900
                "
              >
                Eco-Seat
              </h1>

              <span
                className="
                  text-lg
                  font-extrabold
                  tracking-tight
                  text-indigo-600
                "
              >
                AI
              </span>
            </div>

            <p
              className="
                mt-0.5
                text-[8px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-slate-400
              "
            >
              Administration Console
            </p>
          </div>
        </button>

        {/* ===================================================
            SYSTEM STATUS
        =================================================== */}

        <div
          className="
            mt-5
            flex
            items-center
            justify-between
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                relative
                flex
                h-2
                w-2
              "
            >
              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  animate-ping
                  rounded-full
                  bg-emerald-400
                  opacity-50
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-500
                "
              />
            </span>

            <span
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-slate-500
              "
            >
              System Online
            </span>
          </div>

          <span
            className="
              rounded-md
              border
              border-slate-200
              bg-white
              px-2
              py-1
              text-[8px]
              font-bold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Admin
          </span>
        </div>

        {/* ===================================================
            CLOCK
        =================================================== */}

        <div
          className="
            mt-3
            flex
            items-center
            justify-between
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              text-slate-500
            "
          >
            <Clock
              size={14}
              className="text-indigo-500"
            />

            <span
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.13em]
              "
            >
              Local Time
            </span>
          </div>

          <span
            className="
              font-mono
              text-xs
              font-bold
              text-slate-700
            "
          >
            {currentTime.toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }
            )}
          </span>
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <div
        className="
          flex-1
          overflow-y-auto
          px-4
          py-5
        "
      >
        <p
          className="
            mb-3
            px-3
            text-[8px]
            font-bold
            uppercase
            tracking-[0.2em]
            text-slate-400
          "
        >
          Administration
        </p>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const active =
              isActive(item.path);

            const Icon =
              item.icon;

            return (
              <button
                type="button"
                key={item.name}
                onClick={() =>
                  navigate(item.path)
                }
                className={`
                  group
                  relative
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  border
                  px-3
                  py-3
                  text-left
                  transition-all
                  duration-200

                  ${
                    active
                      ? `
                          border-indigo-100
                          bg-indigo-50/80
                          shadow-sm
                        `
                      : `
                          border-transparent
                          bg-white
                          hover:border-slate-200
                          hover:bg-slate-50
                        `
                  }
                `}
              >
                {/* ACTIVE INDICATOR */}

                {active && (
                  <span
                    className="
                      absolute
                      -left-[17px]
                      h-8
                      w-[3px]
                      rounded-r-full
                      bg-indigo-600
                    "
                  />
                )}

                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                  "
                >
                  {/* ICON */}

                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      transition-all

                      ${
                        active
                          ? `
                              border-indigo-100
                              bg-white
                              text-indigo-600
                              shadow-sm
                            `
                          : `
                              border-slate-100
                              bg-slate-50
                              text-slate-400
                              group-hover:border-indigo-100
                              group-hover:bg-indigo-50
                              group-hover:text-indigo-600
                            `
                      }
                    `}
                  >
                    <Icon
                      size={17}
                      strokeWidth={2}
                    />
                  </div>

                  {/* TEXT */}

                  <div className="min-w-0">
                    <p
                      className={`
                        truncate
                        text-[11px]
                        font-bold

                        ${
                          active
                            ? 'text-indigo-700'
                            : 'text-slate-700'
                        }
                      `}
                    >
                      {item.name}
                    </p>

                    <p
                      className={`
                        mt-0.5
                        truncate
                        text-[8px]
                        font-semibold
                        uppercase
                        tracking-wider

                        ${
                          active
                            ? 'text-indigo-400'
                            : 'text-slate-400'
                        }
                      `}
                    >
                      {item.label}
                    </p>
                  </div>
                </div>

                {active && (
                  <ChevronRight
                    size={14}
                    className="
                      shrink-0
                      text-indigo-400
                    "
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* =====================================================
          ADMIN PROFILE
      ===================================================== */}

      <div
        className="
          border-t
          border-slate-100
          px-4
          pb-4
          pt-4
        "
      >
        <div
          className="
            mb-3
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-3
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-slate-200
              bg-white
              text-slate-500
              shadow-sm
            "
          >
            <UserCircle size={17} />
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-[11px]
                font-bold
                text-slate-800
              "
            >
              {username}
            </p>

            <div
              className="
                mt-0.5
                flex
                items-center
                gap-1.5
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-emerald-500
                "
              />

              <p
                className="
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            RESET
        =================================================== */}

        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="
            group
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-2.5
            text-[9px]
            font-bold
            uppercase
            tracking-[0.12em]
            text-slate-400
            transition-all
            hover:bg-amber-50
            hover:text-amber-600
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <RotateCcw
            size={14}
            className={
              resetting
                ? 'animate-spin'
                : 'transition-transform group-hover:-rotate-45'
            }
          />

          {resetting
            ? 'Resetting Session...'
            : 'Reset Current Session'}
        </button>

        {/* ===================================================
            LOGOUT
        =================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            mt-2
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            py-3
            text-[9px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-slate-600
            shadow-sm
            transition-all
            duration-200
            hover:border-red-200
            hover:bg-red-50
            hover:text-red-600
          "
        >
          <LogOut size={14} />

          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;