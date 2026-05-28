import axios from 'axios';

// ==========================================
// Centralized Axios Instance Configuration
// ==========================================
const apiClient = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout or other default settings here if needed
  // timeout: 10000,
});

// Optional: Add interceptors for request/response handling (e.g., auth tokens, global error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized error handling could go here
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==========================================
// Teacher APIs
// ==========================================
export const teacherAPI = {
  getAll: () => apiClient.get('vadmin/teachers/'),
  getById: (id) => apiClient.get(`vadmin/teachers/${id}/`),
  create: (data) => apiClient.post('vadmin/teachers/', data),
  update: (id, data) => apiClient.put(`vadmin/teachers/${id}/`, data),
  delete: (id) => apiClient.delete(`vadmin/teachers/${id}/`),
};

// ==========================================
// Subject APIs
// ==========================================
export const subjectAPI = {
  getAll: () => apiClient.get('vadmin/subjects/'),
  getById: (id) => apiClient.get(`vadmin/subjects/${id}/`),
  create: (data) => apiClient.post('vadmin/subjects/', data),
  update: (id, data) => apiClient.put(`vadmin/subjects/${id}/`, data),
  delete: (id) => apiClient.delete(`vadmin/subjects/${id}/`),
};

// ==========================================
// Class APIs
// ==========================================
export const classAPI = {
  getAll: () => apiClient.get('vadmin/tt-classes/'),
  getById: (id) => apiClient.get(`vadmin/tt-classes/${id}/`),
  create: (data) => apiClient.post('vadmin/tt-classes/', data),
  update: (id, data) => apiClient.put(`vadmin/tt-classes/${id}/`, data),
  delete: (id) => apiClient.delete(`vadmin/tt-classes/${id}/`),
};

// ==========================================
// School Settings APIs
// ==========================================
export const settingsAPI = {
  get: () => apiClient.get('vadmin/school-settings/'),
  update: (data) => apiClient.post('vadmin/school-settings/', data),
};

export const timetableAPI = {
  getAll: () => apiClient.get('vadmin/timetable/'),
  generate: (data) => apiClient.post('vadmin/timetable/generate/', data)
};

// ==========================================
// Exam Timetable APIs
// ==========================================
export const examAPI = {
  getAll: (grade) => apiClient.get('vadmin/exam-timetable/', { params: { grade } }),
  create: (data) => apiClient.post('vadmin/exam-timetable/', data),
  update: (id, data) => apiClient.put(`vadmin/exam-timetable/${id}/`, data),
  delete: (id) => apiClient.delete(`vadmin/exam-timetable/${id}/`),
  getFreeTeachers: (exam_date, start_time, end_time) => 
    apiClient.get('vadmin/free-teachers/', { params: { exam_date, start_time, end_time } }),
};

// ==========================================
// Master ERP APIs (Staff & Classes)
// ==========================================
export const masterStaffAPI = {
  getAll: () => apiClient.get('vadmin/staff/'),
};

export const masterClassAPI = {
  getAll: () => apiClient.get('vadmin/classes/'),
};

export default apiClient;
