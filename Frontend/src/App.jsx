import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppContext from "./Context/AppContext";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Spinner from "./Components/spinner.jsx";

// Pages & Components
import Dashboard from "./Pages/Patient/Dashboard";
import AuthPage from "./Pages/AuthPage";
import VerifyOTP from "./Pages/VerifyOTP";
import ContactUs from "./Components/ContactUs";
import FAQs from "./Components/FQAs";
import About from "./Components/About";
import Testimonials from "./Components/Testimonials";
import DocDashboard from "./Pages/Doctor/DocDashboard";
import DoctorPanel from "./Pages/Doctor/DoctorPanel";
import Appointments from "./Pages/Doctor/Appointments";
import Profile from "./Pages/Doctor/Profile";
import AllDoctor from "./Components/AllDoctor";
import PatientAppointments from "./Pages/Patient/PatientAppoinments";
import DoctorChatList from "./Pages/Doctor/DoctorChatList";
import DoctorChatWindow from "./Pages/Doctor/doctorChatWindow";
import Messages from "./Pages/Patient/Messages";
import Blogs from "./Pages/Doctor/Blogs";
import AllBlogs from "./Components/AllBlogs";
import BlogDetail from "./Components/BlogDetail";
import TermsAndServices from "./Components/TermsAndServices";
import PrivacyPolicy from "./Components/PrivacyPolicy";
import PatientChatList from "./Pages/Patient/PateintChatList";
import PatientProfile from "./Pages/Patient/PatientProfile";
import MyPrescriptions from "./Pages/Patient/MyPrescriptions";
import ForgetPassword from "./Pages/ForgetPassword";
import ChangePassword from "./Pages/ChangePassword";

const App = () => {
  const location = useLocation();
  const { loadingUser } = useContext(AppContext);
  const [routeLoading, setRouteLoading] = useState(false);

  // Only these routes show the spinner (authentication and critical routes)
  const spinnerRoutes = [
   
  ];

  const hideNavbarPaths = [
    "/docDashboard",
    "/docDashboard/appointments",
    "/docDashboard/profile",
    "/docDashboard/messages",
    "/docDashboard/upload-blog",
    "/auth",
    "/forgot-password",
    "/change-password",

    "/patient-chat",
    "/verify-otp",
  ];

  const shouldHideNavbar = hideNavbarPaths.some(path =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    const match = spinnerRoutes.some(path =>
      location.pathname.startsWith(path)
    );

    if (match) {
      // Only show loading for specific routes that need it
      setRouteLoading(true);
      // Brief delay only for critical routes to ensure smooth UX
      const timeout = setTimeout(() => setRouteLoading(false), 100);
      return () => clearTimeout(timeout);
    } else {
      setRouteLoading(false);
    }
  }, [location.pathname]);

  // Only show Spinner if loadingUser or current route is in spinnerRoutes
  if (loadingUser || routeLoading) return <Spinner />;

  return (
    <div className="min-h-screen flex flex-col">
      {!shouldHideNavbar && <Navbar />}

      <main className="flex-grow">
        <Routes>
          {/* Public and Patient Routes */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/docverify-otp" element={<VerifyOTP />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/about" element={<About />} />
          <Route path="/testimonial" element={<Testimonials />} />
          <Route path="/doctors" element={<AllDoctor />} />
          <Route path="/appointments" element={<PatientAppointments />} />
          <Route path="/patient-profile" element={<PatientProfile />} />
          <Route path="/my-prescriptions" element={<MyPrescriptions />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:docid" element={<Messages />} /> {/* Add dynamic route */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/all-blogs" element={<AllBlogs />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/terms-of-service" element={<TermsAndServices />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Redirect old routes to /auth */}
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/doctor-signup" element={<AuthPage />} />
          <Route path="/doctor-login" element={<AuthPage />} />
          <Route path="/docDashboard" element={<DocDashboard />}>
            <Route index element={<DoctorPanel />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="profile" element={<Profile />} />
            <Route path="messages" element={<DoctorChatList />} />
            <Route path="messages/:patientId" element={<DoctorChatWindow />} />
            <Route path="upload-blog" element={<Blogs />} />
          </Route>

        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;