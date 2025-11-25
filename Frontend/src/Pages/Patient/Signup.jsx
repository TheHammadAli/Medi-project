import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppContext from "../../Context/AppContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faStethoscope,
  faPen
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../../assets/Logo- Blue.svg";

const Signup = () => {
  const { signup, loading } = useContext(AppContext);
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("patient");
  const [focusedField, setFocusedField] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");

  // Regex validators
  const usernameRegex = /^[A-Za-z ]+$/;
  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._]*@gmail\.com$/i;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
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

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;
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

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const tempUser = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: selectedRole
    };

    localStorage.setItem("pendingSignup", JSON.stringify(tempUser));
    localStorage.setItem("pendingEmail", tempUser.email);

    const result = await signup(tempUser);

    if (result?.msg?.toLowerCase().includes("otp")) {
      toast.success("OTP sent to your email!");
      navigate("/verify-otp", { state: { email: tempUser.email } });
    } else {
      toast.error(result?.error || result?.msg || "Signup failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-200 rounded-full blur-2xl"></div>
      </div>
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10 transform transition-all duration-500 hover:shadow-3xl relative z-10 animate-fade-in">
        {/* Role Selector */}
        <div className="flex justify-center gap-6 mb-8">
          <button
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${
              selectedRole === "patient"
                ? "bg-blue-50 border-2 border-blue-400 text-blue-700 shadow-md"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 shadow-sm hover:shadow-md"
            }`}
            onClick={() => setSelectedRole("patient")}
          >
            <FontAwesomeIcon icon={faUser} size="2x" className="mb-2" />
            <p className="text-sm font-semibold">Patient</p>
          </button>
          <button
            className="flex flex-col items-center p-4 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => navigate("/doctor-signup")}
          >
            <FontAwesomeIcon icon={faStethoscope} size="2x" className="mb-2" />
            <p className="text-sm font-semibold">Doctor</p>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
          <p className="text-gray-600">Join MediPredict as a patient</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                value={formData.username}
                onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
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
            {formData.password && (
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
                value={formData.confirmPassword}
                onChange={handleChange}
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
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

        {/* Switch to Login */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

