import React, { useContext, useEffect, useState } from "react";
import AppContext from "../../Context/AppContext";
import ProfileContext from "../../Context/ProfileContext";
import AppointmentContext from "../../Context/AppointmentContext";

// Icon components for professional look
const CalendarIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const DoctorPanel = () => {
  const { user } = useContext(AppContext);
  const { getProfileByEmail } = useContext(ProfileContext);
  const { getDoctorAppointments } = useContext(AppointmentContext);

  const [completion, setCompletion] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);

  useEffect(() => {
    const calculateProfileCompletion = async () => {
      if (user?.email) {
        const profile = await getProfileByEmail(user.email);

        if (profile) {
          const requiredFields = [
            "name",
            "email",
            "speciality",
            "education",
            "experience",
            "fees",
            "address1",
            "about",
            "timing",
            "daysAvailable",
            "imageUrl"
          ];

          const filledCount = requiredFields.filter(
            (field) =>
              Array.isArray(profile[field])
                ? profile[field].length > 0
                : !!profile[field]?.toString().trim()
          ).length;

          const percent = Math.round((filledCount / requiredFields.length) * 100);
          setCompletion(percent);
        }
      }
    };

    const fetchTodayAppointments = async () => {
      if (user?._id) {
        const res = await getDoctorAppointments(user._id);
        const today = new Date().toISOString().split("T")[0]; // Format: yyyy-mm-dd

        const todayCount = res?.filter((appt) =>
          appt.date?.startsWith(today)
        ).length;

        setTodayAppointments(todayCount || 0);
      }
    };

    calculateProfileCompletion();
    fetchTodayAppointments();
  }, [user]);

  return (
    <div className="min-h-screen rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Doctor Panel
                </h1>
                <p className="text-lg text-gray-600 mb-1">
                  Welcome back, <span className="font-semibold text-indigo-600">Dr. {user?.username}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Manage your daily appointments, check messages, and keep your profile up to date.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <UserIcon />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Appointments Today Card */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                <CalendarIcon />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{todayAppointments}</div>
                <div className="text-sm text-gray-500">Today</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointments Today</h3>
            <p className="text-gray-600 text-sm">
              {todayAppointments === 0
                ? "No appointments scheduled for today"
                : `${todayAppointments} appointment${todayAppointments > 1 ? 's' : ''} scheduled for today`
              }
            </p>
          </div>

          {/* Profile Completion Card */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                <TrendingUpIcon />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{completion}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Completion</h3>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completion}%` }}
                ></div>
              </div>
            </div>

            <p className="text-gray-600 text-sm">
              {completion === 100
                ? "Your profile is fully complete!"
                : completion >= 80
                ? "Almost there! Just a few more details needed."
                : "Complete your profile to attract more patients."
              }
            </p>
          </div>

          {/* Patient Messages Card */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-amber-200 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                <ChatIcon />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">2</div>
                <div className="text-sm text-gray-500">Unread</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Messages</h3>
            <p className="text-gray-600 text-sm">
              You have 2 unread messages from patients
            </p>
            <div className="mt-3 flex items-center text-amber-600 text-sm font-medium">
              <span>View Messages</span>
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <CalendarIcon />
              <span className="ml-2 font-medium">View Schedule</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <UserIcon />
              <span className="ml-2 font-medium">Edit Profile</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <ChatIcon />
              <span className="ml-2 font-medium">Messages</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <TrendingUpIcon />
              <span className="ml-2 font-medium">Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPanel;
