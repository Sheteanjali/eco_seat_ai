import API from './api';

export const authService = {
  login: (credentials) => {
    return API.post('/auth/login', credentials);
  },

  // Registry: Saves data for 100% Conflict-Free Mapping
  signup: (studentData) => {
    return API.post('/auth/signup', studentData);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  }
};