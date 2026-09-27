// File: frontend/src/pages/Admin/RoomEditor.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Building2,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  AlertCircle,
  Search,
  Wrench,
  LayoutGrid,
  Users,
  Armchair,
  RotateCw,
  Activity,
  ChevronRight,
} from 'lucide-react';

import DigitalTwinGrid from '../../components/DigitalTwinGrid';
import axios from 'axios';

// File: frontend/src/pages/Admin/RoomEditor.js

const API_ROOT = (
  process.env.REACT_APP_API_URL ||
  'http://127.0.0.1:8765'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const API_BASE_URL = `${API_ROOT}/api`;

/* ============================================================
   ROOM EDITOR
============================================================ */

const RoomEditor = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [blockedSeats, setBlockedSeats] = useState([]);

  const [status, setStatus] = useState('idle');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingTable, setUpdatingTable] = useState('');
  const [roomSearch, setRoomSearch] = useState('');

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  /* ==========================================================
     HELPERS
  ========================================================== */

  const getRoomIdentifier = (room) => {
    if (!room) return '';

    return String(
      room.room_no ??
        room.name ??
        ''
    )
      .replace(/^room\s*/i, '')
      .replace(/^dt-/i, '')
      .trim();
  };

  const parseBrokenTables = (room) => {
    if (!room) return [];

    if (Array.isArray(room.broken_tables)) {
      return room.broken_tables
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    if (!room.broken_tables) {
      return [];
    }

    return String(room.broken_tables)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const getRoomCapacity = (room) => {
    if (!room) return 0;

    // Backend capacity is the actual configured room capacity.
    // Do not multiply or invent capacity.
    return Number(room.capacity) || 0;
  };

  const getRows = (room) => {
    const value = Number(room?.rows);

    return Number.isFinite(value) && value > 0
      ? value
      : 0;
  };

  const getCols = (room) => {
    const value = Number(room?.cols);

    return Number.isFinite(value) && value > 0
      ? value
      : 0;
  };

  /* ==========================================================
     FETCH ROOMS
  ========================================================== */

  const fetchRooms = useCallback(
    async ({
      initial = false,
      showRefresh = false,
    } = {}) => {
      if (initial) {
        setLoadingRooms(true);
      }

      if (showRefresh) {
        setRefreshing(true);
      }

      setError('');

      try {
        const response = await axios.get(
          `${API_BASE_URL}/admin/analytics`
        );

        const roomData = Array.isArray(
          response.data?.roomData
        )
          ? response.data.roomData
          : [];

        setRooms(roomData);

        setSelectedRoom((currentRoom) => {
          if (!roomData.length) {
            return null;
          }

          if (currentRoom) {
            const currentId =
              getRoomIdentifier(currentRoom);

            const updatedRoom = roomData.find(
              (room) =>
                getRoomIdentifier(room) ===
                currentId
            );

            if (updatedRoom) {
              return updatedRoom;
            }
          }

          return roomData[0];
        });
      } catch (err) {
        console.error(
          'Unable to load examination halls:',
          err
        );

        setError(
          err.response?.data?.detail ||
            'Unable to load examination hall information.'
        );
      } finally {
        setLoadingRooms(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRooms({
      initial: true,
    });
  }, [fetchRooms]);

  /* ==========================================================
     SYNC BROKEN TABLES
  ========================================================== */

  useEffect(() => {
    if (!selectedRoom) {
      setBlockedSeats([]);
      return;
    }

    setBlockedSeats(
      parseBrokenTables(selectedRoom)
    );
  }, [selectedRoom]);

  /* ==========================================================
     FILTER ROOMS
  ========================================================== */

  const filteredRooms = useMemo(() => {
    const query = roomSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return rooms;
    }

    return rooms.filter((room) => {
      const roomId =
        getRoomIdentifier(room);

      const floor = String(
        room.floor ?? ''
      );

      return (
        roomId
          .toLowerCase()
          .includes(query) ||
        floor
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rooms, roomSearch]);

  /* ==========================================================
     SELECTED ROOM SUMMARY
  ========================================================== */

  const selectedRoomId =
    getRoomIdentifier(selectedRoom);

  const selectedCapacity =
    getRoomCapacity(selectedRoom);

  const selectedRows =
    getRows(selectedRoom);

  const selectedCols =
    getCols(selectedRoom);

  const totalConfiguredTables =
    Number(selectedRoom?.total_tables) ||
    (
      selectedRows > 0 &&
      selectedCols > 0
        ? selectedRows * selectedCols
        : 0
    );

  const healthyTables = Math.max(
    totalConfiguredTables -
      blockedSeats.length,
    0
  );

  /* ==========================================================
     TABLE STATUS
  ========================================================== */

  const toggleTableStatus = async (
    tableId
  ) => {
    if (!selectedRoom || !tableId) {
      return;
    }

    const normalizedTableId =
      String(tableId);

    const roomNo =
      getRoomIdentifier(selectedRoom);

    if (!roomNo) {
      setError(
        'The selected hall does not have a valid room number.'
      );

      return;
    }

    const isCurrentlyBroken =
      blockedSeats.includes(
        normalizedTableId
      );

    const previousBlockedSeats = [
      ...blockedSeats,
    ];

    const newBlockedSeats =
      isCurrentlyBroken
        ? blockedSeats.filter(
            (seat) =>
              seat !== normalizedTableId
          )
        : [
            ...blockedSeats,
            normalizedTableId,
          ];

    // Optimistic UI update.
    setBlockedSeats(newBlockedSeats);
    setUpdatingTable(normalizedTableId);

    setError('');
    setNotice('');

    try {
      const payload = {
        room_no: roomNo,
        table_id: normalizedTableId,
        is_broken:
          !isCurrentlyBroken,
      };

      const response =
        await axios.patch(
          `${API_BASE_URL}/admin/room/update-infrastructure`,
          payload
        );

      if (
        response.data?.status ===
          'success' ||
        response.status === 200
      ) {
        setNotice(
          isCurrentlyBroken
            ? `Table ${normalizedTableId} is available again.`
            : `Table ${normalizedTableId} has been marked as damaged.`
        );

        await fetchRooms();
      }
    } catch (err) {
      console.error(
        'Infrastructure update failed:',
        err.response?.data ||
          err.message
      );

      // Restore previous state when API update fails.
      setBlockedSeats(
        previousBlockedSeats
      );

      setError(
        err.response?.data?.detail ||
          'Unable to update the table status. The previous state has been restored.'
      );
    } finally {
      setUpdatingTable('');

      window.setTimeout(() => {
        setNotice('');
      }, 3500);
    }
  };

  /* ==========================================================
     REGENERATE SEATING PLAN
  ========================================================== */

  const runAISolver = async () => {
    if (status === 'solving') {
      return;
    }

    setStatus('solving');
    setError('');
    setNotice('');

    try {
      const response =
        await axios.post(
          `${API_BASE_URL}/admin/regenerate-plan`,
          {
            mode: 'Double',
          }
        );

      if (
        response.data?.status ===
          'success' ||
        response.status === 200
      ) {
        setStatus('success');

        setNotice(
          'The seating plan has been regenerated successfully.'
        );

        await fetchRooms();

        window.setTimeout(() => {
          setStatus('idle');
          setNotice('');
        }, 3500);
      } else {
        setStatus('idle');

        setError(
          response.data?.message ||
            'The seating plan could not be regenerated.'
        );
      }
    } catch (err) {
      console.error(
        'Seating plan regeneration failed:',
        err
      );

      setStatus('idle');

      setError(
        err.response?.data?.detail ||
          'Unable to regenerate the seating plan.'
      );
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loadingRooms) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>

          <h2 className="text-base font-semibold text-slate-900">
            Loading examination halls
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preparing room configuration...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <LayoutGrid size={21} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Examination Hall Configuration
                </h1>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  System Online
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Review hall layouts, manage damaged tables and
                update seating allocation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {selectedRoomId && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Building2
                  size={16}
                  className="text-indigo-600"
                />

                <span className="text-sm font-medium text-slate-700">
                  Hall {selectedRoomId}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                fetchRooms({
                  showRefresh: true,
                })
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCw
                size={16}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          ALERTS
      ====================================================== */}

      <div className="mx-auto max-w-[1800px] px-4 pt-5 sm:px-6">

        {error && (
          <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Action unsuccessful
                </p>

                <p className="mt-0.5 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="text-xs font-semibold text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Update completed
              </p>

              <p className="mt-0.5 text-sm text-emerald-700">
                {notice}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ======================================================
          MAIN LAYOUT
      ====================================================== */}

      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-5 px-4 pb-8 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_300px]">

        {/* ====================================================
            LEFT SIDE - HALL LIST
        ==================================================== */}

        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-[90px] xl:self-start">

          <div className="border-b border-slate-200 p-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Examination Halls
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {rooms.length} configured
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 size={17} />
              </div>

            </div>

            <div className="relative mt-4">

              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={roomSearch}
                onChange={(event) =>
                  setRoomSearch(
                    event.target.value
                  )
                }
                placeholder="Search halls..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

            </div>

          </div>

          <div className="max-h-[500px] space-y-1 overflow-y-auto p-2">

            {filteredRooms.map((room) => {
              const roomId =
                getRoomIdentifier(room);

              const active =
                selectedRoomId === roomId;

              const roomBroken =
                parseBrokenTables(room);

              return (
                <button
                  type="button"
                  key={roomId}
                  onClick={() =>
                    setSelectedRoom(room)
                  }
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        active
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Building2 size={16} />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold">
                        Hall {roomId}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {roomBroken.length > 0
                          ? `${roomBroken.length} damaged`
                          : 'No reported issues'}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    {roomBroken.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                    )}

                    <ChevronRight
                      size={15}
                      className={
                        active
                          ? 'text-indigo-500'
                          : 'text-slate-300'
                      }
                    />

                  </div>

                </button>
              );
            })}

            {filteredRooms.length === 0 && (
              <div className="px-4 py-10 text-center">

                <Building2
                  size={24}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No halls found
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Try another search.
                </p>

              </div>
            )}

          </div>

        </aside>

        {/* ====================================================
            CENTER CONTENT
        ==================================================== */}

        <main className="min-w-0 space-y-5">

          {selectedRoom ? (
            <>

              {/* ROOM OVERVIEW */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <p className="text-xs font-medium text-indigo-600">
                      Selected Examination Hall
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      Hall {selectedRoomId}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Click a table in the layout to change its
                      infrastructure status.
                    </p>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    <StatusLegend
                      label="Available"
                      dotClass="bg-slate-400"
                    />

                    <StatusLegend
                      label="Damaged"
                      dotClass="bg-red-500"
                    />

                  </div>

                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

                  <RoomMetric
                    label="Capacity"
                    value={
                      selectedCapacity > 0
                        ? selectedCapacity
                        : '—'
                    }
                    icon={
                      <Users size={17} />
                    }
                  />

                  <RoomMetric
                    label="Tables"
                    value={
                      totalConfiguredTables > 0
                        ? totalConfiguredTables
                        : '—'
                    }
                    icon={
                      <Armchair size={17} />
                    }
                  />

                  <RoomMetric
                    label="Available"
                    value={
                      totalConfiguredTables > 0
                        ? healthyTables
                        : '—'
                    }
                    icon={
                      <CheckCircle2 size={17} />
                    }
                    tone="emerald"
                  />

                  <RoomMetric
                    label="Damaged"
                    value={
                      blockedSeats.length
                    }
                    icon={
                      <AlertTriangle size={17} />
                    }
                    tone="red"
                  />

                </div>

              </section>

              {/* =================================================
                  DIGITAL TWIN
              ================================================= */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <LayoutGrid size={17} />
                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900">
                        Seating Layout
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Interactive infrastructure map
                      </p>

                    </div>

                  </div>

                  {updatingTable && (
                    <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">

                      <Loader2
                        size={13}
                        className="animate-spin"
                      />

                      Updating {updatingTable}

                    </span>
                  )}

                </div>

                <div className="overflow-x-auto p-4 sm:p-6 lg:p-8">

                  {selectedRows > 0 &&
                  selectedCols > 0 ? (

                    <div className="mx-auto min-w-fit">

                      <DigitalTwinGrid
                        rows={selectedRows}
                        cols={selectedCols}
                        blockedSeats={
                          blockedSeats
                        }
                        onToggleSeat={
                          toggleTableStatus
                        }
                        interactive={true}
                        roomNo={
                          selectedRoomId
                        }
                      />

                    </div>

                  ) : (

                    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <AlertTriangle
                          size={22}
                        />
                      </div>

                      <h3 className="mt-4 font-semibold text-slate-800">
                        Layout not configured
                      </h3>

                      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                        Row and column information is not
                        available for this examination hall.
                      </p>

                    </div>

                  )}

                </div>

              </section>

            </>
          ) : (

            <section className="flex min-h-[500px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

              <div className="text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Building2 size={22} />
                </div>

                <h2 className="mt-4 font-semibold text-slate-800">
                  No examination hall selected
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select a hall to view its seating
                  configuration.
                </p>

              </div>

            </section>

          )}

        </main>

        {/* ====================================================
            RIGHT SIDE - MANAGEMENT
        ==================================================== */}

        <aside className="space-y-5 xl:sticky xl:top-[90px] xl:self-start">

          {/* INFRASTRUCTURE */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Wrench size={18} />
                </div>

                <div>

                  <h2 className="font-semibold text-slate-900">
                    Infrastructure Status
                  </h2>

                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Damaged tables reported in the
                    selected hall.
                  </p>

                </div>

              </div>

            </div>

            <div className="p-5">

              {!selectedRoom ? (

                <p className="text-sm text-slate-500">
                  Select an examination hall.
                </p>

              ) : blockedSeats.length === 0 ? (

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={17}
                      className="text-emerald-600"
                    />

                    <p className="text-sm font-semibold text-emerald-800">
                      No damaged tables
                    </p>

                  </div>

                  <p className="mt-1.5 text-xs leading-5 text-emerald-700">
                    No infrastructure issues are currently
                    reported for this hall.
                  </p>

                </div>

              ) : (

                <div className="space-y-2">

                  {blockedSeats.map(
                    (tableId) => (

                      <div
                        key={tableId}
                        className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-3 py-3"
                      >

                        <div className="flex items-center gap-2">

                          <AlertTriangle
                            size={15}
                            className="text-red-600"
                          />

                          <span className="text-sm font-semibold text-red-800">
                            {tableId}
                          </span>

                        </div>

                        <button
                          type="button"
                          disabled={
                            updatingTable ===
                            tableId
                          }
                          onClick={() =>
                            toggleTableStatus(
                              tableId
                            )
                          }
                          className="text-xs font-semibold text-red-700 transition hover:text-red-900 disabled:opacity-50"
                        >
                          Restore
                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </section>

          {/* =================================================
              SEATING PLAN
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Activity size={18} />
              </div>

              <div>

                <h2 className="font-semibold text-slate-900">
                  Seating Allocation
                </h2>

                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Regenerate the seating plan after
                  infrastructure changes.
                </p>

              </div>

            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <span className="text-xs font-medium text-slate-500">
                  Selected Hall
                </span>

                <span className="text-xs font-semibold text-slate-800">
                  {selectedRoomId
                    ? `Hall ${selectedRoomId}`
                    : 'Not selected'}
                </span>

              </div>

              <div className="my-3 border-t border-slate-200" />

              <div className="flex items-center justify-between">

                <span className="text-xs font-medium text-slate-500">
                  Infrastructure Issues
                </span>

                <span
                  className={`text-xs font-semibold ${
                    blockedSeats.length > 0
                      ? 'text-red-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {blockedSeats.length}
                </span>

              </div>

            </div>

            <button
              type="button"
              onClick={runAISolver}
              disabled={
                status === 'solving' ||
                rooms.length === 0
              }
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {status === 'solving' ? (
                <>
                  <Loader2
                    className="animate-spin"
                    size={16}
                  />
                  Regenerating...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2
                    size={16}
                  />
                  Plan Updated
                </>
              ) : (
                <>
                  <RefreshCcw
                    size={16}
                  />
                  Regenerate Seating Plan
                </>
              )}

            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
              Regeneration uses the current
              infrastructure configuration.
            </p>

          </section>

        </aside>

      </div>

    </div>
  );
};

/* ============================================================
   ROOM METRIC
============================================================ */

const RoomMetric = ({
  label,
  value,
  icon,
  tone = 'indigo',
}) => {
  const tones = {
    indigo:
      'bg-indigo-50 text-indigo-600',
    emerald:
      'bg-emerald-50 text-emerald-600',
    red:
      'bg-red-50 text-red-600',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <div className="flex items-start justify-between gap-2">

        <div>

          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

        </div>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            tones[tone] ||
            tones.indigo
          }`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
};

/* ============================================================
   STATUS LEGEND
============================================================ */

const StatusLegend = ({
  label,
  dotClass,
}) => (
  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">

    <span
      className={`h-2.5 w-2.5 rounded-full ${dotClass}`}
    />

    <span className="text-xs font-medium text-slate-600">
      {label}
    </span>

  </div>
);

export default RoomEditor;