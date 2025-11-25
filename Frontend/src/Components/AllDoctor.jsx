import React, { useContext, useEffect, useState, useRef } from "react";
import ProfileContext from "../Context/ProfileContext";
import AppointmentContext from "../Context/AppointmentContext";
import AppContext from "../Context/AppContext";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import SlideInOnScroll from "./SlideInOnScroll";
import { FaArrowRight, FaFilter, FaHeart, FaStethoscope } from "react-icons/fa";

// 🔹 Helper function to get remaining dates grouped by weekday
const getRemainingDatesGroupedByWeekday = (daysArray, doctorTiming = null) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const todayDate = today.getDate();
  const nowHours = today.getHours();
  const nowMinutes = today.getMinutes();
  const nowTime = nowHours + nowMinutes / 60;

  // Parse doctor's actual end time instead of hardcoded 9 PM
  let doctorEndTime = 21; // Default to 9 PM if no timing provided
  if (doctorTiming) {
    try {
      const [, endStr] = doctorTiming.split(" - ");
      const parsedEndTime = parseTimeForComparison(endStr);
      if (!isNaN(parsedEndTime)) {
        doctorEndTime = parsedEndTime;
      }
    } catch (error) {
      console.warn("Error parsing doctor timing:", error);
    }
  }

  // Helper function to parse time strings like "9:00 PM" or "12:00 AM"
  function parseTimeForComparison(str) {
    if (!str) return NaN;
    str = str.trim().toUpperCase();
    let hours, minutes;

    const match = str.match(/^(\d+)(?::(\d+))?(?:\.(\d+))?\s*(AM|PM)?$/);
    if (!match) return NaN;

    hours = Number(match[1]);
    minutes = Number(match[2] || match[3] || 0);
    const modifier = match[4];

    if (isNaN(minutes)) minutes = 0;

    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    } else if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    // Handle 12:00 AM (midnight) case
    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    return hours + minutes / 60;
  }

  const dayNameToIndex = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const result = {};

  for (const dayName of daysArray) {
    const targetDay = dayNameToIndex[dayName];
    const matchedDates = [];

    // Current month
    const lastDayCurrent = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let d = todayDate; d <= lastDayCurrent; d++) {
      const localDate = new Date(currentYear, currentMonth, d);
      if (localDate.getDay() === targetDay) {
        if (d === todayDate && nowTime > doctorEndTime) {
          // Skip today's date if current time has passed doctor's available end time
        } else {
          const yyyy = localDate.getFullYear();
          const mm = String(localDate.getMonth() + 1).padStart(2, "0");
          const dd = String(localDate.getDate()).padStart(2, "0");
          matchedDates.push(`${yyyy}-${mm}-${dd}`);
        }
      }
    }

    // Next month
    const nextMonth = currentMonth + 1;
    const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
    const lastDayNext = new Date(nextYear, nextMonth + 1, 0).getDate();
    for (let d = 1; d <= lastDayNext; d++) {
      const localDate = new Date(nextYear, nextMonth, d);
      if (localDate.getDay() === targetDay) {
        const yyyy = localDate.getFullYear();
        const mm = String(localDate.getMonth() + 1).padStart(2, "0");
        const dd = String(localDate.getDate()).padStart(2, "0");
        matchedDates.push(`${yyyy}-${mm}-${dd}`);
      }
    }

    result[dayName] = matchedDates;
  }

  return result;
};

const AllDoctor = () => {
  const { profiles, fetchProfiles } = useContext(ProfileContext);
  const { bookAppointment, getBookedSlots } = useContext(AppointmentContext);
  const { user } = useContext(AppContext);

  const [selectedSpeciality, setSelectedSpeciality] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const [activeTime, setActiveTime] = useState(null);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const reviewRef = useRef(null);
  const [satisfactionWidth, setSatisfactionWidth] = useState(0);
  const [diagnosisWidth, setDiagnosisWidth] = useState(0);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const concernQuery = queryParams.get("concern");

  const navigate = useNavigate();

  // Handle concern query for speciality
  useEffect(() => {
    if (concernQuery) {
      const concernToSpecialityMap = {
        heart: "Cardiologist",
        fever: "General physician",
        skin: "Dermatologist",
        brain: "Neurologist",
        child: "Pediatrician",
        stomach: "Gastroenterologist",
        pregnancy: "Gynecologist",
        cough: "General physician",
      };
      const matched = Object.keys(concernToSpecialityMap).find((keyword) =>
        concernQuery.toLowerCase().includes(keyword)
      );
      if (matched) setSelectedSpeciality(concernToSpecialityMap[matched]);
    }
  }, [concernQuery]);

  // Fetch doctor profiles
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Fetch booked times when doctor, day, or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const fetchBookedTimes = async () => {
        try {
          const slots = await getBookedSlots(selectedDoctor._id, selectedDate);
          setBookedTimes(slots);
          setActiveTime(null); // Reset time when slots update
        } catch (err) {
          console.error("Error fetching booked times:", err);
          toast.error("Failed to load booked times");
        }
      };
      fetchBookedTimes();
    }
  }, [selectedDoctor, selectedDate, getBookedSlots]);

  // Animation effect for progress bars on scroll
  useEffect(() => {
    if (!showModal) {
      setSatisfactionWidth(0);
      setDiagnosisWidth(0);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && satisfactionWidth === 0 && diagnosisWidth === 0) {
            setSatisfactionWidth(96);
            setDiagnosisWidth(94);
          }
        });
      },
      { threshold: 0.1, root: reviewRef.current?.closest('.overflow-y-auto') }
    );

    if (reviewRef.current) observer.observe(reviewRef.current);

    return () => observer.disconnect();
  }, [showModal, satisfactionWidth, diagnosisWidth]);

  const specialties = [
    "All",
    "General physician",
    "Gynecologist",
    "Dermatologist",
    "Pediatrician",
    "Neurologist",
    "Gastroenterologist",
    "Cardiologist",
  ];

  const isProfileComplete = (profile) => {
    const requiredFields = [
      "name",
      "email",
      "speciality",
      "education",
      "experience",
      "fees",
      "address1",
      "timing",
      "daysAvailable",
      "about",
      "imageUrl",
    ];
    return requiredFields.every((field) => {
      const value = profile[field];
      return Array.isArray(value) ? value.length > 0 : value?.toString().trim();
    });
  };

  const filteredDoctors =
    profiles?.filter(isProfileComplete)?.filter((doc) =>
      selectedSpeciality === "All" ? true : doc.speciality === selectedSpeciality
    ) || [];

  const getNextDay = (day) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const index = days.indexOf(day);
    return days[(index + 1) % 7];
  };

  const isDoctorAvailableNow = (doc) => {
    if (!doc?.timing || !doc?.daysAvailable?.length) return false;

    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const nowTime = now.getHours() + now.getMinutes() / 60;

    const parseTime = (str) => {
      str = str.trim().toUpperCase();
      let hours, minutes;

      const match = str.match(/^(\d+)(?::(\d+))?(?:\.(\d+))?\s*(AM|PM)?$/);
      if (!match) {
        console.warn("Invalid time format:", str);
        return NaN;
      }

      hours = Number(match[1]);
      minutes = Number(match[2] || match[3] || 0);
      const modifier = match[4];

      if (isNaN(minutes)) minutes = 0;

      if (modifier === "PM" && hours !== 12) {
        hours += 12;
      } else if (modifier === "AM" && hours === 12) {
        hours = 0;
      }

      // If the hour is already 13 or greater, and a modifier was present,
      // it implies the modifier was redundant or the input is mixed.
      // In this case, assume it's already 24-hour and ignore the modifier's effect.
      if (hours >= 24) {
        hours -= 12;
      }

      return hours + minutes / 60;
    };

    try {
      const [startStr, endStr] = doc.timing.split(" - ");
      const start = parseTime(startStr);
      const end = parseTime(endStr);

      const isToday = doc.daysAvailable.some(
        (day) => day.toLowerCase() === currentDay.toLowerCase()
      );
      const nextDay = getNextDay(currentDay);
      const isNext = doc.daysAvailable.some(
        (day) => day.toLowerCase() === nextDay.toLowerCase()
      );

      if (start < end) {
        return isToday && nowTime >= start && nowTime <= end;
      }

      return (isToday && nowTime >= start) || (isNext && nowTime <= end);
    } catch {
      return false;
    }
  };

  const handleDaySelection = async (day) => {
    const available = isDoctorAvailableNow(selectedDoctor);
    if (!available) {
      toast.error("Doctor is not available now");
      return;
    }
    setActiveDay(day);
    setActiveTime(null);
    setSelectedDate("");
    const grouped = getRemainingDatesGroupedByWeekday([day], selectedDoctor.timing);
    setAvailableDates(grouped[day] || []);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setActiveTime(null);
  };

  const handleBook = async () => {
    console.log("🔍 Current user state:", {
      userExists: !!user,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role
    });

    if (!user || !user._id) {
      console.error("❌ No user or user._id found:", user);
      toast.error("Please login to book an appointment.");
      navigate("/login");
      return;
    }
    if (!selectedDoctor || !activeDay || !activeTime || !selectedDate) {
      toast.error("Please select day, date, and time to book.");
      return;
    }

    // Validate required data
    if (!selectedDoctor?._id || !user?._id || !selectedDate || !activeTime) {
      toast.error("Missing required appointment information. Please try again.");
      return;
    }

    // Ensure date is in proper format for backend
    let formattedDate;
    try {
      formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      if (isNaN(new Date(formattedDate).getTime())) {
        throw new Error("Invalid date format");
      }
    } catch (dateError) {
      console.error("❌ Date formatting error:", dateError);
      toast.error("Invalid appointment date. Please select a valid date.");
      return;
    }

    const formData = {
      doctorId: selectedDoctor._id,
      patientId: user._id,
      appointmentDate: formattedDate,
      appointmentTime: activeTime,
      // Also send user email as fallback for patient lookup
      patientEmail: user.email,
    };

    console.log("🚀 Booking appointment with data:", {
      doctorId: selectedDoctor._id,
      patientId: user._id,
      patientIdType: typeof user._id,
      userObject: user,
      appointmentDate: selectedDate,
      appointmentDateType: typeof selectedDate,
      appointmentTime: activeTime,
      note: "patientId will be extracted from JWT token on backend"
    });
    console.log("📅 Formatted date for backend:", formattedDate);

    // Debug: Check if user._id matches expected format
    console.log("🔍 User ID details:", {
      userId: user._id,
      userIdLength: user._id?.length,
      userIdRegexTest: /^[0-9a-fA-F]{24}$/.test(user._id),
      userEmail: user.email,
      userRole: user.role
    });

    // Validate that patientId is a valid MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(user._id)) {
      console.error("❌ Invalid patient ID format:", user._id);
      toast.error("Invalid user session. Please login again.");
      navigate("/login");
      return;
    }

    // Check if user is logged in as a patient (not as a doctor)
    if (user.role === "doctor") {
      console.error("❌ User is logged in as a doctor, not a patient:", user);
      toast.error("Please login as a patient to book appointments.");
      navigate("/login");
      return;
    }

    try {
      console.log("📡 Sending booking request to:", `${import.meta.env.VITE_API_URL}/appointments/book`);
      console.log("📦 Request data:", formData);

      const result = await bookAppointment(formData);

      console.log("📬 Booking response:", result);

      if (result.success) {
        toast.success("Appointment booked successfully!");
        // Fetch updated booked times
        const slots = await getBookedSlots(selectedDoctor._id, selectedDate);
        setBookedTimes(slots);
        setActiveTime(null);
        setShowModal(false);
        setActiveDay(null);
        setSelectedDate("");

        // Refresh appointments in PatientAppointments page if user is on that page
        // This will ensure the newly booked appointment appears immediately
        if (window.location.pathname.includes('/patient-appointments') || window.location.pathname.includes('/appointments')) {
          // Dispatch custom event to refresh appointments
          window.dispatchEvent(new CustomEvent('refreshAppointments'));
        }
      } else {
        console.error("❌ Booking failed with response:", result);
        toast.error(result.message || "Booking failed.");
      }
    } catch (err) {
      console.error("❌ Booking error:", err);
      console.error("❌ Error response:", err.response?.data);
      toast.error(`Failed to book appointment: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* Doctors Section */}
      <section className="py-8 sm:py-16 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8">
          {/* Header Text */}
          <div className="mb-6 sm:mb-8">
            <SlideInOnScroll direction="left">
              <h1 className="text-sm sm:text-xs lg:text-xl font-semibold text-gray-500 mb-2">
                Browse through the doctors specialist.
              </h1>
            </SlideInOnScroll>
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <FaFilter className="text-blue-600" />
              <span className="text-gray-700 font-medium">Filter by Specialty</span>
            </button>
          </div>

          {/* Mobile Filter Dropdown */}
          {showMobileFilter && (
            <div className="lg:hidden mb-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                <h3 className="text-lg font-bold text-gray-500 mb-4">Specialties</h3>
                <div className="space-y-3">
                  {specialties.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => {
                        setSelectedSpeciality(spec);
                        setShowMobileFilter(false);
                      }}
                      className={`w-full px-4 py-3 rounded-xl border transition text-left text-sm font-medium ${
                        selectedSpeciality === spec
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Sidebar */}
            <aside className="w-full lg:w-56 xl:w-60 shrink-0 pb-4 sm:pb-6 lg:pb-5 max-lg:hidden lg:block">
              <SlideInOnScroll direction="left">
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                  <h3 className="text-base sm:text-lg font-bold text-gray-500 mb-3 sm:mb-4">Specialties</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {specialties.map((spec) => (
                      <li key={spec}>
                        <button
                          onClick={() => setSelectedSpeciality(spec)}
                          className={`w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border transition text-left text-xs sm:text-sm font-medium ${
                            selectedSpeciality === spec
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                          }`}
                        >
                          {spec}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </SlideInOnScroll>
            </aside>

            {/* Doctor Grid */}
            <div className="flex-1 mt-4 sm:mt-6">
              {filteredDoctors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6">
                  {filteredDoctors.map((doc, index) => (
                    <SlideInOnScroll key={doc._id} direction={index % 2 === 0 ? "up" : "up"}>
                      <div
                        onClick={() => {
                          if (!user || !user._id) {
                            toast.error("Please sign up to book a doctor.");
                            navigate("/signup");
                            return;
                          }
                          setSelectedDoctor(doc);
                          setShowModal(true);
                        }}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden border border-gray-100 group min-h-[200px] sm:min-h-[220px]"
                      >
                        <div className="relative">
                          <img
                            src={doc.imageUrl}
                            alt={doc.name}
                            className="w-full h-40 sm:h-44 md:h-48 lg:h-44 object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = '/placeholder-doctor.png';
                            }}
                            style={{
                              maxWidth: '100%',
                              height: 'auto'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="p-4 sm:p-4 flex flex-col justify-center h-full">
                           <div className="flex items-center justify-between mb-3 sm:mb-4">
                             <span
                               className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full ${
                                 isDoctorAvailableNow(doc)
                                   ? "bg-green-100 text-green-700"
                                   : "bg-red-100 text-red-700"
                               }`}
                             >
                               ● {isDoctorAvailableNow(doc) ? "Available Now" : "Not Available"}
                             </span>
                           </div>
                           <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
                             Dr. {doc.name}
                           </h3>
                           <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{doc.speciality}</p>
                           <div className="mt-auto">
                
                           </div>
                         </div>
                      </div>
                    </SlideInOnScroll>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <SlideInOnScroll direction="up">
                    <p className="text-lg sm:text-xl text-gray-500">No doctors found.</p>
                  </SlideInOnScroll>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Doctor Modal */}
      {showModal && selectedDoctor && (
        <>
          <style>{`
          .modal-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .modal-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          `}</style>
          <div className="modal-scrollbar fixed inset-0 z-50 bg-black/50 backdrop-blur-md overflow-y-auto px-2 sm:px-4 py-4 sm:py-10">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-4xl mx-auto shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-500 hover:text-red-500 text-2xl sm:text-3xl font-bold z-10"
            >
              ×
            </button>

            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-300 rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-8 text-white">
              <div className="absolute inset-0 bg-black/10 rounded-t-2xl sm:rounded-t-3xl"></div>
              <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <img
                  src={selectedDoctor.imageUrl}
                  alt={selectedDoctor.name}
                  className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white/20 shadow-xl"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = '/placeholder-doctor.png';
                  }}
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
                    Dr. {selectedDoctor.name}
                  </h2>
                  <p className="text-sm sm:text-lg text-blue-100 mb-1 sm:mb-2">{selectedDoctor.speciality}</p>
                  <span
                    className={`text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full ${
                      isDoctorAvailableNow(selectedDoctor)
                        ? "bg-green-500/20 text-green-100 border border-green-400/30"
                        : "bg-red-500/20 text-red-100 border border-red-400/30"
                    }`}
                  >
                    ● {isDoctorAvailableNow(selectedDoctor) ? "Available Now" : "Not Available"}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-4 sm:p-8 text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600">Experience</p>
                  <p className="text-sm sm:text-base text-gray-600">{selectedDoctor.experience}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600">Fees</p>
                  <p className="text-sm sm:text-base text-gray-600">${selectedDoctor.fees}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600">Timing</p>
                  <p className="text-sm sm:text-base text-gray-600">{selectedDoctor.timing}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600">Available Days</p>
                  <p className="text-sm sm:text-base text-gray-600">{selectedDoctor.daysAvailable?.join(", ")}</p>
                </div>
              </div>
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm font-semibold text-blue-600 mb-1 sm:mb-2">About</p>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{selectedDoctor.about || "No description provided."}</p>
              </div>

              {/* Day Selection */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-blue-600 mb-2 sm:mb-4">Select Day</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {selectedDoctor.daysAvailable?.map((day, i) => {
                    const available = isDoctorAvailableNow(selectedDoctor);
                    return (
                      <button
                        key={i}
                        onClick={() => handleDaySelection(day)}
                        disabled={!available}
                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                          activeDay === day
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent"
                            : !available
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date and Time Dropdowns */}
              {availableDates.length > 0 && selectedDoctor.timing && activeDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  {/* Date Dropdown */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Select Date</label>
                    <select
                      value={selectedDate}
                      onChange={handleDateChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Choose a date</option>
                      {availableDates.map((date, idx) => (
                        <option key={idx} value={date}>
                          {new Date(date).toDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Dropdown */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Select Time</label>
                    <select
                      value={activeTime || ""}
                      onChange={(e) => setActiveTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Choose a time</option>
                      {(() => {
                        const [start, end] = selectedDoctor.timing.split(" - ");
                        const parseTime = (str) => {
                          const [time, ampm] = str.split(" ");
                          let [h, m] = time.includes(":")
                            ? time.split(":").map(Number)
                            : time.split(".").map(Number);
                          if (isNaN(m)) m = 0;
                          if (ampm === "PM" && h !== 12) h += 12;
                          if (ampm === "AM" && h === 12) h = 0;
                          return h * 60 + m;
                        };
                        const formatTime = (min) => {
                          let h = Math.floor(min / 60);
                          const m = min % 60;
                          const ampm = h >= 12 ? "PM" : "AM";
                          h = h % 12 || 12;
                          return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
                        };
                        const startM = parseTime(start);
                        const endM = parseTime(end);
                        const slots = [];

                        if (startM < endM) {
                          for (let m = startM; m <= endM; m += 30) slots.push(formatTime(m));
                        } else {
                          for (let m = startM; m < 1440; m += 30) slots.push(formatTime(m));
                          for (let m = 0; m <= endM; m += 30) slots.push(formatTime(m));
                        }

                        return slots
                          .filter((time) => !bookedTimes.includes(time))
                          .map((time, idx) => (
                            <option key={idx} value={time}>
                              {time}
                            </option>
                          ));
                      })()}
                    </select>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                onClick={handleBook}
                disabled={!selectedDate || !activeTime}
              >
                Book Appointment
                <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              {/* Review Section */}
              <div ref={reviewRef} className="mt-6 sm:mt-8 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-50 to-white shadow-lg border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">⭐ Patient Reviews</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:space-x-4 mb-4 sm:mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-lg sm:text-xl font-bold">5/5</div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">Based on 286 reviews</p>
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                      <span className="text-gray-900 flex items-center"><FaHeart className="text-red-500 mr-1" /> Patient Satisfaction</span>
                      <span className="text-gray-700">4.8</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 sm:h-3 rounded-full">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 sm:h-3 rounded-full transition-all duration-2000 ease-in-out" style={{ width: `${satisfactionWidth}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                      <span className="text-gray-900 flex items-center"><FaStethoscope className="text-blue-500 mr-1" /> Diagnosis</span>
                      <span className="text-gray-700">4.7</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 sm:h-3 rounded-full">
                      <div className="bg-gradient-to-r from-blue-400 to-cyan-600 h-2 sm:h-3 rounded-full transition-all duration-2000 ease-in-out" style={{ width: `${diagnosisWidth}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="mt-6 sm:mt-8">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Patient Feedback</h4>
                  <div className="space-y-3 sm:space-y-4 max-h-48 sm:max-h-64 overflow-y-auto">
                    <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm sm:text-base text-gray-700 italic">"Dr. Smith was very attentive and helpful!"</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm sm:text-base text-gray-700 italic">"Quick diagnosis and very accurate."</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm sm:text-base text-gray-700 italic">"I loved the video consultation. Smooth experience."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    </div>
  );
};

export default AllDoctor;
