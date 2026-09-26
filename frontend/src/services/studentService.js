import { API } from './api';

export const studentService = {
  /**
   * Retrieves assigned seat, room number, paper group, and exam details for candidate.
   * 
   * @param {string} rollNo - Student's roll/registration number
   * @param {Object} [options] - Optional request configs (e.g., AbortController signal)
   */
  getMySeat: (rollNo, options = {}) => {
    return API.get(`/api/student/seat/${rollNo}`, options);
  },

  /**
   * Fetches room layout, dimensions, and Digital Twin spatial coordinates.
   * 
   * @param {string|number} roomNo - Assigned examination room/hall identifier
   * @param {Object} [options] - Optional request configs
   */
  getRoomLayout: (roomNo, options = {}) => {
    return API.get(`/api/admin/room-layout/${roomNo}`, options);
  },

  /**
   * Fetches live attendance entry verification status (e.g., scanned at door/gate).
   * 
   * @param {string} rollNo - Student's roll number
   */
  getLiveAttendanceStatus: (rollNo) => {
    return API.get(`/api/student/dashboard-stats/${rollNo}`);
  }
};

export default studentService;