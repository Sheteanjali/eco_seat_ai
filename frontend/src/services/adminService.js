import { API } from './api';

export const adminService = {
  /**
   * One-Click CSV Ingestion for batch student uploads.
   * Supports upload progress tracking for large CSV files.
   * 
   * @param {File} file - CSV file object
   * @param {Function} [onProgress] - Optional callback (progressEvent) => void
   */
  uploadStudents: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return API.post('/admin/upload-students', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },

  /**
   * Trigger Recursive Backtracking seating algorithm.
   * 
   * @param {Array<string>} blockedSeats - Array of seat IDs (e.g., ['R1C2', 'R3C4'])
   * @param {Object} [config] - Additional parameters (e.g., room_id, shift, spacing rules)
   */
  generateSeating: (blockedSeats = [], config = {}) => {
    return API.post('/admin/generate-seating', { 
      blocked: blockedSeats,
      ...config
    });
  },

  /**
   * Fetch live room layout and seat status for spatial mapping.
   * 
   * @param {string|number} roomId - Room number or unique room identifier
   */
  getRoomLayout: (roomId) => {
    return API.get(`/admin/room-layout/${roomId}`);
  },

  /**
   * Fetch raw PDF blob manifest.
   * 
   * @param {string|number} roomId - Room identifier
   */
  downloadManifest: (roomId) => {
    return API.get(`/admin/export-pdf/${roomId}`, { 
      responseType: 'blob' 
    });
  },

  /**
   * Utility method to trigger an immediate PDF file download in the browser.
   * 
   * @param {string|number} roomId - Room identifier
   * @param {string} [filename] - Custom output filename
   */
  downloadManifestAndSave: async (roomId, filename = `room_${roomId}_manifest.pdf`) => {
    const response = await adminService.downloadManifest(roomId);
    
    // Create Blob URL and invoke browser download anchor
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup object URL from memory
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Clear allocated seats for a room or entire session reset.
   * 
   * @param {string|number} [roomId] - Optional room ID to clear specific room
   */
  clearSeating: (roomId = null) => {
    return API.post('/admin/clear-seating', { room_id: roomId });
  }
};

export default adminService;