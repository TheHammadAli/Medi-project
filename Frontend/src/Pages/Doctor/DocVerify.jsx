import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import AppContext from "../../Context/AppContext";

const BASE_URL = "http://localhost:8000/api/doctors";

const DocVerify = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AppContext);

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const otpRefs = useRef([]);

  // ✅ Load signup data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("pendingDoctorSignup");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.email && parsed.username && parsed.password) {
        setDoctorData(parsed);
      } else {
        toast.error("Incomplete signup data. Please register again.");
        navigate("/doctor-signup");
      }
    } else {
      toast.error("Invalid session. Please sign up again.");
      navigate("/doctor-signup");
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ✅ Handle OTP Verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/verify-otp`, {
        ...doctorData,
        otp: otp.join(''),
      });

      if (response?.data?.token) {
        localStorage.removeItem("pendingDoctorSignup");
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user);
        toast.success("OTP Verified! Registration Complete");
        setTimeout(() => navigate("/docDashboard"), 1500);
      } else {
        toast.error("Invalid OTP! Please try again.");
      }
    } catch (err) {
      console.error("❌ OTP Verification Error:", err.response?.data || err.message);
      console.error("❌ Full error details:", err);

      if (err.response?.data?.msg) {
        toast.error(err.response.data.msg);
      } else if (err.response?.status === 400) {
        toast.error("Invalid OTP or expired. Please request a new one.");
      } else if (err.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    }

    setLoading(false);
  };

  // ✅ Handle Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setResending(true);
    setCanResend(false);
    setCountdown(30);

    try {
      const email = doctorData?.email;
      if (!email) throw new Error("No email found");

      const response = await axios.post(`${BASE_URL}/resend-otp`, { email });

      if (response?.data?.msg?.toLowerCase().includes("otp")) {
        toast.success("New OTP sent to your email.");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("❌ Resend OTP Error:", err.response?.data || err.message);
      toast.error("Error sending OTP. Try again later.");
    }

    setResending(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-2xl border border-gray-200">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">
            We sent a 6-digit verification code to <span className="font-semibold text-blue-600">{doctorData?.email}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                maxLength={1}
                inputMode="numeric"
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 hover:bg-white"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.some(d => !d)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span>
                Verify Code
                <span className="ml-2 flex"></span>
                <span className="inline-block animate-bounce">.</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
            ) : (
              "Verify Code"
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending || !canResend}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 disabled:opacity-50"
            >
              {resending ? "Resending..." : canResend ? "Resend Code" : `Resend in ${countdown}s`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocVerify;
