import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import socket from "../Socket/socket";

// Create Context
const AppContext = createContext();

// Backend URLs
const BASE_URL = "http://localhost:8000/api/auth";
const BASE_URL1 = "http://localhost:8000/api";

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testimonials, setTestimonials] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);

  // Log BASE_URL for debugging
  console.log("🔍 BASE_URL:", BASE_URL);
  console.log("🔍 BASE_URL1:", BASE_URL1);

  // Utility function to validate JWT token format
  const isValidTokenFormat = (token) => {
    return token && typeof token === 'string' && token.split('.').length === 3;
  };

  // Fetch user profile on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");

    console.log("🔍 AppContext: Checking token on mount:", token ? "Token exists" : "No token");
    console.log("🔍 AppContext: Token format valid:", token ? isValidTokenFormat(token) : "N/A");
    console.log("🔍 AppContext: Current user context before profile fetch:", user);

    if (token && isValidTokenFormat(token)) {
      console.log("🔍 AppContext: Fetching user profile...");
      axios
        .get(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("✅ AppContext: Profile fetched successfully:", res.data);
          console.log("🔍 AppContext: User ID from profile:", res.data._id);
          console.log("🔍 AppContext: User role from profile:", res.data.role);
          console.log("🔍 AppContext: Current user context before update:", user);

          // Only update if the profile data is different or if we don't have user data yet
          if (!user || user._id !== res.data._id) {
            console.log("🔍 AppContext: Updating user context with profile data");
            setUser(res.data);
          } else {
            console.log("🔍 AppContext: Profile data matches current user, no update needed");
          }
        })
        .catch((err) => {
          console.error("❌ AppContext: Profile Fetch Error:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          // Don't logout on profile fetch error, as the token might still be valid
          console.log("⚠️ AppContext: Profile fetch failed, keeping existing user context");
        })
        .finally(() => setLoadingUser(false));
    } else if (token && !isValidTokenFormat(token)) {
      console.error("❌ AppContext: Invalid token format in localStorage, clearing...");
      logout(); // Clear malformed token
      setLoadingUser(false);
    } else {
      console.log("🔍 AppContext: No valid token found, user not logged in");
      setLoadingUser(false);
    }
  }, []);

  // Emit user-online when user is authenticated and socket connected
  useEffect(() => {
    const emitOnline = () => {
      if (user && user._id && user.role) {
        console.log(`🔌 [AppContext] Emitting user-online for ${user.role}: ${user._id}`);
        socket.emit("user-online", { userId: user._id, role: user.role });
      }
    };

    if (socket.connected) {
      emitOnline();
    }

    const handleConnect = () => {
      emitOnline();
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user]);

  // Patient Signup
  const signup = async (userData) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/register`, userData);
      setLoading(false);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Signup failed! Try again.";
      console.error("❌ Patient Signup Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  // Patient Login
  const login = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/login`, credentials);
      const token = res.data.token;

      console.log("🔍 Patient Login - Response user data:", res.data.user);
      console.log("🔍 Patient Login - User ID from response:", res.data.user._id);

      // Validate token format before storing
      if (token && typeof token === 'string' && token.split('.').length === 3) {
        localStorage.setItem("token", token);
        console.log("🔍 Patient Login - Setting user context with:", res.data.user);
        setUser(res.data.user);
        setLoading(false);
        return true;
      } else {
        throw new Error("Invalid token format received from server");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Invalid login credentials";
      console.error("❌ Patient Login Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return false;
    }
  };

  // Patient OTP Verification
  const verifyOTP = async (otpData) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/verify-otp`, otpData);
      const token = res.data.token;

      // Validate token format before storing
      if (token && typeof token === 'string' && token.split('.').length === 3) {
        localStorage.setItem("token", token);
        setUser(res.data.user);
        setLoading(false);
        return res.data;
      } else {
        throw new Error("Invalid token format received from server");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Invalid OTP. Try again.";
      console.error("❌ OTP Verification Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  // Resend OTP
  const resendOTP = async (email, phoneNumber) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/resend-otp`, { email, phoneNumber });
      setLoading(false);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to resend OTP.";
      console.error("❌ Resend OTP Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  // Forgot Password
  const forgotPassword = async (data) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/forgot-password`, data);
      setLoading(false);
      return { success: true, data: res.data };
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to send reset link.";
      console.error("❌ Forgot Password Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Change Password
  const changePassword = async (data) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/change-password`, data);
      setLoading(false);
      return { success: true, data: res.data };
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to change password.";
      console.error("❌ Change Password Error:", errorMsg, {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Doctor Signup
  const doctorSignup = async (doctorData) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL1}/doctors/register`, doctorData);
      console.log("🔄 Doctor Signup Response:", res.data);

      // Check if signup was successful (OTP sent)
      if (res.data.msg && res.data.msg.includes("OTP sent")) {
        setLoading(false);
        return { success: true, data: res.data };
      } else {
        throw new Error("Unexpected response: OTP not sent");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Doctor signup failed.";
      console.error("❌ Doctor Signup Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Doctor OTP Verification
  const doctorVerifyOTP = async (otpData) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL1}/doctors/verify-otp`, otpData);
      console.log("🔄 Doctor OTP Verification Response:", res.data);

      const { token, doctor } = res.data;

      // Validate token format before storing
      if (doctor?.id && token && typeof token === 'string' && token.split('.').length === 3) {
        localStorage.setItem("doctorId", doctor.id);
        localStorage.setItem("token", token);
        setUser({
          _id: doctor.id,
          id: doctor.id,
          username: doctor.username,
          email: doctor.email,
          role: "doctor",
        });
        setLoading(false);
        return { success: true, doctor, token };
      } else {
        throw new Error("Missing doctor ID or invalid token format in response");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Invalid OTP. Try again.";
      console.error("❌ Doctor OTP Verification Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Doctor Login (now uses unified auth endpoint)
  const doctorLogin = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      console.log("🔄 Attempting doctor login for:", credentials.email);
      const res = await axios.post(`${BASE_URL}/login`, credentials);
      console.log("🔄 Doctor login response:", res.data);

      const { token, user } = res.data;
      console.log("🔄 Extracted token and user:", { token: token ? "present" : "missing", user: user ? "present" : "missing" });

      // Validate token format before storing
      if (token && user && typeof token === 'string' && token.split('.').length === 3) {
        console.log("✅ Doctor login validation passed, storing data...");
        localStorage.setItem("token", token);
        localStorage.setItem("doctorId", user._id);
        setUser({
          _id: user._id,
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
        });
        setLoading(false);
        console.log("✅ Doctor login successful");
        return { success: true, doctor: user, token };
      } else {
        console.error("❌ Doctor login validation failed:", {
          tokenExists: !!token,
          userExists: !!user,
          tokenType: typeof token,
          tokenParts: token ? token.split('.').length : 0
        });
        throw new Error("Invalid server response: Missing user data or invalid token format");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Invalid doctor login credentials.";
      console.error("❌ Doctor Login Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Contact Message
  const sendContactMessage = async (contactData) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/contact`, contactData);
      setLoading(false);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to send message.";
      console.error("❌ Contact Message Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  // Add Testimonial
  const addTestimonial = async (testimonialData) => {
    try {
      const res = await axios.post(`${BASE_URL1}/testimonials`, testimonialData);
      setTestimonials((prev) => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error("❌ Add Testimonial Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      return { error: "Failed to submit testimonial." };
    }
  };

  // Fetch Testimonials
  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(`${BASE_URL1}/testimonials`);
      setTestimonials(res.data);
    } catch (err) {
      console.error("❌ Fetch Testimonials Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("doctorId");
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        loadingUser,
        user,
        setUser,
        signup,
        login,
        logout,
        verifyOTP,
        resendOTP,
        forgotPassword,
        changePassword,
        doctorSignup,
        doctorLogin,
        doctorVerifyOTP,
        sendContactMessage,
        testimonials,
        addTestimonial,
        fetchTestimonials,
        loading,
        error,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;