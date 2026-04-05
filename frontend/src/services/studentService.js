import API from './api';

export const studentService = {
  // Retrieval: Seat info & Room No for the logged-in student
  getMySeat: (rollNo) => {
    return API.get(`/student/my-seat/${rollNo}`);
  },

  // Visualization: Get room dimensions and Digital Twin coordinates
  getRoomLayout: (roomNo) => {
    return API.get(`/student/room-layout/${roomNo}`);
  }
};