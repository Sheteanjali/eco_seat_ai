// File: frontend/src/components/QRScanner.jsx

import React, { useRef, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  QrCode,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import axios from 'axios';


// File: frontend/src/components/QRScanner.jsx

const API_ROOT = (
  process.env.REACT_APP_API_URL ||
  'http://127.0.0.1:8765'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const API_BASE_URL = `${API_ROOT}/api`;


const QRScanner = ({ currentRoom }) => {
  const [scanData, setScanData] = useState(null);

  const [status, setStatus] = useState('idle');
  // idle | verifying | success | error

  const [errorMsg, setErrorMsg] = useState('');

  const scanLock = useRef(false);
  const resetTimer = useRef(null);


  /* =========================================================
     GET LOGGED-IN INVIGILATOR ROOM
  ========================================================= */

  const loggedInRoom =
    currentRoom ||
    localStorage.getItem('assigned_room') ||
    localStorage.getItem('assignedRoomNo') ||
    '';


  /* =========================================================
     ROOM NORMALIZATION
  ========================================================= */

  const normalizeRoom = (room) => {
    return String(room || '')
      .trim()
      .replace(/^DT-/i, '');
  };


  const normalizedCurrentRoom =
    normalizeRoom(loggedInRoom);


  /* =========================================================
     RESET SCANNER
  ========================================================= */

  const resetScanner = () => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    scanLock.current = false;

    setStatus('idle');
    setScanData(null);
    setErrorMsg('');
  };


  /* =========================================================
     HANDLE QR SCAN
  ========================================================= */

  const handleScan = async (detectedCodes) => {
    if (
      !detectedCodes ||
      detectedCodes.length === 0 ||
      scanLock.current
    ) {
      return;
    }

    const rawValue =
      detectedCodes?.[0]?.rawValue;

    if (!rawValue) {
      return;
    }

    scanLock.current = true;

    setStatus('verifying');
    setErrorMsg('');
    setScanData(null);

    try {
      /* -----------------------------------------------------
         CHECK INVIGILATOR ROOM
      ----------------------------------------------------- */

      if (!normalizedCurrentRoom) {
        throw new Error(
          'No examination room is assigned to this invigilator.'
        );
      }


      /* -----------------------------------------------------
         EXPECTED QR FORMAT

         RBU|ROLL_NO|PAPER_GROUP|ROOM

         This works for any room.
      ----------------------------------------------------- */

      const parts = rawValue
        .split('|')
        .map((item) => item.trim());


      if (parts.length < 4) {
        throw new Error(
          'Invalid QR format. Please scan a valid Eco-Seat entry pass.'
        );
      }


      const [
        prefix,
        rollNo,
        paperGroup,
        assignedRoom,
      ] = parts;


      /* -----------------------------------------------------
         VALIDATE QR PREFIX
      ----------------------------------------------------- */

      if (
        String(prefix).toUpperCase() !== 'RBU'
      ) {
        throw new Error(
          'Invalid examination QR code.'
        );
      }


      /* -----------------------------------------------------
         VALIDATE ROLL NUMBER
      ----------------------------------------------------- */

      if (!rollNo) {
        throw new Error(
          'Student roll number is missing from the QR code.'
        );
      }


      /* -----------------------------------------------------
         VALIDATE STUDENT ROOM
      ----------------------------------------------------- */

      const normalizedAssignedRoom =
        normalizeRoom(assignedRoom);


      if (!normalizedAssignedRoom) {
        throw new Error(
          'Student room information is missing from the QR code.'
        );
      }


      if (
        normalizedAssignedRoom.toLowerCase() !==
        normalizedCurrentRoom.toLowerCase()
      ) {
        throw new Error(
          `Wrong examination hall. Student is assigned to Room ${assignedRoom}.`
        );
      }


      /* -----------------------------------------------------
         BACKEND VERIFICATION

         Dynamic URL:
         /invigilator/scan-gate/{assigned_room}
      ----------------------------------------------------- */

      const response = await axios.post(
        `${API_BASE_URL}/invigilator/scan-gate/${encodeURIComponent(
          normalizedCurrentRoom
        )}`,
        {
          roll_no: rollNo,
        }
      );


      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      if (response.data?.success) {
        setScanData({
          ...response.data,

          roll_no: rollNo,

          paper_group: paperGroup,

          room_no:
            normalizedAssignedRoom,
        });

        setStatus('success');


        /* Auto prepare for next student */

        resetTimer.current = setTimeout(
          () => {
            scanLock.current = false;

            setStatus('idle');

            setScanData(null);

            setErrorMsg('');
          },
          3500
        );

        return;
      }


      throw new Error(
        response.data?.message ||
          'Unable to verify student.'
      );

    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Unable to verify QR code.';


      setErrorMsg(message);

      setStatus('error');

      scanLock.current = false;
    }
  };


  /* =========================================================
     SCANNER ERROR
  ========================================================= */

  const handleScannerError = (error) => {
    console.error(
      'QR Scanner Error:',
      error
    );
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-lg
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
          items-center
          justify-between
          gap-4
          border-b
          border-slate-100
          bg-white
          px-6
          py-5
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

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
            <ScanLine
              size={21}
              strokeWidth={2}
            />
          </div>


          <div>

            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-slate-400
              "
            >
              Gate Verification
            </p>


            <h2
              className="
                mt-0.5
                text-base
                font-bold
                text-slate-900
              "
            >
              QR Entry Scanner
            </h2>

          </div>

        </div>


        {/* CURRENT ROOM */}

        <div
          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-3
            py-2
          "
        >

          <MapPin
            size={14}
            className="text-indigo-600"
          />


          <div>

            <p
              className="
                text-[7px]
                font-bold
                uppercase
                tracking-wider
                text-slate-400
              "
            >
              Assigned Room
            </p>


            <p
              className="
                text-xs
                font-bold
                text-slate-800
              "
            >
              {normalizedCurrentRoom ||
                'Not Assigned'}
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          STATUS BAR
      ===================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-100
          bg-slate-50/70
          px-6
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
            className={`
              h-2
              w-2
              rounded-full

              ${
                !normalizedCurrentRoom
                  ? 'bg-red-500'
                  : status === 'success'
                    ? 'bg-emerald-500'
                    : status === 'error'
                      ? 'bg-red-500'
                      : status === 'verifying'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500'
              }
            `}
          />


          <span
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-[0.15em]
              text-slate-500
            "
          >

            {!normalizedCurrentRoom &&
              'Room Not Assigned'}

            {normalizedCurrentRoom &&
              status === 'idle' &&
              'Scanner Ready'}

            {normalizedCurrentRoom &&
              status === 'verifying' &&
              'Verifying Identity'}

            {normalizedCurrentRoom &&
              status === 'success' &&
              'Verification Successful'}

            {normalizedCurrentRoom &&
              status === 'error' &&
              'Verification Failed'}

          </span>

        </div>


        <ShieldCheck
          size={16}
          className="text-slate-400"
        />

      </div>


      {/* =====================================================
          NO ROOM ASSIGNED WARNING
      ===================================================== */}

      {!normalizedCurrentRoom && (
        <div className="px-6 pt-6">

          <div
            className="
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-amber-200
              bg-amber-50
              p-4
            "
          >

            <AlertCircle
              size={19}
              className="
                mt-0.5
                shrink-0
                text-amber-600
              "
            />


            <div>

              <p
                className="
                  text-xs
                  font-bold
                  text-slate-900
                "
              >
                Examination room not assigned
              </p>


              <p
                className="
                  mt-1
                  text-[10px]
                  leading-relaxed
                  text-slate-500
                "
              >
                This invigilator account does not
                currently have an assigned room.
                Please contact the administrator.
              </p>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          SCANNER VIEWPORT
      ===================================================== */}

      <div className="p-6">

        <div
          className={`
            relative
            overflow-hidden
            rounded-2xl
            border-2
            bg-slate-950
            transition-all
            duration-300

            ${
              status === 'success'
                ? 'border-emerald-400'
                : status === 'error'
                  ? 'border-red-300'
                  : 'border-slate-200'
            }
          `}
        >

          <div className="aspect-square w-full">

            <Scanner
              onScan={handleScan}
              onError={handleScannerError}
            />

          </div>


          {/* SCAN FRAME */}

          <div
            className="
              pointer-events-none
              absolute
              inset-6
            "
          >

            <span
              className="
                absolute
                left-0
                top-0
                h-9
                w-9
                rounded-tl-xl
                border-l-[3px]
                border-t-[3px]
                border-white
              "
            />


            <span
              className="
                absolute
                right-0
                top-0
                h-9
                w-9
                rounded-tr-xl
                border-r-[3px]
                border-t-[3px]
                border-white
              "
            />


            <span
              className="
                absolute
                bottom-0
                left-0
                h-9
                w-9
                rounded-bl-xl
                border-b-[3px]
                border-l-[3px]
                border-white
              "
            />


            <span
              className="
                absolute
                bottom-0
                right-0
                h-9
                w-9
                rounded-br-xl
                border-b-[3px]
                border-r-[3px]
                border-white
              "
            />

          </div>


          {/* VERIFYING OVERLAY */}

          {status === 'verifying' && (

            <div
              className="
                absolute
                inset-0
                flex
                flex-col
                items-center
                justify-center
                bg-slate-950/75
                backdrop-blur-sm
              "
            >

              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white
                  shadow-xl
                "
              >

                <Loader2
                  size={27}
                  className="
                    animate-spin
                    text-indigo-600
                  "
                />

              </div>


              <p
                className="
                  mt-4
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-white
                "
              >
                Verifying Candidate
              </p>


              <p
                className="
                  mt-1
                  text-[9px]
                  text-slate-300
                "
              >
                Checking room and seat allocation
              </p>

            </div>

          )}

        </div>


        {/* CAMERA INSTRUCTION */}

        {status === 'idle' && (
          <div
            className="
              mt-4
              flex
              items-center
              justify-center
              gap-2
              text-slate-400
            "
          >

            <Camera size={13} />


            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-wider
              "
            >
              Position QR code inside the frame
            </p>

          </div>
        )}

      </div>


      {/* =====================================================
          RESULT / FEEDBACK
      ===================================================== */}

      <div className="px-6 pb-6">

        {/* IDLE */}

        {status === 'idle' && (
          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  text-slate-400
                "
              >

                <QrCode size={17} />

              </div>


              <div>

                <p
                  className="
                    text-[10px]
                    font-bold
                    text-slate-700
                  "
                >
                  Ready for verification
                </p>


                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-slate-400
                  "
                >
                  Scan the student's Eco-Seat
                  examination entry pass.
                </p>

              </div>

            </div>

          </div>
        )}


        {/* SUCCESS */}

        {status === 'success' &&
          scanData && (

            <div
              className="
                rounded-2xl
                border
                border-emerald-200
                bg-emerald-50/70
                p-5
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-4
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
                    bg-emerald-100
                    text-emerald-600
                  "
                >

                  <UserCheck size={22} />

                </div>


                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <h3
                      className="
                        truncate
                        text-sm
                        font-bold
                        text-slate-900
                      "
                    >
                      {scanData.student_name}
                    </h3>


                    <CheckCircle2
                      size={15}
                      className="
                        shrink-0
                        text-emerald-500
                      "
                    />

                  </div>


                  <p
                    className="
                      mt-1
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.15em]
                      text-emerald-700
                    "
                  >
                    Identity Verified
                  </p>


                  <div
                    className="
                      mt-4
                      grid
                      grid-cols-2
                      gap-2
                    "
                  >

                    <InfoBox
                      label="Assigned Seat"
                      value={
                        scanData.assigned_seat ||
                        'N/A'
                      }
                    />


                    <InfoBox
                      label="Room"
                      value={
                        scanData.room_no ||
                        normalizedCurrentRoom
                      }
                    />


                    <InfoBox
                      label="Roll Number"
                      value={
                        scanData.roll_no ||
                        'N/A'
                      }
                    />


                    <InfoBox
                      label="Paper Group"
                      value={
                        scanData.paper_group ||
                        'N/A'
                      }
                    />

                  </div>

                </div>

              </div>

            </div>

          )}


        {/* ERROR */}

        {status === 'error' && (

          <div
            className="
              rounded-2xl
              border
              border-red-200
              bg-red-50/70
              p-5
            "
          >

            <div
              className="
                flex
                items-start
                gap-4
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
                  bg-red-100
                  text-red-600
                "
              >

                <AlertCircle size={22} />

              </div>


              <div className="flex-1">

                <h3
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                  "
                >
                  Verification Failed
                </h3>


                <p
                  className="
                    mt-1.5
                    text-[10px]
                    leading-relaxed
                    text-red-600
                  "
                >
                  {errorMsg}
                </p>


                <button
                  type="button"
                  onClick={resetScanner}
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-2
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-600
                    shadow-sm
                    transition-all
                    hover:border-indigo-200
                    hover:text-indigo-600
                  "
                >

                  <RefreshCcw size={13} />

                  Scan Again

                </button>

              </div>

            </div>

          </div>

        )}

      </div>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-t
          border-slate-100
          bg-slate-50/70
          px-6
          py-3
        "
      >

        <p
          className="
            text-[8px]
            font-bold
            uppercase
            tracking-[0.15em]
            text-slate-400
          "
        >
          Eco-Seat AI Secure Gate
        </p>


        <div
          className="
            flex
            items-center
            gap-1.5
          "
        >

          <ShieldCheck
            size={11}
            className={
              normalizedCurrentRoom
                ? 'text-emerald-500'
                : 'text-slate-400'
            }
          />


          <span
            className="
              text-[8px]
              font-bold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            {normalizedCurrentRoom
              ? 'Verification Active'
              : 'Waiting for Room'}
          </span>

        </div>

      </div>

    </section>
  );
};


/* ===========================================================
   INFORMATION BOX
=========================================================== */

const InfoBox = ({
  label,
  value,
}) => (
  <div
    className="
      rounded-lg
      border
      border-emerald-100
      bg-white
      px-3
      py-2.5
    "
  >

    <p
      className="
        text-[7px]
        font-bold
        uppercase
        tracking-wider
        text-slate-400
      "
    >
      {label}
    </p>


    <p
      className="
        mt-0.5
        truncate
        text-xs
        font-bold
        text-slate-800
      "
      title={String(value)}
    >
      {value}
    </p>

  </div>
);


export default QRScanner;