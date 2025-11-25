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
  faPen,
} from "@fortawesome/free-solid-svg-icons";

const DoctorSignup = () => {
  const { doctorSignup, loading } = useContext(AppContext);
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("doctor");
  const [focusedField, setFocusedField] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [errors, setErrors] = useState({});

  // Email validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  
  const validateUsername = (username) =>
    /^[A-Za-z\s]+$/.test(username.trim());

  const handleChange = (e) => {
    let value = e.target.value;

    // Clean username: trim + collapse multiple spaces
    if (e.target.name === "username") {
      value = value.replace(/\s+/g, " ");
    }

    setFormData({ ...formData, [e.target.name]: value });

    if (e.target.name === "password") {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) return "";
    if (password.length < 6) return "Weak";
    if (
      password.match(/[A-Z]/) &&
      password.match(/[0-9]/) &&
      password.length >= 8
    )
      return "Strong";
    return "Medium";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.username || !validateUsername(formData.username)) {
      newErrors.username =
        "Username can only contain letters and spaces.";
    }

    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.password || passwordStrength === "Weak") {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.licenseNumber || formData.licenseNumber.trim().length < 5) {
      newErrors.licenseNumber = "License number must be at least 5 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const signupData = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      specialization: "general",
      licenseNumber: formData.licenseNumber.trim(),
    };

    console.log("📤 Doctor Signup Data:", signupData);
    const result = await doctorSignup(signupData);

    if (result?.success) {
      toast.success("Signup successful! OTP sent to your email.");
      localStorage.setItem(
        "pendingDoctorSignup",
        JSON.stringify(signupData)
      );
      navigate("/docverify-otp");
    } else {
      console.error("Signup Result Error:", result.error);
      if (result.error.includes("Email already exists")) {
        setErrors({ ...errors, email: "This email is already registered." });
      } else if (result.error.includes("Username taken")) {
        setErrors({ ...errors, username: "This username is already taken." });
      } else {
        toast.error(result.error || "Signup failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100 p-8 md:p-10 transform transition-all duration-300 hover:shadow-3xl">
        {/* Role Selector */}
        <div className="flex justify-center gap-6 mb-8">
          <button
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${
              selectedRole === "patient"
                ? "bg-blue-50 border-2 border-blue-400 text-blue-700 shadow-md"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 shadow-sm hover:shadow-md"
            }`}
            onClick={() => navigate("/signup")}
          >
            <FontAwesomeIcon icon={faUser} size="2x" className="mb-2" />
            <p className="text-sm font-semibold">Patient</p>
          </button>
          <button
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${
              selectedRole === "doctor"
                ? "bg-blue-50 border-2 border-blue-400 text-blue-700 shadow-md"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 shadow-sm hover:shadow-md"
            }`}
            onClick={() => setSelectedRole("doctor")}
          >
            <FontAwesomeIcon icon={faStethoscope} size="2x" className="mb-2" />
            <p className="text-sm font-semibold">Doctor</p>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Join as Doctor
          </h2>
          <p className="text-gray-600">Create your professional account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faUser}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="text"
                name="username"
                placeholder="Enter your full name"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField("")}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${
                  errors.username
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                required
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
                <span className="mr-1">⚠️</span>
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="email"
                name="email"
                placeholder="Enter your professional email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField("")}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${
                  errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                required
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
                <span className="mr-1">⚠️</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faLock}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
                className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${
                  errors.password
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                required
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
                <span className="mr-1">⚠️</span>
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faLock}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type={confirmPasswordVisible ? "text" : "password"}
                name="confirmPassword"
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
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                onClick={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              >
                <FontAwesomeIcon
                  icon={confirmPasswordVisible ? faEyeSlash : faEye}
                />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* License Number */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical License Number
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faStethoscope}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="text"
                name="licenseNumber"
                placeholder="Enter your medical license number"
                value={formData.licenseNumber}
                onChange={handleChange}
                onFocus={() => setFocusedField("licenseNumber")}
                onBlur={() => setFocusedField("")}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${
                  errors.licenseNumber
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                } focus:outline-none focus:ring-4 transition-all duration-200 text-gray-700 placeholder-gray-400`}
                required
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
                <span className="mr-1">⚠️</span>
                {errors.licenseNumber}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? (
              <span>
                Sign Up as Doctor
                <span className="ml-2 flex"></span>
                <span className="inline-block animate-bounce">.</span>
                <span
                  className="inline-block animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                >
                  .
                </span>
                <span
                  className="inline-block animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                >
                  .
                </span>
              </span>
            ) : (
              "Sign Up as Doctor"
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/doctor-login")}
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorSignup;

