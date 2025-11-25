import React, { useContext } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faStethoscope,
  faUser,
  faComments,
  faBullhorn,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

import AppContext from "../../../Frontend/src/Context/AppContext";
import { toast } from "sonner";
import logo from "../assets/Logo- Blue.svg";

const AdminDashboard = () => {
  const { logout } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/admin-login");
  };

  const navItemClasses = (path) =>
    `flex items-center gap-3 px-5 py-4 text-sm font-medium transition-all duration-300 rounded-xl cursor-pointer
     hover:scale-[1.02] hover:shadow-md hover:-translate-y-0.5 relative group overflow-hidden
     ${location.pathname === path
        ? "bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 text-blue-800 font-semibold shadow-lg border-l-4 border-blue-500 relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400/10 before:to-indigo-400/10 before:rounded-xl"
        : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:border-l-2 hover:border-gray-300"
     }`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-10 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="MediPredict Logo" className="h-4 w-auto sm:h-6 object-contain" />
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" />
          Logout
        </button>
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 shadow-xl">
          <nav className="py-8 px-4">
            <ul className="space-y-2">
              <li>
                <div onClick={() => navigate("/Admin")} className={navItemClasses("/Admin")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/Admin"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faHouse} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Dashboard</span>
                </div>
              </li>
              <li>
                <div onClick={() => navigate("/admin/doctors")} className={navItemClasses("/admin/doctors")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/admin/doctors"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faStethoscope} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Doctors</span>
                </div>
              </li>
              <li>
                <div onClick={() => navigate("/admin/patients")} className={navItemClasses("/admin/patients")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/admin/patients"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Patients</span>
                </div>
              </li>
              <li>
                <div onClick={() => navigate("/admin/feedbacks")} className={navItemClasses("/admin/feedbacks")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/admin/feedbacks"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faComments} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Feedbacks</span>
                </div>
              </li>
              <li>
                <div onClick={() => navigate("/admin/announcements")} className={navItemClasses("/admin/announcements")}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    location.pathname === "/admin/announcements"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    <FontAwesomeIcon icon={faBullhorn} className="w-4 h-4" />
                  </div>
                  <span className="tracking-wide font-medium">Announcements</span>
                </div>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 sm:p-8 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
