// File: frontend/src/components/DigitalTwinGrid.jsx

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  User,
  CheckCircle2,
  Armchair,
  LayoutGrid,
  Building2,
} from 'lucide-react';

const DigitalTwinGrid = ({
  occupiedSeats = [],
  blockedSeats = [],
  onToggleSeat,
  userSeat,
  rows = 10,
  cols = 10,
  interactive = false,
  roomNo = 'N/A',
}) => {
  /* =========================================================
     ANIMATION
  ========================================================= */

  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.008,
      },
    },
  };

  const seatVars = {
    hidden: {
      opacity: 0,
      scale: 0.94,
      y: 4,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
  };

  /* =========================================================
     NORMALIZED DATA
  ========================================================= */

  const blockedSet = useMemo(
    () => new Set(blockedSeats.map(String)),
    [blockedSeats]
  );

  const occupiedMap = useMemo(() => {
    const map = new Map();

    occupiedSeats.forEach((student) => {
      if (student?.seat) {
        map.set(String(student.seat), student);
      }
    });

    return map;
  }, [occupiedSeats]);

  const totalTables = rows * cols;

  const presentCount = occupiedSeats.filter(
    (student) =>
      String(student?.status || '').toLowerCase() === 'present'
  ).length;

  /* =========================================================
     SEAT STYLE
  ========================================================= */

  const getSeatStyle = ({
    isBroken,
    isPresent,
    isUser,
  }) => {
    if (isUser) {
      return `
        bg-amber-50
        border-amber-300
        text-amber-700
        ring-2
        ring-amber-100
      `;
    }

    if (isBroken) {
      return `
        bg-red-50
        border-red-200
        text-red-600
      `;
    }

    if (isPresent) {
      return `
        bg-emerald-50
        border-emerald-200
        text-emerald-600
      `;
    }

    return `
      bg-white
      border-slate-200
      text-slate-500
      hover:border-indigo-300
      hover:bg-indigo-50
      hover:text-indigo-600
    `;
  };

  /* =========================================================
     GRID
  ========================================================= */

  const renderGrid = () => {
    const grid = [];

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        /*
         * Existing project convention is preserved here:
         * R0C0, R0C1...
         * T0, T1...
         */
        const seatId = `R${r}C${c}`;
        const tableIndex = r * cols + c;
        const tableId = `T${tableIndex}`;

        const occupant = occupiedMap.get(seatId);

        const isBroken = blockedSet.has(tableId);

        const isUser =
          String(userSeat || '') === seatId;

        const isPresent =
          String(occupant?.status || '').toLowerCase() ===
          'present';

        const seatStyle = getSeatStyle({
          isBroken,
          isPresent,
          isUser,
        });

        let title = `Table ${tableId}`;

        if (isBroken) {
          title += ' • Infrastructure issue';
        } else if (isUser) {
          title += ' • Your assigned seat';
        } else if (occupant) {
          title += ` • ${occupant.name || 'Allocated'}`;
        } else {
          title += ' • Available';
        }

        grid.push(
          <motion.button
            type="button"
            key={seatId}
            variants={seatVars}
            whileHover={{
              y: -2,
              scale: 1.03,
            }}
            whileTap={
              interactive
                ? { scale: 0.97 }
                : undefined
            }
            onClick={() => {
              if (
                interactive &&
                onToggleSeat
              ) {
                onToggleSeat(tableId);
              }
            }}
            disabled={!interactive}
            title={title}
            className={`
              group
              relative
              h-[58px]
              min-w-[58px]
              rounded-xl
              border
              flex
              flex-col
              items-center
              justify-center
              gap-1
              shadow-sm
              transition-all
              duration-200
              outline-none
              ${interactive ? 'cursor-pointer' : 'cursor-default'}
              ${seatStyle}
            `}
          >
            {/* STATUS ICON */}

            <div
              className="
                flex
                items-center
                justify-center
                h-6
              "
            >
              {isUser ? (
                <User
                  size={16}
                  strokeWidth={2.2}
                />
              ) : isBroken ? (
                <AlertTriangle
                  size={16}
                  strokeWidth={2.2}
                />
              ) : isPresent ? (
                <CheckCircle2
                  size={16}
                  strokeWidth={2.2}
                />
              ) : (
                <Armchair
                  size={15}
                  strokeWidth={1.8}
                  className="
                    text-slate-400
                    group-hover:text-indigo-500
                  "
                />
              )}
            </div>

            {/* TABLE NUMBER */}

            <span
              className="
                text-[9px]
                font-bold
                tracking-wide
              "
            >
              {tableId}
            </span>

            {/* USER INDICATOR */}

            {isUser && (
              <span
                className="
                  absolute
                  -top-2
                  left-1/2
                  -translate-x-1/2
                  whitespace-nowrap
                  rounded-full
                  bg-amber-500
                  px-2
                  py-[2px]
                  text-[7px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-white
                  shadow-sm
                "
              >
                Your Seat
              </span>
            )}

            {/* BROKEN INDICATOR */}

            {isBroken && (
              <span
                className="
                  absolute
                  right-1.5
                  top-1.5
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-red-500
                "
              />
            )}
          </motion.button>
        );
      }
    }

    return grid;
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <section
      className="
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          border-b
          border-slate-100
          bg-white
          px-6
          py-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-indigo-100
              bg-indigo-50
              text-indigo-600
            "
          >
            <LayoutGrid
              size={20}
              strokeWidth={2}
            />
          </div>

          <div>
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-slate-400
              "
            >
              Digital Twin
            </p>

            <h2
              className="
                mt-0.5
                text-base
                font-bold
                text-slate-900
              "
            >
              Examination Hall Layout
            </h2>
          </div>
        </div>

        {/* ROOM */}

        <div
          className="
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-2.5
          "
        >
          <Building2
            size={17}
            className="text-indigo-600"
          />

          <div>
            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-wider
                text-slate-400
              "
            >
              Active Room
            </p>

            <p
              className="
                text-sm
                font-bold
                text-slate-800
              "
            >
              Room {roomNo}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-2
          gap-px
          border-b
          border-slate-100
          bg-slate-100
          sm:grid-cols-4
        "
      >
        <Stat
          label="Total Tables"
          value={totalTables}
        />

        <Stat
          label="Present"
          value={presentCount}
        />

        <Stat
          label="Blocked"
          value={blockedSeats.length}
        />

        <Stat
          label="Grid"
          value={`${rows} × ${cols}`}
        />
      </div>

      {/* =====================================================
          BOARD / FRONT OF ROOM
      ===================================================== */}

      <div className="px-6 pt-6">
        <div
          className="
            mx-auto
            flex
            max-w-xl
            items-center
            justify-center
            rounded-lg
            border
            border-slate-200
            bg-slate-50
            px-4
            py-2
            text-[9px]
            font-bold
            uppercase
            tracking-[0.25em]
            text-slate-400
          "
        >
          Front / Examination Board
        </div>
      </div>

      {/* =====================================================
          GRID
      ===================================================== */}

      <div
        className="
          overflow-x-auto
          px-6
          py-7
        "
      >
        <motion.div
          variants={containerVars}
          initial="hidden"
          animate="visible"
          className="
            mx-auto
            grid
            w-max
            gap-3
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-5
          "
          style={{
            gridTemplateColumns: `repeat(${cols}, 58px)`,
          }}
        >
          {renderGrid()}
        </motion.div>
      </div>

      {/* =====================================================
          LEGEND
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          border-t
          border-slate-100
          bg-slate-50/70
          px-6
          py-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-x-6
            gap-y-3
          "
        >
          <Legend
            type="available"
            label="Available"
          />

          <Legend
            type="present"
            label="Present"
          />

          <Legend
            type="broken"
            label="Blocked / Broken"
          />

          <Legend
            type="user"
            label="Your Seat"
          />
        </div>

        <p
          className="
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-slate-400
          "
        >
          Eco-Seat AI • Digital Hall Monitor
        </p>
      </div>
    </section>
  );
};


/* ===========================================================
   STAT COMPONENT
=========================================================== */

const Stat = ({
  label,
  value,
}) => (
  <div
    className="
      bg-white
      px-5
      py-4
    "
  >
    <p
      className="
        text-[9px]
        font-bold
        uppercase
        tracking-[0.16em]
        text-slate-400
      "
    >
      {label}
    </p>

    <p
      className="
        mt-1
        text-lg
        font-bold
        text-slate-900
      "
    >
      {value}
    </p>
  </div>
);


/* ===========================================================
   LEGEND COMPONENT
=========================================================== */

const Legend = ({
  type,
  label,
}) => {
  const styles = {
    available:
      'bg-white border-slate-300',

    present:
      'bg-emerald-50 border-emerald-300',

    broken:
      'bg-red-50 border-red-300',

    user:
      'bg-amber-50 border-amber-300',
  };

  return (
    <div
      className="
        flex
        items-center
        gap-2
      "
    >
      <span
        className={`
          h-3
          w-3
          rounded
          border
          ${styles[type]}
        `}
      />

      <span
        className="
          text-[10px]
          font-semibold
          text-slate-500
        "
      >
        {label}
      </span>
    </div>
  );
};


export default DigitalTwinGrid;