
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUser, faPen } from "@fortawesome/free-solid-svg-icons";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Admin logged in successfully!");
        localStorage.setItem("adminToken", data.token);
        setLoading(false);
        navigate("/Admin");
      } else {
        toast.error(data.message || "Invalid credentials");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Server error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-8">
      <div className="bg-white/90 backdrop-blur-sm p-10 rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg transform transition-all duration-300 hover:shadow-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <FontAwesomeIcon icon={faLock} className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">

          {/* Email Input */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <FontAwesomeIcon icon={faUser} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField("")}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
              {focusedField === "email" && (
                <FontAwesomeIcon icon={faPen} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
              {focusedField === "password" && (
                <FontAwesomeIcon icon={faPen} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600  text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            {loading ? (
              <span>
                Sign In
                <span className="ml-2 flex"></span>
                <span className="inline-block animate-bounce">.</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">MediPredict Admin System</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
