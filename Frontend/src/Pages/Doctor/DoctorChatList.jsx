import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { fetchDoctorMessages } from "../../Components/Chat/chatApi";
import socket from "../../Socket/socket";
import PatientProfileContext from "../../Context/PatientProfileContext";

const DoctorChatList = () => {
  const { getProfile, getPatientProfileById } = useContext(PatientProfileContext);
  const [doctorId, setDoctorId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewedConversations, setViewedConversations] = useState(new Set());
  const navigate = useNavigate();

  const handleViewConversation = (patientId) => {
    setViewedConversations(prev => new Set([...prev, patientId]));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setDoctorId(decoded.id);
      console.log("[DoctorChatList] Decoded Doctor ID:", decoded.id);
    } else {
      console.log("[DoctorChatList] No token found.");
    }
  }, []);

  // Load viewed conversations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("viewedDoctorConversations");
    if (saved) {
      try {
        setViewedConversations(new Set(JSON.parse(saved)));
      } catch (error) {
        console.error("[DoctorChatList] Error loading viewed conversations:", error);
      }
    }
  }, []);

  // Save viewed conversations to localStorage whenever it changes
  useEffect(() => {
    if (viewedConversations.size > 0) {
      localStorage.setItem("viewedDoctorConversations", JSON.stringify([...viewedConversations]));
    }
  }, [viewedConversations]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!doctorId) {
        console.log("[DoctorChatList] Doctor ID not available, skipping profile fetch.");
        return;
      }
      try {
        setLoading(true);
        console.log("[DoctorChatList] Fetching doctor profile for ID:", doctorId);
        const res = await fetch(`http://localhost:8000/api/chat/get-doctor/${doctorId}`);
        const data = await res.json();
        console.log("[DoctorChatList] Doctor profile fetch response:", data);
        if (data.success) {
          const docProfileId = data.doctor._id;
          setProfileId(docProfileId);
          console.log("[DoctorChatList] Profile ID set:", docProfileId);
          const patientsRes = await fetchDoctorMessages(docProfileId);
          console.log("[DoctorChatList] fetchDoctorMessages response:", patientsRes);
          if (patientsRes.success) {
            setPatients(patientsRes.patients);
            console.log("[DoctorChatList] Loaded patients with unreadCount:", patientsRes.patients);
          } else {
            console.error("[DoctorChatList] fetchDoctorMessages failed:", patientsRes.message);
          }
        } else {
          console.error("[DoctorChatList] Failed to fetch doctor profile:", data.message);
        }
      } catch (err) {
        console.error("[DoctorChatList] Error in fetchProfile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [doctorId]);

  useEffect(() => {
    if (!profileId) return;

    socket.on("connect", () => {
      console.log("[DoctorChatList] Socket connected");
      socket.emit("user-online", { userId: profileId, role: "doctor" });
    });

    socket.on("receive-message", (msg) => {
      console.log("[DoctorChatList] Received message:", msg);
      // Update patient list with new message
      setPatients((prev) => {
        return prev.map((patient) => {
          if (patient._id === msg.senderId && msg.senderModel === "Patient") {
            return {
              ...patient,
              latestMessage: msg.text ||
                            (msg.type === "image" ? "📷 Image" :
                             msg.type === "file" ? `📄 ${msg.fileName || "File"}` :
                             patient.latestMessage),
              unreadCount: patient.unreadCount + 1,
              timestamp: msg.timestamp,
            };
          }
          return patient;
        }).sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const timeB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          return timeB - timeA;
        });
      });
    });

    return () => {
      console.log("[DoctorChatList] Cleanup");
    };
  }, [profileId]);

  return (
    <div className="min-h-screen rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Patient Messages
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-1">
                  Manage and respond to patient conversations
                </p>
                <p className="text-sm text-gray-500">
                  Keep track of your patient communications and provide timely responses.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-sm sm:text-base text-gray-600">Loading patient messages...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && patients.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-sm sm:text-base text-gray-500">Patient conversations will appear here once they start messaging you.</p>
            </div>
          </div>
        )}

        {/* Patient Messages List */}
        {!loading && patients.length > 0 && (
          <div className="space-y-3 sm:space-y-6">
            {patients.map((pat) => (
              <div
                key={pat._id}
                onClick={() => {
                  handleViewConversation(pat._id);
                  navigate(`/docDashboard/messages/${pat._id}`, { state: { patient: pat } });
                }}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 w-full">
                    {/* Patient Avatar */}
                    <div className="relative flex-shrink-0">
                      {pat.profileImage ? (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-2 border-gray-100 group-hover:border-indigo-200 transition-all duration-300 overflow-hidden">
                          <img
                            src={pat.profileImage}
                            alt="Patient"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border-2 border-gray-100 group-hover:border-indigo-200 transition-all duration-300 flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm sm:text-lg">
                            {(pat.username || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Patient Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors duration-300 truncate">
                        {pat.username}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
                        {pat.latestMessage || "Start a conversation..."}
                      </p>
                      <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm">{pat.timestamp ? new Date(pat.timestamp).toLocaleDateString() : 'No messages yet'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New Messages Count and Status */}
                  <div className="flex flex-col items-end space-y-2 sm:space-y-3 self-end sm:self-auto">
                    {viewedConversations.has(pat._id) ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium text-green-600 bg-green-50 px-2 sm:px-3 py-1 rounded-full">
                          seen
                        </span>
                      </div>
                    ) : (pat.unreadCount ?? 0) > 0 ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                          {pat.unreadCount > 99 ? '99+' : pat.unreadCount} new
                        </span>
                      </div>
                    ) : null}

                    {/* Action Indicator */}
                    <div className="flex items-center text-indigo-600 text-xs sm:text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                      <span className="text-xs sm:text-sm">View Chat</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChatList;
