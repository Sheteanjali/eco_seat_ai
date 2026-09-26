// File: frontend/src/components/Navbar.jsx

import React from 'react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  LayoutDashboard,
  Database,
  Map,
  UserCircle,
  LogOut,
  ShieldCheck,
  ScanLine,
  Building2,
} from 'lucide-react';


const Navbar = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const role =
    userRole ||
    localStorage.getItem('role') ||
    'student';

  const username =
    localStorage.getItem('username') ||
    '';

  const assignedRoom =
    localStorage.getItem('assigned_room') ||
    localStorage.getItem('assignedRoomNo') ||
    '';

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`);


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('assigned_room');
    localStorage.removeItem('assignedRoomNo');

    navigate('/login', {
      replace: true,
    });
  };


  /* =========================================================
     ROLE DISPLAY
  ========================================================= */

  const getRoleLabel = () => {
    if (role === 'admin') {
      return 'Administrator';
    }

    if (role === 'invigilator') {
      return 'Invigilator';
    }

    return 'Student';
  };


  return (
    <nav
      className="
        sticky
        top-0
        z-50
        w-full
        border-b
        border-slate-200
        bg-white/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          min-h-[72px]
          w-full
          items-center
          justify-between
          gap-5
          px-5
          sm:px-7
          lg:px-10
        "
      >
        {/* ===================================================
            BRAND
        =================================================== */}

        <button
          type="button"
          onClick={() => navigate('/')}
          className="
            group
            flex
            shrink-0
            items-center
            gap-3
            text-left
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-indigo-100
              bg-indigo-50
              text-indigo-600
              transition-all
              duration-200
              group-hover:border-indigo-200
              group-hover:bg-indigo-100
            "
          >
            <ShieldCheck
              size={21}
              strokeWidth={2.2}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                className="
                  text-[17px]
                  font-extrabold
                  tracking-tight
                  text-slate-900
                "
              >
                Eco-Seat
                <span className="text-indigo-600">
                  {' '}AI
                </span>
              </h1>

              <span
                className="
                  hidden
                  rounded-md
                  border
                  border-slate-200
                  bg-slate-50
                  px-1.5
                  py-0.5
                  text-[7px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-400
                  xl:inline-flex
                "
              >
                Smart Examination System
              </span>
            </div>

            <p
              className="
                mt-0.5
                text-[8px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-slate-400
              "
            >
              Intelligent Seating Management
            </p>
          </div>
        </button>


        {/* ===================================================
            DESKTOP NAVIGATION
        =================================================== */}

        <div
          className="
            hidden
            items-center
            gap-1
            md:flex
          "
        >
          {/* ADMIN */}

          {role === 'admin' && (
            <>
              <NavItem
                to="/admin/analytics"
                label="Dashboard"
                icon={
                  <LayoutDashboard size={16} />
                }
                active={isActive(
                  '/admin/analytics'
                )}
              />

              <NavItem
                to="/admin/upload"
                label="Allocation"
                icon={
                  <Database size={16} />
                }
                active={isActive(
                  '/admin/upload'
                )}
              />

              <NavItem
                to="/admin/map"
                label="Digital Twin"
                icon={
                  <Map size={16} />
                }
                active={isActive(
                  '/admin/map'
                )}
              />
            </>
          )}


          {/* INVIGILATOR */}

          {role === 'invigilator' && (
            <>
              <NavItem
                to="/invigilator/dashboard"
                label="Dashboard"
                icon={
                  <LayoutDashboard size={16} />
                }
                active={isActive(
                  '/invigilator/dashboard'
                )}
              />

              <NavItem
                to="/invigilator/dashboard"
                label="Gate Verification"
                icon={
                  <ScanLine size={16} />
                }
                active={false}
              />
            </>
          )}


          {/* STUDENT */}

          {role === 'student' && (
            <NavItem
              to="/student/seat"
              label="My Entry Pass"
              icon={
                <UserCircle size={16} />
              }
              active={isActive(
                '/student/seat'
              )}
            />
          )}
        </div>


        {/* ===================================================
            ACCOUNT AREA
        =================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-3
          "
        >
          {/* USER DETAILS */}

          <div
            className="
              hidden
              items-center
              gap-3
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3
              py-2
              lg:flex
            "
          >
            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-white
                text-slate-500
                shadow-sm
                ring-1
                ring-slate-200
              "
            >
              {role === 'invigilator' ? (
                <Building2 size={15} />
              ) : (
                <UserCircle size={16} />
              )}
            </div>

            <div className="min-w-0">
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <p
                  className="
                    max-w-[120px]
                    truncate
                    text-[11px]
                    font-bold
                    text-slate-800
                  "
                >
                  {username ||
                    getRoleLabel()}
                </p>

                <span
                  className="
                    rounded-full
                    border
                    border-indigo-100
                    bg-indigo-50
                    px-2
                    py-0.5
                    text-[7px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-indigo-600
                  "
                >
                  {getRoleLabel()}
                </span>
              </div>

              {role === 'invigilator' &&
                assignedRoom && (
                  <p
                    className="
                      mt-0.5
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Room {assignedRoom}
                  </p>
                )}
            </div>
          </div>


          {/* DIVIDER */}

          <div
            className="
              hidden
              h-8
              w-px
              bg-slate-200
              sm:block
            "
          />


          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              text-[10px]
              font-bold
              uppercase
              tracking-wider
              text-slate-500
              shadow-sm
              transition-all
              duration-200
              hover:border-red-200
              hover:bg-red-50
              hover:text-red-600
              sm:px-4
            "
          >
            <LogOut size={15} />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>
        </div>
      </div>


      {/* =====================================================
          MOBILE NAVIGATION
      ===================================================== */}

      <div
        className="
          flex
          items-center
          gap-2
          overflow-x-auto
          border-t
          border-slate-100
          bg-white
          px-4
          py-2
          md:hidden
        "
      >
        {role === 'admin' && (
          <>
            <MobileNavItem
              to="/admin/analytics"
              label="Dashboard"
              icon={
                <LayoutDashboard size={15} />
              }
              active={isActive(
                '/admin/analytics'
              )}
            />

            <MobileNavItem
              to="/admin/upload"
              label="Allocation"
              icon={
                <Database size={15} />
              }
              active={isActive(
                '/admin/upload'
              )}
            />

            <MobileNavItem
              to="/admin/map"
              label="Digital Twin"
              icon={
                <Map size={15} />
              }
              active={isActive(
                '/admin/map'
              )}
            />
          </>
        )}

        {role === 'invigilator' && (
          <MobileNavItem
            to="/invigilator/dashboard"
            label="Dashboard"
            icon={
              <LayoutDashboard size={15} />
            }
            active={isActive(
              '/invigilator/dashboard'
            )}
          />
        )}

        {role === 'student' && (
          <MobileNavItem
            to="/student/seat"
            label="My Entry Pass"
            icon={
              <UserCircle size={15} />
            }
            active={isActive(
              '/student/seat'
            )}
          />
        )}
      </div>
    </nav>
  );
};


/* ===========================================================
   DESKTOP NAV ITEM
=========================================================== */

const NavItem = ({
  to,
  label,
  icon,
  active,
}) => (
  <Link
    to={to}
    className={`
      flex
      items-center
      gap-2
      rounded-lg
      px-4
      py-2.5
      text-[10px]
      font-bold
      uppercase
      tracking-wider
      transition-all
      duration-200

      ${
        active
          ? `
            bg-indigo-50
            text-indigo-700
          `
          : `
            text-slate-500
            hover:bg-slate-50
            hover:text-slate-900
          `
      }
    `}
  >
    {icon}

    <span>{label}</span>
  </Link>
);


/* ===========================================================
   MOBILE NAV ITEM
=========================================================== */

const MobileNavItem = ({
  to,
  label,
  icon,
  active,
}) => (
  <Link
    to={to}
    className={`
      flex
      shrink-0
      items-center
      gap-2
      rounded-lg
      border
      px-3
      py-2
      text-[9px]
      font-bold
      uppercase
      tracking-wider
      transition-all

      ${
        active
          ? `
            border-indigo-100
            bg-indigo-50
            text-indigo-700
          `
          : `
            border-slate-200
            bg-white
            text-slate-500
          `
      }
    `}
  >
    {icon}

    {label}
  </Link>
);


export default Navbar;