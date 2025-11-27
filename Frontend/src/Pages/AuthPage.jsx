import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppContext from "../Context/AppContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faPen,
  faUserMd,
  faUserInjured,
  faChevronDown,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../assets/Logo- Blue.svg";

const AuthPage = () => {
  const { signup, login, loading } = useContext(AppContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("signup");
  const [focusedField, setFocusedField] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.role-dropdown')) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    licenseNumber: ""
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");

  // Regex validators
  const usernameRegex = /^[A-Za-z ]+$/;
  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._]*@gmail\.com$/i;

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const checkPasswordStrength = (password) => {
    if (!password) return "";
    if (password.length < 6) return "Weak";
    if (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[\W_]/.test(password)
    )
      return "Strong";
    return "Medium";
  };

  const validateSignupForm = () => {
    const { username, email, password, confirmPassword } = signupForm;
    const newErrors = {};

    if (!username.trim()) newErrors.username = "Username is required.";
    else if (!usernameRegex.test(username.trim()))
      newErrors.username = "Username can only contain letters and spaces.";

    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!emailRegex.test(email.trim()))
      newErrors.email = "Email must be a valid Gmail address.";

    if (!password) newErrors.password = "Password is required.";
    else if (passwordStrength === "Weak")
      newErrors.password = "Password is too weak.";

    if (!confirmPassword)
      newErrors.confirmPassword = "Confirm Password is required.";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    if (signupForm.role === "doctor" && !signupForm.licenseNumber.trim())
      newErrors.licenseNumber = "License number is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!validateSignupForm()) return;

    const tempUser = {
      username: signupForm.username.trim(),
      email: signupForm.email.trim().toLowerCase(),
      password: signupForm.password,
      role: signupForm.role
    };

    if (signupForm.role === "doctor") {
      tempUser.licenseNumber = signupForm.licenseNumber.trim();
      localStorage.setItem("pendingDoctorSignup", JSON.stringify(tempUser));
    } else {
      localStorage.setItem("pendingSignup", JSON.stringify(tempUser));
    }
    localStorage.setItem("pendingEmail", tempUser.email);

    const result = await signup(tempUser);

    if (result?.msg?.toLowerCase().includes("otp")) {
      toast.success("OTP sent to your email!");
      navigate("/verify-otp", { state: { email: tempUser.email } });
    } else {
      toast.error(result?.error || result?.msg || "Signup failed.");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const result = await login(loginForm);

    if (result) {
      toast.success("Login successful");

      // Navigate based on role
      setTimeout(() => {
        if (result.role === "doctor") {
          navigate("/docDashboard");
        } else {
          navigate("/dashboard");
        }
      }, 500);
    } else {
      toast.error("Invalid email or password!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-300 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-300 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-green-200 rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="w-full max-w-lg bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10 transform transition-all duration-500 hover:shadow-3xl relative z-10 animate-fade-in">

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTab("signup")}
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                activeTab === "signup"
                  ? "bg-white text-blue-600 shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setActiveTab("login")}
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                activeTab === "login"
                  ? "bg-white text-blue-600 shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              Login
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {activeTab === "signup" ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-600 text-lg">
            {activeTab === "signup"
              ? "Join MediPredict to access personalized healthcare services."
              : "Sign in to your account to continue your healthcare journey."
            }
          </p>
        </div>

        {/* Forms */}
        {activeTab === "signup" ? (
          <form onSubmit={handleSignupSubmit} className="space-y-6">
            {/* Role Selector */}
            <div className="relative group role-dropdown">
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
              <div className="relative">
                <div
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full pl-4 pr-16 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-700 cursor-pointer bg-white flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={signupForm.role === "patient" ? faUserInjured : faUserMd}
                      className="mr-3 text-blue-500"
                    />
                    <span className="capitalize">{signupForm.role}</span>
                  </div>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`absolute right-4 text-gray-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                {isRoleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                    <div
                      onClick={() => {
                        setSignupForm((prev) => ({ ...prev, role: "patient" }));
                        setIsRoleDropdownOpen(false);
                      }}
                      className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200 rounded-t-xl"
                    >
                      <FontAwesomeIcon icon={faUserInjured} className="mr-3 text-blue-500" />
                      <span>Patient</span>
                    </div>
                    <div
                      onClick={() => {
                        setSignupForm((prev) => ({ ...prev, role: "doctor" }));
                        setIsRoleDropdownOpen(false);
                      }}
                      className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200 rounded-b-xl"
                    >
                      <FontAwesomeIcon icon={faUserMd} className="mr-3 text-blue-500" />
                      <span>Doctor</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

{signupForm.role === "doctor" && (
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faIdCard}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  name="licenseNumber"
                  type="text"
                  placeholder="Enter your license number"
                  value={signupForm.licenseNumber}
                  onChange={handleSignupChange}
                  onFocus={() => setFocusedField("licenseNumber")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${
                    errors.licenseNumber
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                />
                {focusedField === "licenseNumber" && (
                  <FontAwesomeIcon
                    icon={faPen}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse"
                  />
                )}
              </div>
              {errors.licenseNumber && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>{errors.licenseNumber}
                </p>
              )}
            </div>
)}

{/* Username */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={signupForm.username}
                  onChange={handleSignupChange}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${
                    errors.username
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                />
                {focusedField === "username" && (
                  <FontAwesomeIcon
                    icon={faPen}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse"
                  />
                )}
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>{errors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={signupForm.email}
                  onChange={handleSignupChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${
                    errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                />
                {focusedField === "email" && (
                  <FontAwesomeIcon
                    icon={faPen}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse"
                  />
                )}
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>{errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Create a password"
                  value={signupForm.password}
                  onChange={handleSignupChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${
                    errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  <FontAwesomeIcon icon={passwordVisible ? faEyeSlash : faEye} />
                </button>
              </div>
              {signupForm.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password Strength:</span>
                    <span
                      className={`font-medium ${
                        passwordStrength === "Weak"
                          ? "text-red-500"
                          : passwordStrength === "Medium"
                          ? "text-yellow-500"
                          : "text-green-600"
                      }`}
                    >
                      {passwordStrength}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength === "Weak"
                          ? "bg-red-500 w-1/3"
                          : passwordStrength === "Medium"
                          ? "bg-yellow-500 w-2/3"
                          : "bg-green-500 w-full"
                      }`}
                    ></div>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>{errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  name="confirmPassword"
                  type={confirmPasswordVisible ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={signupForm.confirmPassword}
                  onChange={handleSignupChange}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${
                    errors.confirmPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                >
                  <FontAwesomeIcon icon={confirmPasswordVisible ? faEyeSlash : faEye} />
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>{errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span>
                  Sign Up
                  <span className="ml-2 flex"></span>
                  <span className="inline-block animate-bounce">.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-700 placeholder-gray-400"
                  required
                />
                {focusedField === "email" && (
                  <FontAwesomeIcon
                    icon={faPen}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse"
                  />
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-700 placeholder-gray-400"
                  required
                />
                {focusedField === "password" && (
                  <FontAwesomeIcon
                    icon={faPen}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse"
                  />
                )}
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? (
                <span>
                  Login
                  <span className="ml-2 flex"></span>
                  <span className="inline-block animate-bounce">.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthPage;