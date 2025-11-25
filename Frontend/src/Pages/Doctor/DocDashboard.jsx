import React, { useContext, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCalendarCheck,
  faUser,
  faRightFromBracket,
  faEnvelope,
  faUpload,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import AppContext from "../../Context/AppContext";
import { toast } from "sonner";
import logo from "../../assets/Logo- Blue.svg";

const DocDashboard = () => {
  const { logout } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/doctor-login");
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsMobileSidebarOpen(false); // Close mobile sidebar when navigating
  };

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen]);

  const navItemClasses = (path) =>
    `flex items-center gap-3 px-5 py-4 text-sm font-medium transition-all duration-300 rounded-xl cursor-pointer
     hover:scale-[1.02] hover:shadow-md hover:-translate-y-0.5 relative group overflow-hidden
     ${location.pathname === path
        ? "bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 text-blue-800 font-semibold shadow-lg border-l-4 border-blue-500 relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400/10 before:to-indigo-400/10 before:rounded-xl"
        : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:border-l-2 hover:border-gray-300"
     }`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-50 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
          </button>
          <img src={logo} alt="MediPredict Logo" className="h-4 w-auto sm:h-6 object-contain" />
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center text-sm"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="mr-1 sm:mr-2 w-4 h-4 sm:w-auto" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 relative">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0  z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          fixed lg:static top-0 left-0 w-64 lg:w-64 bg-white border-r border-gray-200 shadow-xl lg:shadow-lg
          h-[calc(150vh-80px)] lg:h-[calc(125vh-80px)] overflow-y-auto overflow-x-hidden backdrop-blur-sm
          transition-transform duration-300 ease-in-out z-50 lg:z-auto
        `}>
          {/* Mobile close button */}
          <div className="flex justify-between items-center p-4 lg:hidden">
            <img src={logo} alt="MediPredict Logo" className="h-4 w-auto" />
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
          </div>

          <nav className="py-8 px-4 lg:py-8 lg:px-4">
            <ul className="space-y-2">
              <li>
                <div onClick={() => handleNavClick("/docDashboard")} className={navItemClasses("/docDashboard")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/docDashboard"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faHouse} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Dashboard</span>
                </div>
              </li>
              <li>
                <div onClick={() => handleNavClick("/docDashboard/appointments")} className={navItemClasses("/docDashboard/appointments")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/docDashboard/appointments"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faCalendarCheck} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Appointments</span>
                </div>
              </li>
              <li>
                <div onClick={() => handleNavClick("/docDashboard/messages")} className={navItemClasses("/docDashboard/messages")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/docDashboard/messages"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Messages</span>
                </div>
              </li>
              <li>
                <div onClick={() => handleNavClick("/docDashboard/profile")} className={navItemClasses("/docDashboard/profile")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/docDashboard/profile"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Profile</span>
                </div>
              </li>
              <li>
                <div onClick={() => handleNavClick("/docDashboard/upload-blog")} className={navItemClasses("/docDashboard/upload-blog")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/docDashboard/upload-blog"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Upload Blog</span>
                </div>
              </li>

            </ul>
          </nav>
        </aside>

        {/* Main Content Outlet */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 bg-white lg:bg-transparent min-h-full transition-all duration-300 ${
          isMobileSidebarOpen ? 'lg:pointer-events-auto pointer-events-none' : 'pointer-events-auto'
        }`}>
          <div className="bg-white lg:bg-white rounded-lg lg:rounded-none shadow-sm lg:shadow-none p-4 sm:p-6 lg:p-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocDashboard;

