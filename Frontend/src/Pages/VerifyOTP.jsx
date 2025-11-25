import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import AppContext from "../Context/AppContext";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(AppContext);

  const storedEmail = localStorage.getItem("pendingEmail");
  const email = location.state?.email || storedEmail || "";

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error("Session expired. Please sign up again.");
      navigate("/signup");
    }
  }, [email]);

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

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/auth/verify-otp", { email, otp: otp.join('') });

      if (res.data?.token) {
        localStorage.removeItem("pendingSignup");
        localStorage.removeItem("pendingEmail");
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);

        toast.success("OTP Verified! Account created.");
        navigate("/dashboard");
      } else {
        toast.error(res?.data?.msg || "OTP verification failed.");
      }
    } catch (err) {
      console.error("❌ OTP Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.msg || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResending(true);
    setCanResend(false);
    setCountdown(30);

    try {
      const res = await axios.post("http://localhost:8000/api/auth/resend-otp", { email });
      toast.success(res.data?.msg || "OTP resent.");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
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
            We sent a 6-digit verification code to <span className="font-semibold text-blue-600">{email}</span>
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

export default VerifyOTP;
