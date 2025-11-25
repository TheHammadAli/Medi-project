import React, { useState, useContext, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faPen } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AppContext from "../Context/AppContext";
import Spinner from "../Components/spinner";

const ChangePassword = () => {
  const { changePassword, loading } = useContext(AppContext);

  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const token = searchParams.get("token")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid reset link");
      navigate("/login");
    }
  }, [token, email, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const response = await changePassword({
      token,
      email,
      password: formData.password,
    });

    if (response?.success) {
      toast.success("Password changed successfully");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      toast.error(response?.error || "Failed to change password!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100 p-8 md:p-10 transform transition-all duration-300 hover:shadow-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faLock} className="text-2xl text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h2>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Field */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faLock}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="password"
                name="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-700 placeholder-gray-400"
                required
                minLength={6}
              />
              {focusedField === "password" && (
                <FontAwesomeIcon
                  icon={faPen}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse"
                />
              )}
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faLock}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-700 placeholder-gray-400"
                required
                minLength={6}
              />
              {focusedField === "confirmPassword" && (
                <FontAwesomeIcon
                  icon={faPen}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? (
              <span>
                Change Password
                <span className="ml-2 flex"></span>
                <span className="inline-block animate-bounce">.</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
            ) : (
              "Change Password"
            )}
          </button>
        </form>

        {/* Navigation to Login */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Remember your password?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;