import React, { useEffect, useContext, useState } from "react";
import AppointmentContext from "../../Context/AppointmentContext";
import { useNavigate } from "react-router-dom";
import AppContext from "../../Context/AppContext";
import ProfileContext from "../../Context/ProfileContext";

const Appointments = () => {
  const { appointments, loading, getDoctorAppointments, cancelAppointment } = useContext(AppointmentContext);
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const { getProfileByEmail } = useContext(ProfileContext);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(' ', ', ');
  };

  useEffect(() => {
    const fetchProfileAndAppointments = async () => {
      if (user && user.email) {
        const profile = await getProfileByEmail(user.email);
        if (profile) {
          setDoctorProfile(profile);
          getDoctorAppointments(profile._id);
        }
      }
    };

    fetchProfileAndAppointments();
  }, [user, getProfileByEmail, getDoctorAppointments]);



  return (
    <div className="min-h-screen rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  My Appointments
                </h1>
                <p className="text-base md:text-lg text-gray-600 mb-1">
                  Manage and view all your scheduled appointments
                </p>
                <p className="text-sm text-gray-500">
                  Keep track of your daily schedule and patient consultations.
                </p>
              </div>
              <div className="hidden md:block md:flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading appointments...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && appointments.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-500">Your scheduled appointments will appear here.</p>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {!loading && appointments.length > 0 && (
          <div className="space-y-4 md:space-y-6">
            {appointments.map((appt) => (
              <div
                key={appt._id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                    {/* Patient Avatar */}
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <span className="font-semibold text-base md:text-lg">
                        {(appt.patient?.username || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 truncate">
                        {appt.patient?.username || "Unknown Patient"}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{formatDate(appt.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{appt.appointmentTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-start md:items-end gap-3 md:flex-shrink-0">
                    {/* Payment Status */}
                    <div className="flex items-center space-x-2">
                      {appt.paymentStatus === "pending" ? (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-xs md:text-sm font-medium text-red-600 bg-red-50 px-2 md:px-3 py-1 rounded-full">Unpaid</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <span className="text-xs md:text-sm font-medium text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 rounded-full">Paid</span>
                        </>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        setSelectedAppointment(appt);
                        setShowCancelModal(true);
                      }}
                      className="group flex items-center space-x-2 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-700 hover:text-red-600 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 w-full md:w-auto justify-center md:justify-start"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm font-medium">Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && selectedAppointment && (
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
                  Are you sure you want to cancel the appointment with {selectedAppointment.patient?.username || "Unknown Patient"} on {formatDate(selectedAppointment.appointmentDate)} at {selectedAppointment.appointmentTime}?
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  <button
                    onClick={async () => {
                      await cancelAppointment(selectedAppointment._id);
                      setShowCancelModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                  >
                    Keep Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
