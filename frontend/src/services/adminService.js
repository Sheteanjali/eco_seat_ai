import API from './api';

export const adminService = {
  // One-Click CSV Ingestion for 1,500 students
  uploadStudents: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/admin/upload-students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Trigger Recursive Backtracking solver
  generateSeating: (blockedSeats) => {
    return API.post('/admin/generate-seating', { blocked: blockedSeats });
  },

  // Export: Download Signed PDF Manifest
  downloadManifest: (roomId) => {
    return API.get(`/admin/export-pdf/${roomId}`, { responseType: 'blob' });
  }
};