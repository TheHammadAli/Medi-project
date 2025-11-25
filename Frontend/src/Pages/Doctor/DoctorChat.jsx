import React, { useEffect, useState, useRef } from "react";
import ChatWindow from "../../Components/ChatWindow";
import { fetchDoctorMessages } from "../../Components/Chat/chatApi";
import ChatProvider from "../../Context/ChatContext";
import { jwtDecode } from "jwt-decode";
import socket from "../../Socket/socket";

const DoctorChat = () => {
  const [doctorId, setDoctorId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState(null);
  const [incomingFrom, setIncomingFrom] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [callError, setCallError] = useState(null);
  const [showAudioCallModal, setShowAudioCallModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const authDoctorId = decoded.id;

        const fetchProfile = async () => {
          try {
            const res = await fetch(`https://medipredict-backend.onrender.com/api/chat/get-doctor/${authDoctorId}`);
            const data = await res.json();
            if (data.success) {
              setDoctorId(data.doctor._id);
            }
          } catch (err) {
            console.error("Error fetching doctor profile:", err);
          }
        };

        fetchProfile();
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      if (!doctorId) return;
      try {
        const data = await fetchDoctorMessages(doctorId);
        if (data.success) {
          setPatients(data.patients);
        }
      } catch (err) {
        console.error("Error loading patients:", err);
      }
    };
    loadPatients();
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;

    const emitOnline = () => {
      socket.emit("user-online", { userId: doctorId, role: "doctor" });
      console.log("[DoctorChat] ✅ Sent user-online:", doctorId);
    };

    socket.on("connect", emitOnline);
    if (socket.connected) emitOnline();

    return () => {
      socket.off("connect", emitOnline);
    };
  }, [doctorId]);

  useEffect(() => {
    if (doctorId && patients.length > 0) {
      patients.forEach((pat) => {
        const roomId = [String(doctorId), String(pat._id)].sort().join("_");
        socket.emit("join-room", {
          doctorId: String(doctorId),
          patientId: String(pat._id),
        });
      });
    }
  }, [doctorId, patients]);

  const createPeerConnection = async (callType) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 [WebRTC] Sending ICE candidate:", event.candidate);
        socket.emit("ice-candidate", {
          toUserId: incomingFrom, // This should be the caller's ID (patient)
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("🎥 [WebRTC] Remote track received:", event.streams[0]);
      console.log("🎥 [WebRTC] Remote stream tracks:", event.streams[0].getTracks());
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteStreamRef.current = event.streams[0];
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      console.log("🎤 [WebRTC] Local stream obtained:", stream);
      console.log("🎤 [WebRTC] Local stream tracks:", stream.getTracks());
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      console.log("🎤 [WebRTC] Local stream added to peer connection.");
    } catch (err) {
      console.error("❌ [WebRTC] Failed to get local media:", err);
      setCallError("Failed to access camera or microphone.");
      return null;
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const handleAcceptCall = async () => {
    if (!incomingFrom || !incomingCallType || !incomingOffer) return;

    setIncomingCall(false);

    const pc = await createPeerConnection(incomingCallType);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      console.log("✉️ [WebRTC] Remote offer set.");

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("✉️ [WebRTC] Sending answer:", answer);

      socket.emit("accept-call", {
        toUserId: incomingFrom, // This should be the caller's ID (patient)
        answer,
      });

      if (incomingCallType === "audio") {
        setShowAudioCallModal(true);
      } else if (incomingCallType === "video") {
        setShowVideoCallModal(true);
      }
    } catch (err) {
      console.error("❌ [WebRTC] Error accepting call:", err);
      setCallError("Failed to accept call.");
      // Clean up if call acceptance fails
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
    setIncomingOffer(null);
  };

  const handleRejectCall = () => {
    setIncomingCall(false);
    socket.emit("end-call", { toUserId: incomingFrom });
    endCall();
  };

  const endCall = () => {
    console.log("Ending call and cleaning up resources.");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setShowAudioCallModal(false);
    setShowVideoCallModal(false);
    setIsMuted(false);
    setIsCameraOn(true);
    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
      }
    } else {
      const tracks = screenStreamRef.current?.getTracks();
      tracks?.forEach((track) => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      localVideoRef.current.srcObject = camStream;
    }
  };

  const toggleCamera = () => {
    const stream = localVideoRef.current?.srcObject;
    const videoTrack = stream?.getVideoTracks?.()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  useEffect(() => {
    if (!doctorId) return;

    socket.on("incoming-call", ({ fromUserId, offer, callType }) => {
      console.log("[DoctorChat.jsx] 📞 Incoming call from:", fromUserId, "Type:", callType);
      setIncomingCall(true);
      setIncomingCallType(callType);
      setIncomingFrom(fromUserId);
      setIncomingOffer(offer);
    });

    socket.on("call-accepted", async ({ answer }) => {
      console.log("✅ [WebRTC] Call accepted, received answer:", answer);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("✉️ [WebRTC] Remote answer set.");
        } catch (err) {
          console.error("❌ [WebRTC] Error setting remote description (answer):", err);
          setCallError("Failed to establish call.");
        }
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      console.log("🧊 [WebRTC] Received ICE candidate:", candidate);
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("🧊 [WebRTC] ICE candidate added.");
        } catch (err) {
          console.error("❌ [WebRTC] Error adding ICE candidate:", err);
        }
      }
    });

    socket.on("call-ended", () => {
      console.log("📴 [WebRTC] Call ended by remote party.");
      endCall();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("ice-candidate");
      socket.off("call-ended");
      endCall();
    };
  }, [doctorId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">Chat with Patients</h2>

      {/* Call Error Modal */}
      {callError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <p>{callError}</p>
        </div>
      )}

      {/* Audio Call Modal */}
      {showAudioCallModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 w-[320px] shadow-2xl flex flex-col items-center text-center animate-fade-in border border-gray-100 relative">
            <div className="relative mb-6">
              {selectedPatient.imageUrl ? (
                <img
                  src={selectedPatient.imageUrl}
                  alt={selectedPatient.name}
                  className="w-28 h-28 rounded-full object-cover shadow-xl ring-4 ring-blue-400"
                />
              ) : (
                <div className="w-28 h-28 bg-blue-500 text-white text-4xl font-bold rounded-full flex items-center justify-center shadow-xl ring-4 ring-blue-400">
                  {selectedPatient.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-md"></span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">{selectedPatient.name}</h3>
            <p className="text-sm text-gray-500 mb-6 animate-pulse">In Call...</p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shadow-lg text-gray-700 transition"
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                onClick={() => {
                  socket.emit("end-call", { toUserId: selectedPatient._id });
                  endCall();
                }}
                title="End Call"
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg text-white transition"
              >
                <PhoneOff size={26} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="relative w-full h-full overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-28 right-6 w-64 h-40 bg-black border-2 border-white rounded-lg shadow-xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-2 text-white text-xs bg-black/40 px-2 py-0.5 rounded">
                You
              </div>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 bg-white/60 backdrop-blur-lg rounded-full shadow-lg px-6 py-3">
              <button
                onClick={toggleMute}
                className="w-12 h-12 bg-white text-gray-700 hover:bg-gray-200 rounded-full shadow-lg flex items-center justify-center transition"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                onClick={toggleCamera}
                className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center"
              >
                {isCameraOn ? <VideoIcon size={20} /> : <VideoIcon size={20} className="opacity-50" />}
              </button>
              <button
                onClick={toggleScreenShare}
                className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center"
              >
                <Monitor size={20} />
              </button>
              <button
                onClick={() => {
                  socket.emit("end-call", { toUserId: selectedPatient._id });
                  endCall();
                }}
                className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition"
                title="End Call"
              >
                <PhoneOff size={26} />
              </button>
            </div>
            <div className="absolute top-6 left-6 text-white text-sm bg-black/40 px-3 py-1 rounded-full shadow">
              {selectedPatient?.name || "Patient"}
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg text-center w-[300px]">
            <div className="flex flex-col items-center mb-4">
              <div className="w-5 h-5 bg-green-500 rounded-full animate-ping mb-2" />
              <p className="text-xl font-bold">
                📞 Incoming {incomingCallType === "audio" ? "Audio" : "Video"} Call
              </p>
            </div>
            <div className="flex justify-around">
              <button onClick={handleAcceptCall} className="bg-green-500 px-4 py-2 rounded text-white">
                Accept
              </button>
              <button onClick={handleRejectCall} className="bg-red-500 px-4 py-2 rounded text-white">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient list (no sidebar) */}
      <div className="flex flex-wrap gap-4 mb-6">
        {patients.length === 0 ? (
          <p className="text-gray-500">No messages from patients yet.</p>
        ) : (
          patients.map((pat) => (
            <button
              key={pat._id}
              onClick={() => setSelectedPatient(pat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedPatient?._id === pat._id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-100"
              }`}
            >
              {pat.name}
            </button>
          ))
        )}
      </div>

      {/* Chat area */}
      {selectedPatient ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <ChatProvider doctorId={doctorId} patientId={selectedPatient._id}>
            <ChatWindow
              doctorId={doctorId}
              patientId={selectedPatient._id}
              senderRole="DocProfile"
            />
          </ChatProvider>
        </div>
      ) : (
        <p className="text-gray-400 text-center">Select a patient to start chatting.</p>
      )}
    </div>
  );
};

export default DoctorChat;
