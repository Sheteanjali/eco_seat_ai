import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiService = {
  
  // --- AUTHENTICATION ---
  login: (credentials) => api.post('/api/auth/login', credentials),
  signup: (userData) => api.post('/api/auth/signup', userData),


  // --- ADMIN COMMAND CENTER ---

  // THE DUAL-STREAM FIX:
  // Uploads both Students AND Classrooms to trigger the 1,500-seat solver.
  uploadBulkData: (formData) => api.post('/api/admin/upload-bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // --- ADDED: This connects to the /all-seating endpoint for your PDF ---
  getAllSeating: () => api.get('/api/admin/all-seating'),

  getAnalytics: () => api.get('/api/admin/analytics'),


  // --- STUDENT PORTAL ---
  getStudentSeat: (rollNo) => api.get(`/api/student/seat/${rollNo}`),
  getDashboardStats: (rollNo) => api.get(`/api/student/dashboard-stats/${rollNo}`),
};

export default apiService;