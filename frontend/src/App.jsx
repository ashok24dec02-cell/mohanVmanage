import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './home/home';
import Admission from './admin/admission/Admission';
import AdminLogin from './admin/login/Login';
import AdminHome from './admin/home/AdminHome';
import NewAdmission from './admin/admission/New_Admission';

import StaffManagement from './admin/staff_management/StaffManagement';
import AdminLayout from './admin/layout/AdminLayout';
import Timetable from './admin/timetable_management/ttms/pages/Timetable';

function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
}

export default App;
