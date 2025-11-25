import React, { useEffect, useState } from "react";
import { Phone, Video, PhoneMissed, PhoneOff, X, History } from "lucide-react";

const CallHistory = ({ userId, userModel, onClose }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/calls/history/${userId}/${userModel}`);
        const data = await res.json();
        if (data.success) {
          setCalls(data.calls);
        }
      } catch (err) {
        console.error("Error fetching call history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCallHistory();
  }, [userId, userModel]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <Phone size={16} className="text-green-500" />;
      case "missed":
        return <PhoneMissed size={16} className="text-red-500" />;
      case "declined":
        return <PhoneOff size={16} className="text-orange-500" />;
      case "cancelled":
        return <PhoneOff size={16} className="text-gray-500" />;
      case "ongoing":
        return <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />;
      default:
        return <Phone size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-white/20">
        <div className="p-6 border-b border-white/20 flex justify-between items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <History size={24} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Call History</h2>
              <p className="text-sm text-gray-600 font-medium">
                {calls.length} call{calls.length !== 1 ? 's' : ''} • Recent activity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/80 hover:bg-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 border border-white/50 backdrop-blur-sm"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="w-12 h-12 border-4 border-blue-200/50 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
              </div>
              <p className="text-gray-600 font-medium text-lg">Loading call history...</p>
              <p className="text-gray-400 text-sm mt-1">Fetching your recent calls</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-inner">
                  <Phone size={28} className="text-gray-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
                  <Phone size={12} className="text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">No calls yet</h3>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                Your call history will appear here once you make or receive calls. Start connecting with doctors and patients!
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {calls.map((call) => {
                const isCaller = String(call.callerId?._id || call.callerId) === String(userId);
                const otherParty = isCaller ? call.receiverId : call.callerId;

                // Get the other party's name (backend now properly populates the name field)
                const getOtherName = () => {
                  if (isCaller) {
                    return call.receiverId?.name || "Unknown User";
                  } else {
                    return call.callerId?.name || "Unknown User";
                  }
                };

                const otherName = getOtherName();
                const isOngoing = call.status === "ongoing";
                return (
                  <li key={call._id} className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                    isOngoing
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-100"
                      : isCaller
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100"
                        : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
                  }`}>
                    {/* Animated background for ongoing calls */}
                    {isOngoing && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 animate-pulse" />
                    )}

                    <div className="relative p-4 flex items-center gap-4">
                      {/* Status indicator with enhanced styling */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isOngoing
                          ? "bg-green-100 border-2 border-green-300"
                          : isCaller
                            ? "bg-blue-100 border-2 border-blue-300"
                            : "bg-purple-100 border-2 border-purple-300"
                      }`}>
                        {getStatusIcon(call.status)}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        {/* Header row with call type and direction */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                            call.callType === "video"
                              ? isOngoing
                                ? "bg-green-100 border border-green-300"
                                : "bg-blue-100 border border-blue-300"
                              : isOngoing
                                ? "bg-green-100 border border-green-300"
                                : "bg-emerald-100 border border-emerald-300"
                          }`}>
                            {call.callType === "video" ? (
                              <Video size={14} className={`${
                                isOngoing ? "text-green-600" : "text-blue-600"
                              }`} />
                            ) : (
                              <Phone size={14} className={`${
                                isOngoing ? "text-green-600" : "text-emerald-600"
                              }`} />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold truncate ${
                                isOngoing ? "text-green-800" : "text-gray-800"
                              }`}>
                                {otherName || "Unknown User"}
                              </span>

                              {/* Enhanced call direction badges */}
                              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                isOngoing
                                  ? "bg-green-200 text-green-800 border border-green-300"
                                  : isCaller
                                    ? "bg-blue-200 text-blue-800 border border-blue-300"
                                    : "bg-purple-200 text-purple-800 border border-purple-300"
                              }`}>
                                {isOngoing ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span>Ongoing</span>
                                  </>
                                ) : (
                                  <>
                                    {isCaller ? (
                                      <Phone size={10} className="text-blue-600" />
                                    ) : (
                                      <Phone size={10} className="text-purple-600 rotate-180" />
                                    )}
                                    <span>{isCaller ? "Outgoing" : "Incoming"}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Time and duration info */}
                        <div className={`text-xs flex items-center gap-2 ${
                          isOngoing ? "text-green-600" : "text-gray-500"
                        }`}>
                          <span className="font-medium">
                            {new Date(call.startTime).toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          {call.duration > 0 && !isOngoing && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="font-mono font-medium">
                                {formatDuration(call.duration)}
                              </span>
                            </>
                          )}

                          {isOngoing && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="font-mono font-medium text-green-600 animate-pulse">
                                Live
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Call quality indicator for ongoing calls */}
                      {isOngoing && (
                        <div className="flex-shrink-0">
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full border border-green-200">
                            <div className="flex gap-1">
                              <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0ms'}} />
                              <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '150ms'}} />
                              <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '300ms'}} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallHistory;