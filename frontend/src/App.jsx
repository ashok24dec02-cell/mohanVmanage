import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Home from './home/home';
import Admission from './admin/admission/Admission';
import AdminLogin from './admin/login/Login';
import AdminHome from './admin/home/AdminHome';
import NewAdmission from './admin/admission/New_Admission';
import StaffManagement from './admin/staff_management/StaffManagement';
import AdminLayout from './admin/layout/AdminLayout';
import Timetable from './admin/timetable_management/ttms/pages/Timetable';


// Student Pages
import StudentLogin from './Student/login/Login';
import StudentLayout from './Student/layout/StudentLayout';
import StudentHome from './Student/StudentHome';
import TimeTable from './Student/TimeTable';
import Homework from './Student/Homework';
import HomeworkDetails from './Student/HomeworkDetails';
import ExamMarks from './Student/ExamMarks';
import StudentPerformance from './Student/StudentPerformance';
import DrugDetection from './Student/DrugDetection';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admission" element={<Admission />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Admin Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="new-admission" element={<NewAdmission />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="timetable" element={<Timetable />} />

      </Route>

      {/* Student Routes */}
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student/dashboard" element={<StudentLayout />}>
        <Route index element={<StudentHome />} />
        <Route path="timetable" element={<TimeTable />} />
        <Route path="homework" element={<Homework />} />
        <Route path="exam-marks" element={<ExamMarks />} />
        <Route path="drug-detection" element={<DrugDetection />} />
        <Route path="performance" element={<StudentPerformance />} />
        <Route path="homework-details" element={<HomeworkDetails />} />
      </Route>
      <Route path="/student" element={<Navigate to="/student/login" replace />} />
    </Routes>
  </Router>
    </AuthProvider>
  );
}

export default App; 
