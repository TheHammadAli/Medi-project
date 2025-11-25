import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faSignOutAlt, faUser, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import AppContext from "../Context/AppContext";
import PatientProfileContext from "../Context/PatientProfileContext";
import logo from "../assets/Logo- Blue.svg";

const Navbar = () => {
  const { user, logout, loadingUser } = useContext(AppContext);
  const { patientProfile, loading: loadingProfile, getProfile } = useContext(PatientProfileContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const desktopClicked = desktopDropdownRef.current && desktopDropdownRef.current.contains(event.target);
      const mobileClicked = mobileDropdownRef.current && mobileDropdownRef.current.contains(event.target);

      if (!desktopClicked && !mobileClicked) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loadingUser) return null;

  const navLinks = [
    { name: "Home", link: "/dashboard" },
    ...(user ? [{ name: "All Doctor", link: "/doctors" }] : []),
    { name: "About", link: "/about" },
    { name: "Contact", link: "/contact" },
    { name: "Blog", link: "/all-blogs" },
    { name: "FAQs", link: "/faqs" },
    ...(user ? [{ name: "Appointments", link: "/appointments" }] : []),
    ...(user ? [{ name: "Messages", link: "/messages" }] : []),
    
  ];

  // ✅ Auth Button Fragment
  const AuthButtons = ({ mobile = false, dropdownRef }) => {
    if (loadingUser || loadingProfile) return null;

    if (user) {
      return (
        <div className={`${mobile ? "w-full" : "relative"}`} ref={dropdownRef}>
          {/* Profile Image/Icon and Dropdown Icon */}
          <div className={`${mobile ? "flex items-center justify-center gap-3 w-full" : "flex items-center justify-end gap-2"}`}>
            {/* Profile Image or Upload Icon */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsProfileDropdownOpen(!isProfileDropdownOpen);
              }}
              className="flex items-center justify-center w-10 h-10 border border-gray-400 rounded-full hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
            >
              {patientProfile?.profileImage ? (
                <img
                  src={patientProfile.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-gray-500 text-lg"
                />
              )}
            </button>

            {/* Dropdown Icon */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsProfileDropdownOpen(!isProfileDropdownOpen);
              }}
              className="text-gray-500 hover:text-gray-700  p-1"
            >
              <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
            </button>
          </div>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className={`${
              mobile ? "absolute left-0 mt-3 w-full" : "absolute right-0 mt-3"
            } ${mobile ? "w-full" : "w-64"} bg-gradient-to-br from-white via-gray-50 to-blue-50/30 rounded-2xl shadow-xl py-2 z-[100] border border-blue-100/60
              backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200 ease-out`}>
              <div className="px-2">
                <Link
                  to="/patient-profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen(false);
                    setIsOpen(false);
                  }}
                  className={`${
                    mobile ? "w-full text-center justify-center" : ""
                  } flex items-center px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-indigo-100/60
                    hover:text-blue-900 transition-all duration-200 group rounded-xl mb-1`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mr-4 group-hover:bg-blue-200 transition-colors">
                    <FontAwesomeIcon icon={faUser} className="text-blue-600 group-hover:text-blue-700 transition-colors text-sm" />
                  </div>
                  <span className="tracking-wide">My Profile</span>
                </Link>
                <Link
                  to="/my-prescriptions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen(false);
                    setIsOpen(false);
                  }}
                  className={`${
                    mobile ? "w-full text-center justify-center" : ""
                  } flex items-center px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gradient-to-r hover:from-green-100/80 hover:to-emerald-100/60
                    hover:text-green-900 transition-all duration-200 group rounded-xl mb-1`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mr-4 group-hover:bg-green-200 transition-colors">
                    <FontAwesomeIcon icon={faBars} className="text-green-600 group-hover:text-green-700 transition-colors text-sm" />
                  </div>
                  <span className="tracking-wide">My Prescriptions</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                    setIsProfileDropdownOpen(false);
                  }}
                  className={`${
                    mobile ? "w-full justify-center" : "w-full text-left"
                  } flex items-center px-4 py-3 text-sm font-semibold text-red-700 hover:bg-gradient-to-r hover:from-red-100/80 hover:to-pink-100/60
                    hover:text-red-900 transition-all duration-200 group rounded-xl`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 mr-4 group-hover:bg-red-200 transition-colors">
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-red-600 group-hover:text-red-700 transition-colors text-sm" />
                  </div>
                  <span className="tracking-wide">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Link
          to="/signup"
          onClick={() => setIsOpen(false)}
          className={`${
            mobile ? "block w-full text-center" : ""
          } bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition`}
        >
          Sign Up
        </Link>
      );
    }
  };
  

  return (
    <nav className="bg-white shadow-md w-full sticky top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src={logo}
              alt="MediPredict Logo"
              className="h-4 w-auto sm:h-6 object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6 text-gray-700 font-medium">
            {navLinks.map((item, i) => (
              <li key={i} className="relative group">
                <Link
                  to={item.link}
                  className="relative text-gray-700 hover:text-blue-600 transition duration-200
                    after:content-[''] after:absolute after:left-0 after:-bottom-1
                    after:h-[2px] after:w-0 hover:after:w-full
                    after:bg-blue-600 after:transition-all"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            <AuthButtons dropdownRef={desktopDropdownRef} />
          </div>

          {/* Mobile Section */}
          <div className="md:hidden flex items-center gap-3">
            <AuthButtons mobile dropdownRef={mobileDropdownRef} />
            <button className="text-gray-700" onClick={() => setIsOpen(true)}>
              <FontAwesomeIcon icon={faBars} size="lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 w-64 h-full bg-white shadow-lg transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 overflow-visible`}
      >
        <button
          className="absolute top-4 right-4 text-gray-700 text-2xl"
          onClick={() => setIsOpen(false)}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <ul className="flex flex-col items-start p-6 space-y-6 text-gray-700 text-lg font-medium mt-10">
          {navLinks.map((item, i) => (
            <li key={i}>
              <Link
                to={item.link}
                className="hover:text-blue-600 transition"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

      </div>
    </nav>
  );
};

export default Navbar;

