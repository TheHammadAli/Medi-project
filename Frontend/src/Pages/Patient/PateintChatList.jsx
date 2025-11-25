import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PatientChatList = () => {
  const [patientId, setPatientId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setPatientId(decoded.id);
    }
  }, []);

  useEffect(() => {
    const fetchDoctorsWithAppointments = async () => {
      if (!patientId) return;
      try {
        const res = await fetch(`http://localhost:8000/api/appointments/chat-doctors/${patientId}`);
        const data = await res.json();
        if (data.success) {
          setDoctors(data.doctors);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };

    fetchDoctorsWithAppointments();
  }, [patientId]);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-3xl font-bold text-blue-700 mb-8">My Doctor Chats</h2>

      {doctors.length === 0 ? (
        <p className="text-center text-gray-400">No conversations yet.</p>
      ) : (
        <div className="space-y-5">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              onClick={() =>
                navigate(`/messages/${doc._id}`, { state: { doctor: doc } })
              }
              className="cursor-pointer bg-white rounded-xl shadow-md hover:shadow-lg transition p-5 flex items-center gap-5 hover:bg-blue-50"
            >
              {/* Profile Image */}
              <img
                src={doc.imageUrl || "/default-doctor.png"}
                alt="Doctor"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-blue-100"
              />

              {/* Doctor Info */}
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Dr. {doc.username || doc.name}
                  </h3>
                  {(doc.unreadCount ?? 0) > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {doc.unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-500">{doc.speciality || "General Physician"}</p>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {doc.latestMessage || "Start chatting..."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientChatList;
