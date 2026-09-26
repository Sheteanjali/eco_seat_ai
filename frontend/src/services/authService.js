import { API } from './api';

export const authService = {
  /**
   * Authenticates user, receives JWT token and role, and saves session info.
   * @param {Object} credentials - { username/roll_no, password }
   */
  login: async (credentials) => {
    const response = await API.post('/api/auth/login', credentials);
    const { token, role, roll_no, name } = response.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role || 'student');
      if (roll_no) localStorage.setItem('userRollNo', roll_no);
      if (name) localStorage.setItem('userName', name);
    }

    return response;
  },

  /**
   * Register new student or invigilator node into backend registry.
   * @param {Object} studentData - Student registration payload
   */
  signup: (studentData) => {
    return API.post('/api/auth/signup', studentData);
  },

  /**
   * Clears all session keys from localStorage and redirects user to login.
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userRollNo');
    localStorage.removeItem('userName');
    
    // Clear any residual session caches
    localStorage.clear();
    
    window.location.href = '/login';
  },

  /**
   * Retrieves current logged-in user profile attributes from local storage.
   */
  getCurrentUser: () => {
    return {
      token: localStorage.getItem('token'),
      role: localStorage.getItem('role'),
      rollNo: localStorage.getItem('userRollNo'),
      name: localStorage.getItem('userName'),
    };
  },

  /**
   * Returns true if user has a valid active token stored.
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Returns current active user role (e.g., 'admin', 'invigilator', 'student').
   */
  getRole: () => {
    return localStorage.getItem('role') || 'student';
  }
};

export default authService;