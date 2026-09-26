import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8765';

// 1. Instantiate Centralized Axios Client
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor: Inject JWT Token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Global 401 Session Expiry Redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 4. API Service Interface
const apiService = {
  
  // --- AUTHENTICATION ---
  login: (credentials) => api.post('/api/auth/login', credentials),
  signup: (userData) => api.post('/api/auth/signup', userData),


  // --- ADMIN COMMAND CENTER ---

  /**
   * Dual-Stream Bulk Ingestion (Students + Classrooms CSVs)
   * @param {FormData} formData - Multipart form containing 'students_file' and 'rooms_file'
   * @param {Function} [onProgress] - Optional upload progress callback
   */
  uploadBulkData: (formData, onProgress) => api.post('/api/admin/upload-bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  }),

  // Fetches master allocation list for PDF generation & global seating charts
  getAllSeating: () => api.get('/api/admin/all-seating'),

  // Fetches high-level solver stats, room fill ratios, and branch counts
  getAnalytics: () => api.get('/api/admin/analytics'),


  // --- STUDENT PORTAL ---
  getStudentSeat: (rollNo, options = {}) => api.get(`/api/student/seat/${rollNo}`, options),
  getDashboardStats: (rollNo) => api.get(`/api/student/dashboard-stats/${rollNo}`),
  resetEngine: () => api.post('/api/admin/reset-engine'),
};

export default apiService;
export const API = api;
