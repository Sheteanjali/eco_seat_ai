// File: frontend/src/pages/Admin/Rooms.js



import React, {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from 'react';



import axios from 'axios';



import {

  Plus,

  Settings2,

  LayoutGrid,

  RefreshCw,

  Loader2,

  Users,

  Shuffle,

  Building2,

  Rows,

  Columns,

  AlertTriangle,

  CheckCircle2,

  AlertCircle,

  Save,

  Trash2,

  Search,

  Armchair,

  UserCheck,

  UserX,

  SlidersHorizontal,

  ChevronRight,

  RotateCcw,

} from 'lucide-react';


// File: frontend/src/pages/Admin/Rooms.js

const API_ROOT = (
  process.env.REACT_APP_API_URL ||
  'http://127.0.0.1:8765'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const API_BASE_URL = `${API_ROOT}/api`;



const MAX_ROWS = 15;

const MAX_COLS = 10;



const AdminRoomsControlHub = () => {

  // =========================================================

  // CORE DATA

  // =========================================================



  const [rooms, setRooms] = useState([]);

  const [studentSeatsData, setStudentSeatsData] =

    useState([]);



  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =

    useState(false);



  const [solverStatus, setSolverStatus] =

    useState('idle');



  const [error, setError] = useState('');

  const [notice, setNotice] = useState('');



  const [roomSearch, setRoomSearch] =

    useState('');



  // =========================================================

  // CREATE ROOM

  // =========================================================



  const [newRoomNo, setNewRoomNo] =

    useState('');



  const [newRows, setNewRows] =

    useState(15);



  const [newCols, setNewCols] =

    useState(5);



  const [creatingRoom, setCreatingRoom] =

    useState(false);



  // =========================================================

  // MODIFY ROOM

  // =========================================================



  const [

    selectedModifyRoom,

    setSelectedModifyRoom,

  ] = useState('');



  const [

    targetColumnIndex,

    setTargetColumnIndex,

  ] = useState('0');



  const [

    customTableCount,

    setCustomTableCount,

  ] = useState(15);



  const [

    activeColumnOverrides,

    setActiveColumnOverrides,

  ] = useState({});



  const [updatingRoom, setUpdatingRoom] =

    useState(false);



  // =========================================================

  // HELPERS

  // =========================================================



  const clamp = (

    value,

    min,

    max

  ) => {

    const parsed = Number.parseInt(

      value,

      10

    );



    if (Number.isNaN(parsed)) {

      return min;

    }



    return Math.min(

      Math.max(parsed, min),

      max

    );

  };



  const intSafe = (

    value,

    fallback = 0

  ) => {

    const parsed = Number.parseInt(

      value,

      10

    );



    return Number.isNaN(parsed)

      ? fallback

      : parsed;

  };



  const normalizeRoomNo = (value) =>

    String(value || '')

      .replace(/^room\s*/i, '')

      .trim();



  const parseColumnBounds = (value) => {

    if (!value) {

      return {};

    }



    if (

      typeof value === 'object' &&

      !Array.isArray(value)

    ) {

      return value;

    }



    try {

      const parsed =

        JSON.parse(value);



      return parsed &&

        typeof parsed === 'object'

        ? parsed

        : {};

    } catch {

      return {};

    }

  };



  const getBrokenTables = (room) => {

    if (!room?.broken_tables) {

      return [];

    }



    if (

      Array.isArray(

        room.broken_tables

      )

    ) {

      return room.broken_tables

        .map((item) =>

          String(item).trim()

        )

        .filter(Boolean);

    }



    return String(

      room.broken_tables

    )

      .split(',')

      .map((item) => item.trim())

      .filter(Boolean);

  };



  // =========================================================

  // FETCH ROOMS + STUDENTS

  // =========================================================



  const fetchActiveRooms =
    useCallback(
      async ({
        initial = false,
        manual = false,
      } = {}) => {
        if (initial) {
          setLoading(true);
        }

        if (manual) {
          setRefreshing(true);
        }

        setError('');

        try {
          const roomsResponse = await axios.get(
            `${API_BASE_URL}/admin/analytics`
          );

          const roomData = Array.isArray(
            roomsResponse.data?.roomData
          )
            ? roomsResponse.data.roomData
            : [];

          setRooms(roomData);

          setSelectedModifyRoom(
            (currentRoom) => {
              if (roomData.length === 0) {
                return '';
              }

              const stillExists =
                roomData.some(
                  (room) =>
                    String(room.room_no) ===
                    String(currentRoom)
                );

              if (stillExists) {
                return currentRoom;
              }

              return String(
                roomData[0].room_no
              );
            }
          );
        } catch (err) {
          console.error(
            'Failed to load room configuration:',
            err
          );

          setRooms([]);

          setError(
            err.response?.data?.detail ||
              'Unable to load examination room configuration.'
          );
        }

        try {
          const studentsResponse =
            await axios.get(
              `${API_BASE_URL}/admin/search-hub`,
              {
                params: {
                  filter_type:
                    'student',
                  query: '',
                },
              }
            );

          const studentData =
            Array.isArray(
              studentsResponse.data
                ?.results
            )
              ? studentsResponse.data
                  .results
              : [];

          setStudentSeatsData(
            studentData
          );
        } catch (err) {
          console.error(
            'Failed to load student seating registry:',
            err
          );

          setStudentSeatsData([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


  useEffect(() => {

    fetchActiveRooms({

      initial: true,

    });

  }, [fetchActiveRooms]);



  // =========================================================

  // SELECTED ROOM

  // =========================================================



  const currentRoom = useMemo(

    () =>

      rooms.find(

        (room) =>

          String(room.room_no) ===

          String(

            selectedModifyRoom

          )

      ) || null,

    [

      rooms,

      selectedModifyRoom,

    ]

  );



  useEffect(() => {

    if (!currentRoom) {

      return;

    }



    setActiveColumnOverrides(

      parseColumnBounds(

        currentRoom.column_bounds

      )

    );



    setTargetColumnIndex('0');



    setCustomTableCount(

      clamp(

        currentRoom.rows,

        1,

        MAX_ROWS

      )

    );

  }, [

    selectedModifyRoom,

    currentRoom,

  ]);



  // =========================================================

  // FILTER ROOMS

  // =========================================================



  const filteredRooms = useMemo(

    () => {

      const query =

        roomSearch

          .trim()

          .toLowerCase();



      if (!query) {

        return rooms;

      }



      return rooms.filter(

        (room) =>

          String(

            room.room_no || ''

          )

            .toLowerCase()

            .includes(query)

      );

    },

    [rooms, roomSearch]

  );



  // =========================================================

  // CREATE ROOM

  // =========================================================



  const handleCreateNewRoom =

    async (event) => {

      event.preventDefault();



      const roomNo =

        newRoomNo.trim();



      if (!roomNo) {

        setError(

          'Enter a room number before creating the room.'

        );



        return;

      }



      const duplicate =

        rooms.some(

          (room) =>

            String(

              room.room_no

            ).toLowerCase() ===

            roomNo.toLowerCase()

        );



      if (duplicate) {

        setError(

          `Room ${roomNo} already exists.`

        );



        return;

      }



      const payload = {

        room_no: roomNo,

        rows: clamp(

          newRows,

          1,

          MAX_ROWS

        ),

        cols: clamp(

          newCols,

          1,

          MAX_COLS

        ),

        column_bounds: {},

      };



      setCreatingRoom(true);

      setError('');

      setNotice('');



      try {

        const response =

          await axios.post(

            `${API_BASE_URL}/admin/inject-room-node`,

            payload

          );



        if (

          response.status >= 200 &&

          response.status < 300

        ) {

          setNotice(

            `Room ${payload.room_no} was created successfully.`

          );



          setNewRoomNo('');

          setNewRows(15);

          setNewCols(5);



          await fetchActiveRooms();



          setSelectedModifyRoom(

            payload.room_no

          );

        }

      } catch (err) {

        console.error(

          'Room creation failed:',

          err

        );



        setError(

          err.response?.data

            ?.detail ||

            'Unable to create the examination room.'

        );

      } finally {

        setCreatingRoom(false);

      }

    };



  // =========================================================

  // COLUMN OVERRIDE

  // =========================================================



  const handleLockColumnOverride =

    () => {

      if (!currentRoom) {

        return;

      }



      const maxColumns =

        intSafe(

          currentRoom.cols,

          0

        );



      const selectedColumn =

        intSafe(

          targetColumnIndex,

          0

        );



      if (

        selectedColumn < 0 ||

        selectedColumn >=

          maxColumns

      ) {

        setError(

          'Select a valid column.'

        );



        return;

      }



      setActiveColumnOverrides(

        (previous) => ({

          ...previous,



          [String(

            selectedColumn

          )]: clamp(

            customTableCount,

            1,

            MAX_ROWS

          ),

        })

      );



      setNotice(

        `Column ${

          selectedColumn + 1

        } depth updated. Save the room configuration to apply it.`

      );

    };



  const handleClearOverridesCache =

    () => {

      setActiveColumnOverrides(

        {}

      );



      setNotice(

        'Custom column depths have been cleared. Save the room configuration to apply the change.'

      );

    };



  // =========================================================

  // UPDATE ROOM DIMENSIONS

  // =========================================================



  const updateRoomConfiguration =

    async ({

      rows,

      cols,

      columnBounds =

        activeColumnOverrides,

    }) => {

      if (!currentRoom) {

        return false;

      }



      const payload = {

        room_no:

          currentRoom.room_no,



        rows: clamp(

          rows,

          1,

          MAX_ROWS

        ),



        cols: clamp(

          cols,

          1,

          MAX_COLS

        ),



        column_bounds:

          columnBounds,

      };



      setUpdatingRoom(true);

      setError('');

      setNotice('');



      try {

        const response =

          await axios.post(

            `${API_BASE_URL}/admin/inject-room-node`,

            payload

          );



        if (

          response.status >= 200 &&

          response.status < 300

        ) {

          setNotice(

            `Room ${payload.room_no} configuration was updated.`

          );



          await fetchActiveRooms();



          return true;

        }



        return false;

      } catch (err) {

        console.error(

          'Room update failed:',

          err

        );



        setError(

          err.response?.data

            ?.detail ||

            'Unable to update the room configuration.'

        );



        return false;

      } finally {

        setUpdatingRoom(false);

      }

    };



  const handleUpdateRoomMetrics =

    async (

      targetActionType,

      changeField

    ) => {

      if (!currentRoom) {

        return;

      }



      let rows = clamp(

        currentRoom.rows,

        1,

        MAX_ROWS

      );



      let cols = clamp(

        currentRoom.cols,

        1,

        MAX_COLS

      );



      const change =

        targetActionType ===

        'increase'

          ? 1

          : -1;



      if (

        changeField === 'rows'

      ) {

        rows = clamp(

          rows + change,

          1,

          MAX_ROWS

        );

      }



      if (

        changeField === 'cols'

      ) {

        cols = clamp(

          cols + change,

          1,

          MAX_COLS

        );

      }



      await updateRoomConfiguration(

        {

          rows,

          cols,

        }

      );

    };



  const saveColumnOverrides =

    async () => {

      if (!currentRoom) {

        return;

      }



      await updateRoomConfiguration(

        {

          rows:

            currentRoom.rows,



          cols:

            currentRoom.cols,



          columnBounds:

            activeColumnOverrides,

        }

      );

    };



  // =========================================================

  // REGENERATE PLAN

  // =========================================================



  const runAIPlanOptimizer =

    async (strategyType) => {

      if (

        solverStatus !== 'idle'

      ) {

        return;

      }



      setSolverStatus(

        strategyType

      );



      setError('');

      setNotice('');



      try {

        const response =

          await axios.post(

            `${API_BASE_URL}/admin/regenerate-plan`,

            {

              mode: 'Double',

              strategy:

                strategyType,

            }

          );



        if (

          response.status >= 200 &&

          response.status < 300

        ) {

          if (

            strategyType ===

            'ONLY_ADD_REMAINING'

          ) {

            setNotice(

              'Remaining students were added using the available room capacity.'

            );

          } else {

            setNotice(

              'The complete seating plan was recalculated successfully.'

            );

          }



          await fetchActiveRooms();

        }

      } catch (err) {

        console.error(

          'Seating plan regeneration failed:',

          err

        );



        setError(

          err.response?.data

            ?.detail ||

            'Unable to regenerate the seating plan.'

        );

      } finally {

        setSolverStatus(

          'idle'

        );

      }

    };



  // =========================================================

  // DYNAMIC GRID HELPERS

  // =========================================================



  const getDynamicRowLength = (

    targetRoom,

    columnIndex

  ) => {

    if (!targetRoom) {

      return 0;

    }



    const storedBounds =

      parseColumnBounds(

        targetRoom.column_bounds

      );



    const key =

      String(columnIndex);



    if (

      String(

        targetRoom.room_no

      ) ===

        String(

          selectedModifyRoom

        ) &&

      Object.prototype.hasOwnProperty.call(

        activeColumnOverrides,

        key

      )

    ) {

      return clamp(

        activeColumnOverrides[

          key

        ],

        1,

        MAX_ROWS

      );

    }



    if (

      Object.prototype.hasOwnProperty.call(

        storedBounds,

        key

      )

    ) {

      return clamp(

        storedBounds[key],

        1,

        MAX_ROWS

      );

    }



    return clamp(

      targetRoom.rows,

      1,

      MAX_ROWS

    );

  };



  const getSeatRecord = (

    roomNo,

    coordinateLabel

  ) => {

    const normalizedRoom =

      normalizeRoomNo(roomNo);



    return studentSeatsData.find(

      (student) =>

        normalizeRoomNo(

          student.room_no

        ) === normalizedRoom &&

        String(

          student.seat_no || ''

        )

          .trim()

          .toUpperCase() ===

          String(

            coordinateLabel

          ).toUpperCase()

    );

  };



  // =========================================================

  // SUMMARY

  // =========================================================



  const roomSummary = useMemo(

    () => {

      const totalBroken =

        rooms.reduce(

          (

            total,

            room

          ) =>

            total +

            getBrokenTables(

              room

            ).length,

          0

        );



      const totalAssigned =

        studentSeatsData.length;



      const totalPresent =

        studentSeatsData.filter(

          (student) =>

            String(

              student.attendance_status ||

                ''

            )

              .toLowerCase()

              .startsWith(

                'present'

              )

        ).length;



      return {

        rooms:

          rooms.length,



        totalBroken,



        totalAssigned,



        totalPresent,

      };

    },

    [

      rooms,

      studentSeatsData,

    ]

  );



  // =========================================================

  // LOADING

  // =========================================================



  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-slate-50">



        <div className="text-center">



          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50">



            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />



          </div>



          <h2 className="text-base font-semibold text-slate-900">

            Loading room configuration

          </h2>



          <p className="mt-1 text-sm text-slate-500">

            Preparing examination hall layouts...

          </p>



        </div>



      </div>

    );

  }



  // =========================================================

  // UI

  // =========================================================



  return (

    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">



      {/* =====================================================

          HEADER

      ===================================================== */}



      <header className="border-b border-slate-200 bg-white">



        <div className="mx-auto flex max-w-[1800px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">



          <div className="flex items-start gap-4">



            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">



              <Building2 size={22} />



            </div>



            <div>



              <div className="flex flex-wrap items-center gap-3">



                <h1 className="text-2xl font-bold tracking-tight text-slate-900">

                  Room Configuration

                </h1>



                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">



                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />



                  Connected

                </span>



              </div>



              <p className="mt-1.5 text-sm leading-6 text-slate-500">

                Create examination halls, configure room dimensions and manage seating layouts.

              </p>



            </div>



          </div>



          <button

            type="button"

            onClick={() =>

              fetchActiveRooms({

                manual: true,

              })

            }

            disabled={refreshing}

            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"

          >



            <RefreshCw

              size={16}

              className={

                refreshing

                  ? 'animate-spin'

                  : ''

              }

            />



            {refreshing

              ? 'Refreshing'

              : 'Refresh Data'}



          </button>



        </div>



      </header>



      <main className="mx-auto max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">



        {/* ===================================================

            ALERTS

        =================================================== */}



        {error && (

          <AlertBox

            type="error"

            message={error}

            onClose={() =>

              setError('')

            }

          />

        )}



        {notice && (

          <AlertBox

            type="success"

            message={notice}

            onClose={() =>

              setNotice('')

            }

          />

        )}



        {/* ===================================================

            SUMMARY

        =================================================== */}



        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">



          <MetricCard

            label="Configured Halls"

            value={roomSummary.rooms}

            icon={<Building2 size={19} />}

            tone="indigo"

          />



          <MetricCard

            label="Allocated Students"

            value={

              roomSummary.totalAssigned

            }

            icon={<Users size={19} />}

            tone="blue"

          />



          <MetricCard

            label="Present Students"

            value={

              roomSummary.totalPresent

            }

            icon={

              <UserCheck size={19} />

            }

            tone="emerald"

          />



          <MetricCard

            label="Damaged Tables"

            value={

              roomSummary.totalBroken

            }

            icon={

              <AlertTriangle

                size={19}

              />

            }

            tone="red"

          />



        </section>



        {/* ===================================================

            MAIN GRID

        =================================================== */}



        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">



          {/* =================================================

              LEFT CONTROL PANEL

          ================================================= */}



          <aside className="space-y-5">



            {/* ROOM LIST */}



            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">



              <div className="border-b border-slate-200 p-5">



                <div className="flex items-center justify-between">



                  <div>



                    <h2 className="font-semibold text-slate-900">

                      Examination Halls

                    </h2>



                    <p className="mt-0.5 text-xs text-slate-500">

                      Select a room to configure

                    </p>



                  </div>



                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">

                    {rooms.length}

                  </span>



                </div>



                <div className="relative mt-4">



                  <Search

                    size={15}

                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"

                  />



                  <input

                    type="search"

                    value={roomSearch}

                    onChange={(

                      event

                    ) =>

                      setRoomSearch(

                        event.target

                          .value

                      )

                    }

                    placeholder="Search rooms..."

                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"

                  />



                </div>



              </div>



              <div className="max-h-72 space-y-1 overflow-y-auto p-2">



                {filteredRooms.map(

                  (room) => {

                    const active =

                      String(

                        room.room_no

                      ) ===

                      String(

                        selectedModifyRoom

                      );



                    const broken =

                      getBrokenTables(

                        room

                      ).length;



                    return (

                      <button

                        type="button"

                        key={

                          room.room_no

                        }

                        onClick={() => {

                          setSelectedModifyRoom(

                            String(

                              room.room_no

                            )

                          );



                          setActiveColumnOverrides(

                            {}

                          );

                        }}

                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${

                          active

                            ? 'bg-indigo-50 text-indigo-700'

                            : 'text-slate-600 hover:bg-slate-50'

                        }`}

                      >



                        <div className="flex items-center gap-3">



                          <div

                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${

                              active

                                ? 'bg-indigo-100 text-indigo-600'

                                : 'bg-slate-100 text-slate-500'

                            }`}

                          >

                            <Building2 size={16} />

                          </div>



                          <div>



                            <p className="text-sm font-semibold">

                              Room {room.room_no}

                            </p>



                            <p className="mt-0.5 text-xs text-slate-400">

                              {room.rows || '—'} rows · {room.cols || '—'} columns

                            </p>



                          </div>



                        </div>



                        <div className="flex items-center gap-2">



                          {broken > 0 && (

                            <span className="h-2 w-2 rounded-full bg-red-500" />

                          )}



                          <ChevronRight

                            size={15}

                            className="text-slate-300"

                          />



                        </div>



                      </button>

                    );

                  }

                )}



                {filteredRooms.length ===

                  0 && (

                  <div className="py-10 text-center">



                    <Building2

                      size={24}

                      className="mx-auto text-slate-300"

                    />



                    <p className="mt-3 text-sm font-medium text-slate-700">

                      No rooms found

                    </p>



                  </div>

                )}



              </div>



            </section>



            {/* CREATE ROOM */}



            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">



              <div className="flex items-start gap-3">



                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">



                  <Plus size={19} />



                </div>



                <div>



                  <h2 className="font-semibold text-slate-900">

                    Create New Room

                  </h2>



                  <p className="mt-0.5 text-xs leading-5 text-slate-500">

                    Add a new examination hall and define its basic dimensions.

                  </p>



                </div>



              </div>



              <form

                onSubmit={

                  handleCreateNewRoom

                }

                className="mt-5 space-y-4"

              >



                <FormField

                  label="Room Number"

                >

                  <input

                    type="text"

                    value={newRoomNo}

                    onChange={(

                      event

                    ) =>

                      setNewRoomNo(

                        event.target

                          .value

                      )

                    }

                    placeholder="Enter room number"

                    className="input-control"

                  />

                </FormField>



                <div className="grid grid-cols-2 gap-3">



                  <FormField label="Rows">

                    <input

                      type="number"

                      min="1"

                      max={MAX_ROWS}

                      value={newRows}

                      onChange={(

                        event

                      ) =>

                        setNewRows(

                          event.target

                            .value

                        )

                      }

                      className="input-control"

                    />

                  </FormField>



                  <FormField label="Columns">

                    <input

                      type="number"

                      min="1"

                      max={MAX_COLS}

                      value={newCols}

                      onChange={(

                        event

                      ) =>

                        setNewCols(

                          event.target

                            .value

                        )

                      }

                      className="input-control"

                    />

                  </FormField>



                </div>



                <button

                  type="submit"

                  disabled={

                    creatingRoom

                  }

                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"

                >



                  {creatingRoom ? (

                    <Loader2

                      size={16}

                      className="animate-spin"

                    />

                  ) : (

                    <Plus size={16} />

                  )}



                  {creatingRoom

                    ? 'Creating Room...'

                    : 'Create Room'}



                </button>



              </form>



            </section>



            {/* SEATING PLAN ACTIONS */}



            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">



              <div className="flex items-start gap-3">



                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">



                  <Shuffle size={18} />



                </div>



                <div>



                  <h2 className="font-semibold text-slate-900">

                    Seating Allocation

                  </h2>



                  <p className="mt-0.5 text-xs leading-5 text-slate-500">

                    Update allocations after room configuration changes.

                  </p>



                </div>



              </div>



              <div className="mt-5 space-y-2.5">



                <button

                  type="button"

                  onClick={() =>

                    runAIPlanOptimizer(

                      'ONLY_ADD_REMAINING'

                    )

                  }

                  disabled={

                    solverStatus !==

                    'idle'

                  }

                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"

                >



                  {solverStatus ===

                  'ONLY_ADD_REMAINING' ? (

                    <Loader2

                      size={16}

                      className="animate-spin"

                    />

                  ) : (

                    <Users size={16} />

                  )}



                  Add Remaining Students



                </button>



                <button

                  type="button"

                  onClick={() =>

                    runAIPlanOptimizer(

                      'RESET_ENTIRE_PLAN'

                    )

                  }

                  disabled={

                    solverStatus !==

                    'idle'

                  }

                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"

                >



                  {solverStatus ===

                  'RESET_ENTIRE_PLAN' ? (

                    <Loader2

                      size={16}

                      className="animate-spin"

                    />

                  ) : (

                    <Shuffle size={16} />

                  )}



                  Recalculate Entire Plan



                </button>



              </div>



            </section>



          </aside>



          {/* =================================================

              RIGHT SIDE

          ================================================= */}



          <div className="min-w-0 space-y-5">



            {!currentRoom ? (

              <EmptyRoomState />

            ) : (

              <>

                {/* ROOM HEADER */}



                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">



                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">



                    <div>



                      <p className="text-xs font-medium text-indigo-600">

                        Selected Examination Hall

                      </p>



                      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">

                        Room {currentRoom.room_no}

                      </h2>



                      <p className="mt-1 text-sm text-slate-500">

                        Configure dimensions and review the current seating layout.

                      </p>



                    </div>



                    <div className="flex flex-wrap gap-2">



                      <SmallMetric

                        icon={

                          <Rows size={15} />

                        }

                        label="Rows"

                        value={

                          currentRoom.rows ||

                          '—'

                        }

                      />



                      <SmallMetric

                        icon={

                          <Columns size={15} />

                        }

                        label="Columns"

                        value={

                          currentRoom.cols ||

                          '—'

                        }

                      />



                      <SmallMetric

                        icon={

                          <AlertTriangle

                            size={15}

                          />

                        }

                        label="Damaged"

                        value={

                          getBrokenTables(

                            currentRoom

                          ).length

                        }

                      />



                    </div>



                  </div>



                </section>



                {/* CONFIGURATION */}



                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">



                  <div className="flex items-start gap-3">



                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">



                      <Settings2 size={18} />



                    </div>



                    <div>



                      <h2 className="font-semibold text-slate-900">

                        Room Dimensions

                      </h2>



                      <p className="mt-0.5 text-xs leading-5 text-slate-500">

                        Change the number of rows and columns or configure uneven column depths.

                      </p>



                    </div>



                  </div>



                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">



                    <DimensionControl

                      title="Rows"

                      value={

                        currentRoom.rows

                      }

                      icon={

                        <Rows size={17} />

                      }

                      disabled={

                        updatingRoom

                      }

                      onDecrease={() =>

                        handleUpdateRoomMetrics(

                          'decrease',

                          'rows'

                        )

                      }

                      onIncrease={() =>

                        handleUpdateRoomMetrics(

                          'increase',

                          'rows'

                        )

                      }

                    />



                    <DimensionControl

                      title="Columns"

                      value={

                        currentRoom.cols

                      }

                      icon={

                        <Columns size={17} />

                        }

                      disabled={

                        updatingRoom

                      }

                      onDecrease={() =>

                        handleUpdateRoomMetrics(

                          'decrease',

                          'cols'

                        )

                      }

                      onIncrease={() =>

                        handleUpdateRoomMetrics(

                          'increase',

                          'cols'

                        )

                      }

                    />



                  </div>



                  {/* CUSTOM COLUMN */}



                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">



                    <div className="flex items-start gap-3">



                      <SlidersHorizontal

                        size={17}

                        className="mt-0.5 shrink-0 text-indigo-600"

                      />



                      <div>



                        <h3 className="text-sm font-semibold text-slate-800">

                          Custom Column Depth

                        </h3>



                        <p className="mt-0.5 text-xs text-slate-500">

                          Use this when one column has fewer or more rows than the standard room layout.

                        </p>



                      </div>



                    </div>



                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">



                      <FormField label="Column">



                        <select

                          value={

                            targetColumnIndex

                          }

                          onChange={(

                            event

                          ) =>

                            setTargetColumnIndex(

                              event

                                .target

                                .value

                            )

                          }

                          className="input-control"

                        >



                          {Array.from(

                            {

                              length:

                                intSafe(

                                  currentRoom.cols,

                                  0

                                ),

                            },

                            (_, index) => (

                              <option

                                key={

                                  index

                                }

                                value={

                                  index

                                }

                              >

                                Column {index + 1}

                              </option>

                            )

                          )}



                        </select>



                      </FormField>



                      <FormField label="Rows in Column">



                        <input

                          type="number"

                          min="1"

                          max={

                            MAX_ROWS

                          }

                          value={

                            customTableCount

                          }

                          onChange={(

                            event

                          ) =>

                            setCustomTableCount(

                              event

                                .target

                                .value

                            )

                          }

                          className="input-control"

                        />



                      </FormField>



                      <button

                        type="button"

                        onClick={

                          handleLockColumnOverride

                        }

                        className="mt-auto inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"

                      >



                        <Save size={15} />

                        Set Column



                      </button>



                      <button

                        type="button"

                        onClick={

                          handleClearOverridesCache

                        }

                        className="mt-auto inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"

                      >



                        <RotateCcw size={15} />

                        Clear



                      </button>



                    </div>



                    {Object.keys(

                      activeColumnOverrides

                    ).length > 0 && (

                      <div className="mt-4 border-t border-slate-200 pt-4">



                        <div className="mb-3 flex flex-wrap gap-2">



                          {Object.entries(

                            activeColumnOverrides

                          ).map(

                            ([

                              column,

                              rows,

                            ]) => (

                              <span

                                key={

                                  column

                                }

                                className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700"

                              >

                                Column {Number(column) + 1}: {rows} rows

                              </span>

                            )

                          )}



                        </div>



                        <button

                          type="button"

                          disabled={

                            updatingRoom

                          }

                          onClick={

                            saveColumnOverrides

                          }

                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"

                        >



                          {updatingRoom ? (

                            <Loader2

                              size={15}

                              className="animate-spin"

                            />

                          ) : (

                            <Save size={15} />

                          )}



                          Save Room Configuration



                        </button>



                      </div>

                    )}



                  </div>



                </section>



                {/* =============================================

                    VISUAL LAYOUT

                ============================================= */}



                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">



                  <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">



                    <div className="flex items-center gap-3">



                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">



                        <LayoutGrid size={18} />



                      </div>



                      <div>



                        <h2 className="font-semibold text-slate-900">

                          Seating Layout Preview

                        </h2>



                        <p className="mt-0.5 text-xs text-slate-500">

                          Current room structure and attendance status

                        </p>



                      </div>



                    </div>



                    <div className="flex flex-wrap gap-3">



                      <Legend

                        color="bg-slate-200 border-slate-300"

                        label="Unoccupied / Absent"

                      />



                      <Legend

                        color="bg-emerald-500"

                        label="Present"

                      />



                      <Legend

                        color="bg-red-500"

                        label="Damaged"

                      />



                    </div>



                  </div>



                  <RoomLayoutPreview

                    room={

                      currentRoom

                    }

                    columnOverrides={

                      activeColumnOverrides

                    }

                    getDynamicRowLength={

                      getDynamicRowLength

                    }

                    getBrokenTables={

                      getBrokenTables

                    }

                    getSeatRecord={

                      getSeatRecord

                    }

                  />



                </section>

              </>

            )}



          </div>



        </div>



      </main>



      {/* LOCAL UTILITY CLASS */}



      <style>{`

        .input-control {

          width: 100%;

          border: 1px solid rgb(203 213 225);

          border-radius: 0.75rem;

          background: white;

          padding: 0.625rem 0.75rem;

          font-size: 0.875rem;

          color: rgb(15 23 42);

          outline: none;

          transition: all 150ms ease;

        }



        .input-control:focus {

          border-color: rgb(99 102 241);

          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);

        }



        .input-control::placeholder {

          color: rgb(148 163 184);

        }

      `}</style>



    </div>

  );

};



// =============================================================

// ROOM LAYOUT

// =============================================================



const RoomLayoutPreview = ({

  room,

  columnOverrides,

  getDynamicRowLength,

  getBrokenTables,

  getSeatRecord,

}) => {

  const columns =

    Number.parseInt(

      room?.cols,

      10

    ) || 0;



  if (columns <= 0) {

    return (

      <div className="flex min-h-[360px] items-center justify-center p-8 text-center">



        <div>



          <LayoutGrid

            size={28}

            className="mx-auto text-slate-300"

          />



          <p className="mt-3 text-sm font-semibold text-slate-700">

            Layout unavailable

          </p>



          <p className="mt-1 text-xs text-slate-500">

            Configure room rows and columns first.

          </p>



        </div>



      </div>

    );

  }



  const brokenTables =

    getBrokenTables(room);



  return (

    <div className="overflow-x-auto bg-slate-50/60 p-5 sm:p-6">



      <div

        className="grid min-w-max gap-4"

        style={{

          gridTemplateColumns: `repeat(${columns}, minmax(115px, 1fr))`,

        }}

      >



        {Array.from(

          {

            length: columns,

          },

          (_, colIndex) => {

            const rowLimit =

              getDynamicRowLength(

                room,

                colIndex

              );



            const hasOverride =

              Object.prototype.hasOwnProperty.call(

                columnOverrides,

                String(

                  colIndex

                )

              );



            return (

              <div

                key={

                  colIndex

                }

                className={`rounded-xl border bg-white p-3 ${

                  hasOverride

                    ? 'border-indigo-300 ring-2 ring-indigo-500/5'

                    : 'border-slate-200'

                }`}

              >



                <div className="mb-3 border-b border-slate-100 pb-2 text-center">



                  <p className="text-xs font-semibold text-slate-700">

                    Column {colIndex + 1}

                  </p>



                  <p className="mt-0.5 text-[11px] text-slate-400">

                    {rowLimit} rows

                  </p>



                </div>



                <div className="space-y-2">



                  {Array.from(

                    {

                      length:

                        rowLimit,

                    },

                    (

                      _,

                      rowIndex

                    ) => {

                      const coordinate =

                        `R${rowIndex + 1}C${colIndex + 1}`;



                      // Preserve existing table ID convention.

                      const tableId =

                        `T${rowIndex * columns + colIndex}`;



                      const isBroken =

                        brokenTables.includes(

                          tableId

                        );



                      const seatRecord =

                        getSeatRecord(

                          room.room_no,

                          coordinate

                        );



                      const isPresent =

                        String(

                          seatRecord?.attendance_status ||

                            ''

                        )

                          .toLowerCase()

                          .startsWith(

                            'present'

                          );



                      let status =

                        'Available';



                      let classes =

                        'border-slate-200 bg-slate-50 text-slate-600';



                      let icon = (

                        <Armchair

                          size={14}

                        />

                      );



                      if (isBroken) {

                        status =

                          'Damaged';



                        classes =

                          'border-red-200 bg-red-50 text-red-700';



                        icon = (

                          <AlertTriangle

                            size={14}

                          />

                        );

                      } else if (

                        isPresent

                      ) {

                        status =

                          'Present';



                        classes =

                          'border-emerald-200 bg-emerald-50 text-emerald-700';



                        icon = (

                          <UserCheck

                            size={14}

                          />

                        );

                      } else if (

                        seatRecord

                      ) {

                        status =

                          'Absent';



                        classes =

                          'border-amber-200 bg-amber-50 text-amber-700';



                        icon = (

                          <UserX

                            size={14}

                          />

                        );

                      }



                      return (

                        <div

                          key={

                            coordinate

                          }

                          className={`flex min-h-[54px] items-center justify-between rounded-lg border px-2.5 py-2 transition ${classes}`}

                        >



                          <div>



                            <p className="text-xs font-semibold">

                              {coordinate}

                            </p>



                            <p className="mt-0.5 text-[9px] font-medium">

                              {status}

                            </p>



                          </div>



                          {icon}



                        </div>

                      );

                    }

                  )}



                </div>



              </div>

            );

          }

        )}



      </div>



    </div>

  );

};



// =============================================================

// DIMENSION CONTROL

// =============================================================



const DimensionControl = ({

  title,

  value,

  icon,

  onDecrease,

  onIncrease,

  disabled,

}) => (

  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">



    <div className="flex items-center justify-between">



      <div className="flex items-center gap-2">



        <span className="text-indigo-600">

          {icon}

        </span>



        <span className="text-sm font-medium text-slate-600">

          {title}

        </span>



      </div>



      <span className="text-lg font-bold text-slate-900">

        {value || '—'}

      </span>



    </div>



    <div className="mt-4 grid grid-cols-2 gap-2">



      <button

        type="button"

        onClick={onDecrease}

        disabled={disabled}

        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"

      >

        − Remove

      </button>



      <button

        type="button"

        onClick={onIncrease}

        disabled={disabled}

        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"

      >

        + Add

      </button>



    </div>



  </div>

);



// =============================================================

// METRIC CARD

// =============================================================



const MetricCard = ({

  label,

  value,

  icon,

  tone = 'indigo',

}) => {

  const tones = {

    indigo:

      'bg-indigo-50 text-indigo-600',

    blue:

      'bg-blue-50 text-blue-600',

    emerald:

      'bg-emerald-50 text-emerald-600',

    red:

      'bg-red-50 text-red-600',

  };



  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">



      <div className="flex items-start justify-between gap-3">



        <div>



          <p className="text-xs font-medium text-slate-500 sm:text-sm">

            {label}

          </p>



          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">

            {value}

          </p>



        </div>



        <div

          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${

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



// =============================================================

// SMALL METRIC

// =============================================================



const SmallMetric = ({

  icon,

  label,

  value,

}) => (

  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">



    <span className="text-indigo-600">

      {icon}

    </span>



    <div>



      <p className="text-[10px] text-slate-400">

        {label}

      </p>



      <p className="text-xs font-semibold text-slate-800">

        {value}

      </p>



    </div>



  </div>

);



// =============================================================

// LEGEND

// =============================================================



const Legend = ({

  color,

  label,

}) => (

  <div className="flex items-center gap-1.5">



    <span

      className={`h-2.5 w-2.5 rounded border ${color}`}

    />



    <span className="text-xs font-medium text-slate-500">

      {label}

    </span>



  </div>

);



// =============================================================

// FORM FIELD

// =============================================================



const FormField = ({

  label,

  children,

}) => (

  <label className="block">



    <span className="mb-1.5 block text-xs font-medium text-slate-600">

      {label}

    </span>



    {children}



  </label>

);



// =============================================================

// ALERT

// =============================================================



const AlertBox = ({

  type,

  message,

  onClose,

}) => {

  const success =

    type === 'success';



  return (

    <div

      className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${

        success

          ? 'border-emerald-200 bg-emerald-50'

          : 'border-red-200 bg-red-50'

      }`}

    >



      <div className="flex items-start gap-3">



        {success ? (

          <CheckCircle2

            size={19}

            className="mt-0.5 shrink-0 text-emerald-600"

          />

        ) : (

          <AlertCircle

            size={19}

              className="mt-0.5 shrink-0 text-red-600"

            />

        )}



        <p

          className={`text-sm ${

            success

              ? 'text-emerald-800'

              : 'text-red-800'

          }`}

        >

          {message}

        </p>



      </div>



      <button

        type="button"

        onClick={onClose}

        className={`text-xs font-semibold ${

          success

            ? 'text-emerald-700'

            : 'text-red-700'

        }`}

      >

        Dismiss

      </button>



    </div>

  );

};



// =============================================================

// EMPTY STATE

// =============================================================



const EmptyRoomState = () => (

  <section className="flex min-h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">



    <div>



      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">

        <Building2 size={22} />

      </div>



      <h2 className="mt-4 font-semibold text-slate-800">

        No examination room selected

      </h2>



      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">

        Select an existing room or create a new room to configure its seating layout.

      </p>



    </div>



  </section>

);



export default AdminRoomsControlHub;