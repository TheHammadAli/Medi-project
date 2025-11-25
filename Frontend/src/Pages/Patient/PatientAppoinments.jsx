import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppointmentContext from "../../Context/AppointmentContext";
import AppContext from "../../Context/AppContext";
import { toast } from "sonner";
import SlideInOnScroll from "../../Components/SlideInOnScroll";

const PatientAppointments = () => {
  const navigate = useNavigate();
  const {
    appointments,
    setAppointments,
    getPatientAppointments,
    cancelAppointment,
    loading,
  } = useContext(AppointmentContext);
  const { user } = useContext(AppContext);

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  // Cleanup function for async operations
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Fetch appointments when user changes
  useEffect(() => {
    if (user?._id && user?.role === "patient") {
      console.log("🔍 PatientAppointments: User data:", {
        id: user._id,
        role: user.role,
        username: user.username,
        email: user.email
      });
      console.log("🔍 PatientAppointments: Fetching appointments for patient:", user._id);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const fetchAppointments = async () => {
        try {
          // Use the authenticated user's ID from the token for authorization
          // The backend will verify this matches the patient ID
          await getPatientAppointments(user._id);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("❌ PatientAppointments: Error fetching appointments:", error);
          }
        }
      };

      fetchAppointments();
    } else {
      console.log("🔍 PatientAppointments: No user or user not patient:", {
        hasUser: !!user,
        userRole: user?.role
      });
    }
  }, [user?._id, user?.role, getPatientAppointments]);

  // Debounced refresh function to prevent rapid successive calls
  const refreshAppointments = useCallback(async () => {
    if (!user?._id || user?.role !== "patient" || isRefreshing) {
      console.log("🚫 Skipping refresh - no user, not a patient, or already refreshing");
      return;
    }

    console.log("🔄 Refreshing appointments for patient:", user._id);
    setIsRefreshing(true);

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Debounce the refresh to prevent rapid successive calls
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        // Cancel any ongoing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        await getPatientAppointments(user._id);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("❌ Error refreshing appointments:", error);
          toast.error("Failed to refresh appointments");
        }
      } finally {
        setIsRefreshing(false);
      }
    }, 300); // 300ms debounce
  }, [user?._id, user?.role, getPatientAppointments, isRefreshing]);

  // Listen for refresh events from other components (like after booking)
  useEffect(() => {
    const handleRefreshAppointments = () => {
      refreshAppointments();
    };

    window.addEventListener('refreshAppointments', handleRefreshAppointments);

    return () => {
      window.removeEventListener('refreshAppointments', handleRefreshAppointments);
    };
  }, [refreshAppointments]);

  const visibleAppointments = appointments.filter(
    (appt) => appt?.doctor && appt.status !== "cancelled"
  );

  // Debug logging
  useEffect(() => {
    console.log("📊 Appointments state updated:", {
      total: appointments.length,
      appointments: appointments,
      visibleCount: visibleAppointments.length,
      visibleAppointments: visibleAppointments
    });
  }, [appointments, visibleAppointments]);

  const handlePay = (appointmentId) => {
    toast("💳 Payment functionality coming soon!");
  };

  const confirmCancel = (appointmentId) => {
    setSelectedApptId(appointmentId);
    setShowConfirm(true);
  };

  const handleCancelConfirmed = async () => {
    setShowConfirm(false);
    try {
      const result = await cancelAppointment(selectedApptId);
      if (result.success) {
        // Update local state immediately for better UX
        setAppointments((prev) =>
          prev.filter((appt) => appt._id !== selectedApptId)
        );
        toast.success("✅ Appointment cancelled successfully.");

        // Also refresh from server to ensure consistency
        setTimeout(() => {
          refreshAppointments();
        }, 100);
      } else {
        toast.error("❌ Failed to cancel the appointment.");
      }
    } catch (err) {
      toast.error("⚠️ Unexpected error occurred while cancelling.");
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <SlideInOnScroll direction="up">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                My Appointments
              </h1>
              <p className="text-lg sm:text-xl md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                Manage and track all your scheduled appointments with ease
              </p>
            </SlideInOnScroll>
          </div>
        </div>
      </section>

      {/* Stats Section - Only show for patients */}
      {user?.role === "patient" && (
        <section className="py-8 sm:py-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <SlideInOnScroll direction="up">
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                    {visibleAppointments.filter(appt => appt.paymentStatus === "paid").length}
                  </div>
                  <div className="text-gray-600 font-medium text-xs sm:text-sm">Confirmed</div>
                </div>
              </SlideInOnScroll>
              <SlideInOnScroll direction="up">
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
                    {visibleAppointments.filter(appt => appt.paymentStatus !== "paid").length}
                  </div>
                  <div className="text-gray-600 font-medium text-xs sm:text-sm">Pending</div>
                </div>
              </SlideInOnScroll>
              <SlideInOnScroll direction="up">
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                    {visibleAppointments.length}
                  </div>
                  <div className="text-gray-600 font-medium text-xs sm:text-sm">Total</div>
                </div>
              </SlideInOnScroll>
              <SlideInOnScroll direction="up">
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                    {new Date().getMonth() + 1}
                  </div>
                  <div className="text-gray-600 font-medium text-xs sm:text-sm">This Month</div>
                </div>
              </SlideInOnScroll>
            </div>
          </div>
        </section>
      )}

      {/* Appointments Section - Only show for patients */}
      {user?.role === "patient" && (
        <section className="py-12 sm:py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Loading State */}
            {loading ? (
              <SlideInOnScroll direction="up">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 font-medium text-sm sm:text-base">Loading your appointments...</p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">Please wait a moment</p>
                  </div>
                </div>
              </SlideInOnScroll>
            ) : visibleAppointments.length === 0 ? (
            /* Empty State */
            <SlideInOnScroll direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {user?.role === "doctor" ? (
                    <>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Access Restricted</h3>
                      <p className="text-gray-600 max-w-md leading-relaxed text-sm sm:text-base px-4">
                        This page is for patients to view their appointments only. As a doctor, please use the doctor dashboard to manage your appointments.
                      </p>
                      <button
                        onClick={() => navigate("/doctor/dashboard")}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Go to Doctor Dashboard
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No appointments yet</h3>
                      <p className="text-gray-600 max-w-md leading-relaxed text-sm sm:text-base px-4">
                        You haven't booked any appointments yet. Browse our doctors and schedule your first consultation.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </SlideInOnScroll>
          ) : (
            /* Appointments List */
            <div className="space-y-3 sm:space-y-4">
              {visibleAppointments.map((appt, index) => (
                <SlideInOnScroll
                  key={appt._id}
                  direction={index % 2 === 0 ? "left" : "right"}
                >
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
                    {/* Appointment Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                            appt.paymentStatus === "paid" ? "bg-green-500" : "bg-yellow-500"
                          }`}></div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                              Dr. {appt.doctor.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                              {appt.doctor.speciality}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                            appt.paymentStatus === "paid"
                              ? "text-white"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                          style={appt.paymentStatus === "paid" ? { backgroundColor: "#00d37d" } : {}}>
                            {appt.paymentStatus === "paid" ? "Confirmed" : "Payment Pending"}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            #{appt._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="px-4 sm:px-6 py-4 sm:py-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        {/* Date */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {new Date(appt.appointmentDate).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">Date</p>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{appt.appointmentTime}</p>
                            <p className="text-xs sm:text-sm text-gray-500">Time</p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">Upcoming</p>
                            <p className="text-xs sm:text-sm text-gray-500">Status</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                        {appt.paymentStatus !== "paid" && (
                          <button
                            onClick={() => handlePay(appt._id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 border border-blue-200"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span className="hidden sm:inline">Pay Now</span>
                            <span className="sm:hidden">Pay</span>
                          </button>
                        )}
                        <button
                          onClick={() => confirmCancel(appt._id)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 border border-gray-200 sm:ml-auto"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="hidden sm:inline">Cancel</span>
                          <span className="sm:hidden">Cancel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </SlideInOnScroll>
              ))}
            </div>
            )}
          </div>
        </section>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full mx-2 sm:mx-4 border border-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Cancel Appointment?
              </h3>
              <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                Are you sure you want to cancel this appointment? This action cannot be undone and you may lose your booking slot.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  onClick={handleCancelConfirmed}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                >
                  Keep Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section - Only show for patients */}
      {user?.role === "patient" && (
        <section className="py-12 sm:py-24 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SlideInOnScroll direction="up">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-white/20 shadow-2xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                  Need to Book a New Appointment?
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed px-4">
                  Browse our network of qualified doctors and schedule your next consultation with ease.
                </p>
                <button
                  onClick={() => navigate("/doctors")}
                  className="inline-flex items-center gap-2 sm:gap-3 bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book New Appointment
                </button>
              </div>
            </SlideInOnScroll>
          </div>
        </section>
      )}
    </div>
  );
};

export default PatientAppointments;
