import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AdminLogin from './Pages/AdminLogin';
import AdminDashboard from './Pages/AdminDashboard';
import AdminPanel from './Pages/AdminPanal';
import Patients from './Pages/Patients';
import Doctors from './Pages/Doctors';
import Feedbacks from './Pages/Feedbacks';
import Announcements from './Pages/Announcements';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect root / to /admin-login */}
        <Route path="/" element={<Navigate to="/admin-login" replace />} />

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/Admin" element={<AdminDashboard />}>
          <Route index element={<AdminPanel />} />
          <Route path="patients" element={<Patients />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="feedbacks" element={<Feedbacks />} />
          <Route path="announcements" element={<Announcements />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
