import React, { useEffect, useState, useRef, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faMicrophone, faPhone, faVideo, faSmile, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { Send, Video as VideoIcon, Monitor, PhoneOff, Phone, Mic, MicOff, History, Paperclip, Smile } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import socket from "../../Socket/socket";
import CallHistory from "../../Components/CallHistory";
import { useCall } from "../../Context/CallContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { fetchChatHistory } from "../../Components/Chat/chatApi";
import ringtone from "../../assets/simple-ringtone-25290.mp3";
import outgoingTone from "../../assets/outgoing.mp3";
import PatientProfileContext from "../../Context/PatientProfileContext";
import {
  getUserMediaWithConstraints,
  verifyAppliedConstraints,
  checkOpusSupport,
  monitorAudioQuality,
  cleanupAudioProcessor,
  debugAudioDevices
} from "../../Utils/audioUtils";

const Messages = () => {
  const token = localStorage.getItem("token");
  const [patientId, setPatientId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [onlineDoctors, setOnlineDoctors] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState(null);
  const [incomingFrom, setIncomingFrom] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showAudioCallModal, setShowAudioCallModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [callError, setCallError] = useState(null);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState("00:00");
  const [localStream, setLocalStream] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const incomingRingRef = useRef(new Audio(ringtone));
  const outgoingRingRef = useRef(new Audio(outgoingTone));
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const { startCall } = useCall();
  const navigate = useNavigate();
  const location = useLocation();
  const { docid } = useParams();
  const { patientProfile } = useContext(PatientProfileContext);


  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setPatientId(decoded.id);
        console.log("[Messages] Decoded patientId:", decoded.id);
      } catch (err) {
        console.error("[Messages] Invalid token:", err);
      }
    }
  }, [token]);

useEffect(() => {
  if (!patientId) return;

  const emitOnline = () => {
    console.log(`[Messages] Emitting user-online with patientId: ${patientId}`);
    socket.emit("user-online", { userId: patientId, role: "patient" });
  };

  socket.on("connect", () => {
    console.log("[Messages] Socket connected:", socket.id);
    emitOnline();
  });

  socket.on("connect_error", (err) => {
    console.error("[Messages] Socket connection error:", err);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Messages] Socket disconnected: ${reason}`);
  });

  if (socket.connected) emitOnline();

  return () => {
    socket.off("connect");
    socket.off("connect_error");
    socket.off("disconnect");
  };
}, [patientId]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/appointments/chat-doctors/${patientId}`);
        const data = await res.json();
        if (data.success) setDoctors(data.doctors);
      } catch (err) {
        console.error("[Messages] Failed to load doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchDoctors();
  }, [patientId]);

  useEffect(() => {
    if (docid && doctors.length > 0) {
      const doctor = doctors.find((doc) => doc._id === docid);
      if (doctor) {
        setSelectedDoctor(doctor);
        setShowMobileChat(true); // Show chat view on mobile when navigating to specific doctor
      } else {
        console.error("[Messages] Doctor not found for docid:", docid);
        navigate("/messages");
        setShowMobileChat(false);
      }
    } else if (!docid) {
      // When navigating back to /messages without specific doctor, show doctors list on mobile
      setShowMobileChat(false);
      setSelectedDoctor(null);
    }
  }, [docid, doctors, navigate]);

  useEffect(() => {
    if (!patientId) return;

    console.log("call is coming")
 
    const handleIncomingCall = ({ fromUserId, offer, callType }) => {
      console.log("[Messages.jsx] 📞 handleIncomingCall triggered.");
      console.log("[Messages.jsx] 📞 Incoming call from:", fromUserId, "Type:", callType);
      incomingRingRef.current.loop = true;
      incomingRingRef.current.play().catch(console.error);
      setIncomingCall(true);
      setIncomingCallType(callType);
      setIncomingFrom(fromUserId);
      setIncomingOffer(offer);
    };
 
    const handleCallDeclined = () => {
      console.log("[Messages.jsx] ❌ Call was declined by the doctor");
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
      setShowAudioCallModal(false);
      setShowVideoCallModal(false);
    };

    const handleCallCancelled = () => {
      console.log("[Messages.jsx] ❌ Call was cancelled by the doctor before acceptance/rejection");
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
      setIncomingCall(false);
      setIncomingCallType(null);
      setIncomingFrom(null);
      setIncomingOffer(null);
    };
 
    socket.on("connect", () => {
      console.log("[Messages] Socket connected:", socket.id);
      socket.emit("user-online", { userId: patientId, role: "patient" });
    });
 
    socket.on("update-user-status", ({ userId, status }) => {
      console.log("[Messages] Received update-user-status:", userId, status);
      setOnlineDoctors((prev) => {
        const updatedOnlineDoctors = { ...prev, [userId]: status };
        console.log("[Messages] Updated onlineDoctors:", updatedOnlineDoctors);
        return updatedOnlineDoctors;
      });
    });
 
    socket.on("receive-message", (msg) => {
      if (msg.doctorId === selectedDoctor?._id) {
        setMessages((prev) => {
          const newMessages = [...prev, msg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return newMessages;
        });
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    });
 
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-declined", handleCallDeclined);
     socket.on("call-cancelled", handleCallCancelled);


    socket.on("call-accepted", async ({ answer }) => {
      console.log("✅ [WebRTC] Call accepted, received answer:", answer);
      setCallStatus("Connected");
      setCallStartTime(Date.now());
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("✉️ [WebRTC] Remote answer set.");
        } catch (err) {
          console.error("❌ [WebRTC] Error setting remote description (answer):", err);
          setCallError("Failed to establish call.");
        }
      }
      // Don't show feedback on connect - only show when call ends
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
      socket.off("connect");
      socket.off("update-user-status");
      socket.off("receive-message");
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-declined", handleCallDeclined);
      socket.off("call-cancelled", handleCallCancelled);
      socket.off("call-accepted");
      socket.off("ice-candidate");
      socket.off("call-ended");
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
      endCall(); // Ensure cleanup on unmount
    };
  }, [patientId, selectedDoctor]);

  useEffect(() => {
    if (patientId && selectedDoctor) {
      socket.emit("join-room", { doctorId: selectedDoctor._id, patientId });
      console.log("[Messages] Patient joined room:", `${selectedDoctor._id}:${patientId}`);
    }
  }, [patientId, selectedDoctor]);

  useEffect(() => {
    const loadChat = async () => {
      if (!selectedDoctor || !patientId) return;
      const data = await fetchChatHistory(selectedDoctor._id, patientId);
      if (data.success) setMessages(data.messages);
    };
    loadChat();
  }, [selectedDoctor, patientId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0; // Ensure no audio feedback

      // Play with enhanced error handling
      const playLocalVideo = async (retryCount = 0) => {
        try {
          await localVideoRef.current.play();
          console.log("📹 [WebRTC] Local video playing successfully");
        } catch (err) {
          console.error(`❌ [WebRTC] Error playing local video (attempt ${retryCount + 1}):`, err);
          if (retryCount < 3) {
            setTimeout(() => {
              playLocalVideo(retryCount + 1);
            }, 500 * Math.pow(2, retryCount));
          }
        }
      };

      playLocalVideo();
    }
  }, [localStream]);

  useEffect(() => {
    let interval;
    if (callStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      setCallDuration("00:00");
    }
    return () => clearInterval(interval);
  }, [callStartTime]);


  const createPeerConnection = async (callType) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    // Add connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log("🔗 [WebRTC] Connection state changed:", pc.connectionState);
      switch (pc.connectionState) {
        case 'new':
        case 'connecting':
          setCallStatus('Connecting...');
          break;
        case 'connected':
          setCallStatus('Connected');
          setCallStartTime(Date.now());
          break;
        case 'disconnected':
          setCallStatus('Reconnecting...');
          break;
        case 'failed':
          setCallError('Connection failed. Please try again.');
          break;
        case 'closed':
          setCallStatus('Call ended');
          break;
      }
    };

    // Add ICE connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log("🧊 [WebRTC] ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.error("🧊 [WebRTC] ICE connection failed, trying to restart...");
        pc.restartIce();
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 [WebRTC] Sending ICE candidate:", event.candidate);
        socket.emit("ice-candidate", {
          toUserId: selectedDoctor._id,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("🎥 [WebRTC] Remote stream received:", event.streams[0]);
      console.log("🎵 [WebRTC] Remote tracks:", event.streams[0].getTracks().map(t => t.kind));

      if (event.streams[0]) {
        remoteStreamRef.current = event.streams[0];

        // Handle video track
        const videoTrack = event.streams[0].getVideoTracks()[0];
        if (videoTrack && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.volume = 1.0;
          remoteVideoRef.current.muted = false;

          // Force enable video track
          videoTrack.enabled = true;

          // Play with enhanced error handling
          const playVideo = async (retryCount = 0) => {
            try {
              await remoteVideoRef.current.play();
              console.log("🎥 [WebRTC] Remote video playing successfully");
            } catch (err) {
              console.error(`❌ [WebRTC] Error playing remote video (attempt ${retryCount + 1}):`, err);
              if (retryCount < 3) {
                setTimeout(() => {
                  playVideo(retryCount + 1);
                }, 1000 * Math.pow(2, retryCount));
              }
            }
          };

          playVideo();
          console.log("🎥 [WebRTC] Remote video track attached");
        }

        // Handle audio track - improved audio handling
        const audioTrack = event.streams[0].getAudioTracks()[0];
        if (audioTrack) {
          console.log("🎵 [WebRTC] Remote audio track found:", {
            enabled: audioTrack.enabled,
            muted: audioTrack.muted,
            readyState: audioTrack.readyState,
            settings: audioTrack.getSettings ? audioTrack.getSettings() : 'N/A'
          });

          if (remoteAudioRef.current) {
            // Ensure audio element is properly configured
            remoteAudioRef.current.srcObject = event.streams[0];
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.muted = false;

            // Force enable audio track
            audioTrack.enabled = true;

            // Play with enhanced error handling and retry mechanism
            const playAudio = async (retryCount = 0) => {
              try {
                await remoteAudioRef.current.play();
                console.log("🎵 [WebRTC] ✅ Remote audio playing successfully");
              } catch (err) {
                console.error(`❌ [WebRTC] Error playing remote audio (attempt ${retryCount + 1}):`, err);
                if (retryCount < 3) {
                  // Try again with exponential backoff
                  setTimeout(() => {
                    playAudio(retryCount + 1);
                  }, 1000 * Math.pow(2, retryCount));
                } else {
                  console.error("❌ [WebRTC] Failed to play audio after multiple attempts");
                  // Try to resume audio context if available
                  if (window.audioContext && window.audioContext.state === 'suspended') {
                    window.audioContext.resume();
                  }
                }
              }
            };

            playAudio();
            console.log("🎵 [WebRTC] Remote audio track attached");
          } else {
            console.error("🎵 [WebRTC] No remote audio element ref found!");
          }
        } else {
          console.warn("🎵 [WebRTC] No audio track in remote stream");
        }
      }
    };

    try {
      console.log('🎧 Initializing enhanced audio for peer connection...');

      // Check Opus codec support
      const opusSupport = checkOpusSupport();
      console.log('🎵 Opus codec support:', opusSupport);

      // Debug audio devices if in development
      if (process.env.NODE_ENV === 'development') {
        await debugAudioDevices();
      }

      const stream = await getUserMediaWithConstraints(callType, { forWebRTC: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Prevent feedback
        localVideoRef.current.play().catch(console.error);
      }

      console.log("🎤 [WebRTC] Local stream obtained:", stream);

      // Verify applied constraints and monitor audio quality
      const constraintReport = await verifyAppliedConstraints(stream);
      console.log('🎛️ Constraint verification report:', constraintReport);

      const qualityMetrics = monitorAudioQuality(stream);
      console.log('📊 Audio quality metrics:', qualityMetrics);

      stream.getTracks().forEach((track) => {
        console.log("🎤 [WebRTC] Adding track to peer connection:", {
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings ? track.getSettings() : 'N/A'
        });
        pc.addTrack(track, stream);
        console.log("🎤 [WebRTC] ✅ Track added to peer connection:", track.kind);
      });
    } catch (err) {
      console.error("❌ [WebRTC] Failed to get local media:", err);
      let errorMessage = "Failed to access camera or microphone.";

      if (err.name === "NotAllowedError") {
        errorMessage = "Permission denied: Please allow camera and microphone access in your browser settings and refresh the page.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera or microphone found. Please ensure devices are connected and working.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera or microphone is in use by another application. Please close other apps and try again.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera or microphone doesn't support the required settings. Trying with basic settings...";
        // Try with basic constraints as fallback
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            audio: type === 'audio' || type === 'video',
            video: type === 'video' ? { width: 640, height: 480 } : false
          });
          localStreamRef.current = fallbackStream;
          setLocalStream(fallbackStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = fallbackStream;
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(console.error);
          }
          return pc;
        } catch (fallbackErr) {
          console.error("❌ [WebRTC] Fallback also failed:", fallbackErr);
          errorMessage = "Unable to access camera or microphone with any settings. Please check your device permissions.";
        }
      } else if (err.name === "SecurityError") {
        errorMessage = "Security error: Please ensure you're using HTTPS and have proper permissions.";
      } else if (err.name === "AbortError") {
        errorMessage = "Media access was aborted. Please try again.";
      }

      setCallError(errorMessage);
      return null;
    }

    peerConnectionRef.current = pc;
    return pc;
  };

 const handleStartCall = async (type) => {
   if (!selectedDoctor || !patientId || !socket.connected) {
     console.error("[Messages] Cannot start call: Missing IDs or socket not connected", {
       selectedDoctorId: selectedDoctor?._id,
       patientId,
       socketConnected: socket.connected,
     });
     setCallError("Cannot start call: Connection issue");
     return;
   }

   // Wait briefly to ensure user-online has been processed
   await new Promise(resolve => setTimeout(resolve, 1000));

   console.log(`[Messages] Initiating ${type} call to doctorId: ${selectedDoctor._id} from patientId: ${patientId}`);

   // IMMEDIATELY show modal for better UX
   if (type === "audio") {
     setShowAudioCallModal(true);
     setCallStatus("Connecting...");
   } else if (type === "video") {
     setShowVideoCallModal(true);
     setCallStatus("Connecting...");
   }

   // Ensure microphone is enabled by default when starting call
   setIsMuted(false);

   outgoingRingRef.current.loop = true;
   outgoingRingRef.current.play().catch(console.error);

   // Run WebRTC setup asynchronously while modal is already visible
   setTimeout(async () => {
     try {
       const pc = await createPeerConnection(type);
       if (!pc) {
         setCallError("Failed to initialize call.");
         if (type === "audio") {
           setShowAudioCallModal(false);
         } else {
           setShowVideoCallModal(false);
         }
         return;
       }

       const offer = await pc.createOffer({
         offerToReceiveAudio: true,
         offerToReceiveVideo: type === "video",
       });
       await pc.setLocalDescription(offer);
       console.log("✉️ [WebRTC] Sending offer:", offer);

       socket.emit("call-user", {
         toUserId: selectedDoctor._id,
         fromUserId: patientId,
         callerModel: "Patient",
         receiverModel: "DocProfile",
         offer,
         callType: type,
       });

       // Update status to ringing once setup is complete
       setCallStatus("Ringing");

       // Set callStartTime when patient initiates call
       setCallStartTime(Date.now());
       console.log("[Messages] Call initiated by patient, callStartTime set:", Date.now());
     } catch (err) {
       console.error("❌ [WebRTC] Error creating or sending offer:", err);
       setCallError("Failed to initiate call.");
       outgoingRingRef.current.pause();
       outgoingRingRef.current.currentTime = 0;
       if (type === "audio") {
         setShowAudioCallModal(false);
       } else {
         setShowVideoCallModal(false);
       }
     }
   }, 100); // Small delay to ensure modal is visible first

   setTimeout(() => {
     outgoingRingRef.current.pause();
     outgoingRingRef.current.currentTime = 0;
   }, 5000);
 };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const payload = {
      doctorId: selectedDoctor._id,
      patientId,
      senderId: patientId,
      senderModel: "Patient",
      text: newMessage,
      type: "text",
      timestamp: new Date(),
    };

    try {
      const res = await fetch("http://localhost:8000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        const savedMessage = data.messages[data.messages.length - 1]; // latest message
        setNewMessage("");

        // Add to local state immediately for better UX
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === savedMessage._id);
          if (exists) return prev;
          const newMessages = [...prev, savedMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return newMessages;
        });

        // Emit to socket for real-time delivery
        socket.emit("send-message", {
          ...savedMessage,
          doctorId: selectedDoctor._id,
          patientId: patientId,
        });

        // Optional: Only scroll if user is already near the bottom
        // This prevents unwanted scrolling when user is reading older messages
      }

    } catch (err) {
      console.error("[Messages] Error sending message:", err);
    } finally {
      // Removed automatic scroll to prevent unwanted page movement
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const payload = {
        doctorId: selectedDoctor._id,
        patientId,
        senderId: patientId,
        senderModel: "Patient",
        type: file.type.includes("pdf") ? "file" : "image",
        fileData: base64,
        fileName: file.name,
        timestamp: new Date(),
      };

      try {
        const res = await fetch("http://localhost:8000/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          socket.emit("send-message", data.messages[0]);
          setMessages((prev) => [...prev, ...data.messages]);
        }
      } catch (err) {
        console.error("[Messages] Error sending file:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDoctor || !patientId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doctorId", selectedDoctor._id);
    formData.append("patientId", patientId);
    formData.append("senderId", patientId);
    formData.append("senderModel", "Patient");
    formData.append("type", "file");
    formData.append("timestamp", new Date().toISOString());

    try {
      const res = await fetch("http://localhost:8000/api/chat/send-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        const savedMessage = data.messages[0];
        socket.emit("send-message", savedMessage);
        setMessages((prev) => [...prev, savedMessage]);
      }
    } catch (err) {
      console.error("[Messages] Error sending file:", err);
    }
  };

  const acceptCall = async () => {
    console.log("[Messages.jsx] 🟢 acceptCall function initiated.");
    if (!incomingFrom || !incomingCallType || !incomingOffer) {
      console.error("[Messages.jsx] ❌ acceptCall: Missing incomingFrom, incomingCallType, or incomingOffer.");
      return;
    }

    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
    setIncomingCall(false);

    // Ensure microphone is enabled by default when accepting call
    setIsMuted(false);

    const pc = await createPeerConnection(incomingCallType);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      console.log("✉️ [WebRTC] Remote offer set.");
      setCallStatus("Connected");
      setCallStartTime(Date.now());

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: incomingCallType === "video",
      });
      await pc.setLocalDescription(answer);
      console.log("✉️ [WebRTC] Sending answer:", answer);

      socket.emit("accept-call", {
        toUserId: incomingFrom, // This should be the caller's ID
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

  const rejectCall = () => {
    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
    setIncomingCall(false);
    socket.emit("end-call", { toUserId: incomingFrom });
    endCall();
  };

  const endCall = () => {
    console.log("Ending call and cleaning up resources.");

    // First, ensure microphone and camera are turned off
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (track.kind === 'audio') {
          track.enabled = false; // Turn off microphone
          console.log("[Messages] Microphone turned off");
        } else if (track.kind === 'video') {
          track.enabled = false; // Turn off camera
          console.log("[Messages] Camera turned off");
        }
        track.stop(); // Stop the track
      });
      localStreamRef.current = null;
    }

    // Stop remote stream if exists
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    // Stop screen sharing if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.enabled = false; // Ensure screen sharing is off
        track.stop();
      });
      screenStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Cleanup audio processor
    cleanupAudioProcessor();

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    // Update UI state to reflect microphone and camera are off
    setShowAudioCallModal(false);
    setShowVideoCallModal(false);
    setIncomingCall(false); // Ensure incoming call modal is dismissed
    setIsMuted(true); // Set to muted state
    setIsCameraOn(false); // Set to camera off state
    setIsScreenSharing(false);
    setLocalStream(null);
    setCallStatus("Connecting...");
    setCallStartTime(null);
    setCallDuration("00:00");

    // Stop all audio elements
    if (outgoingRingRef.current) {
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
    }
    if (incomingRingRef.current) {
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
    }

    console.log("[Messages] Call ended - microphone and camera turned off");

    // Show feedback form when call ends (only if call was connected) - immediately display feedback
    if (callStartTime) {
      setShowFeedback(true);
    }
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
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      // Revert to camera stream
      const camStream = await getUserMediaWithConstraints('video', { forWebRTC: true });
      localStreamRef.current = camStream; // Update localStreamRef
      localVideoRef.current.srcObject = camStream;
      localVideoRef.current.play().catch(console.error);
      // Re-add camera tracks to peer connection
      peerConnectionRef.current.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'video') {
          peerConnectionRef.current.removeTrack(sender);
        }
      });
      camStream.getVideoTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, camStream);
      });
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
      // Also inform the peer about the track's state change
      peerConnectionRef.current?.getSenders().forEach(sender => {
        if (sender.track === videoTrack) {
          sender.track.enabled = videoTrack.enabled;
        }
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackRating || !feedbackComment.trim()) {
      toast.error("Please provide both rating and comment");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await fetch("http://localhost:8000/api/feedback/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          patientId: patientId,
          rating: feedbackRating,
          comment: feedbackComment,
          callDuration: callDuration,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Thank you for your feedback!");
        setShowFeedback(false);
        setFeedbackRating(0);
        setFeedbackComment("");
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50">
      {/* Hidden audio element for remote audio playback */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        muted={false}
        volume={1.0}
        style={{ display: 'none' }}
      />

      {/* Sidebar - Mobile: Show only when not in chat view, Desktop: Always show */}
      <aside className={`w-full md:w-[340px] bg-white border-r border-gray-200 shadow-lg animate-slide-in-left ${
        showMobileChat ? 'hidden md:block' : 'block'
      }`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
              <p className="text-xs text-gray-500">Recent conversations</p>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faComment} className="text-white text-sm" />
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-gray-100 bg-white">
          <div className="relative">
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-700 placeholder:text-gray-400 transition-all duration-200"
              placeholder="Search conversations..."
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-140px)] bg-white">
          {loading ? (
            <div className="flex flex-col space-y-3 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations</h3>
              <p className="text-xs text-gray-500">Your doctor chats will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {doctors.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setShowMobileChat(true);

                    // Get patient name from PatientProfileContext or fallback to user data
                    const patientName = patientProfile?.firstName && patientProfile?.lastName
                      ? `${patientProfile.firstName} ${patientProfile.lastName}`
                      : "Patient";

                    navigate(`/messages/${doc._id}`, {
                      state: {
                        patient: {
                          username: patientName,
                          profileImage: patientProfile?.profileImage || null
                        }
                      }
                    });
                  }}
                  className={`cursor-pointer p-4 hover:bg-gray-50 transition-colors duration-150 ${
                    selectedDoctor?._id === doc._id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={doc.imageUrl || "/default-doctor.png"}
                        className="w-12 h-12 rounded-full object-cover"
                        alt={doc.name}
                      />
                      {onlineDoctors[doc._id] === "online" && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          Dr. {doc.name}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {doc.time || "3h"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {doc.speciality || "Doctor"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Chat Window - Mobile: Show only when in chat view, Desktop: Always show */}
      <main className={`flex-1 flex flex-col overflow-hidden bg-white animate-slide-in-right ${
        showMobileChat ? 'block' : 'hidden md:flex'
      }`}>
        {selectedDoctor ? (
          <>
            {/* Chat Header */}
            <div className="h-[70px] sm:h-[75px] md:h-[80px] flex items-center justify-between p-3 sm:p-4 md:p-6 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                {/* Back button for mobile */}
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
                  title="Back to doctors"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="relative flex-shrink-0">
                  <img
                    src={selectedDoctor.imageUrl || "/default-doctor.png"}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover shadow-md border-2 border-white"
                    alt={selectedDoctor.name}
                  />
                  {onlineDoctors[selectedDoctor._id] === "online" && (
                    <span className="absolute -bottom-0.5 -right-0.5 sm:bottom-0 sm:right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-sm sm:text-base md:text-lg text-gray-800 truncate">Dr. {selectedDoctor.name}</h2>
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 sm:gap-2">
                    <span className="truncate">{selectedDoctor.speciality || "Doctor"}</span>
                    {onlineDoctors[selectedDoctor._id] === "online" && (
                      <span className="text-green-500 font-medium flex-shrink-0">• Online</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
                <button
                  onClick={() => setShowCallHistory(true)}
                  className="p-2 sm:p-3 md:p-4 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-all duration-200 shadow-md"
                  title="Call History"
                >
                  <History size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => onlineDoctors[selectedDoctor._id] === "online" && handleStartCall("audio")}
                  className={`p-2 sm:p-3 md:p-4 rounded-full transition-all duration-200 shadow-md ${
                    onlineDoctors[selectedDoctor._id] === "online"
                      ? "bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  title={onlineDoctors[selectedDoctor._id] === "online" ? "Audio Call" : "Doctor is offline"}
                >
                  <Phone size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => onlineDoctors[selectedDoctor._id] === "online" && handleStartCall("video")}
                  className={`p-2 sm:p-3 md:p-4 rounded-full transition-all duration-200 shadow-md ${
                    onlineDoctors[selectedDoctor._id] === "online"
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  title={onlineDoctors[selectedDoctor._id] === "online" ? "Video Call" : "Doctor is offline"}
                >
                  <VideoIcon size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faComment} className="text-blue-500 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Start a conversation</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Send a message to {selectedDoctor.name} to begin your consultation
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isSender = msg.senderId === patientId && msg.senderModel === "Patient";
                  const prevMsg = messages[index - 1];
                  const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
                  const timeDiff = prevMsg ? new Date(msg.timestamp) - new Date(prevMsg.timestamp) : 0;
                  const showTime = !prevMsg || timeDiff > 5 * 60 * 1000; // 5 minutes

                  return (
                    <div key={msg._id} className={`flex ${isSender ? "justify-end" : "justify-start"} group`}>
                      <div className={`flex items-end gap-3 max-w-[70%] ${isSender ? "flex-row-reverse" : "flex-row"}`}>

                        <div className="flex flex-col">
                          {showTime && (
                            <div className="text-xs text-gray-400 text-center mb-2 px-3 py-1 bg-gray-100 rounded-full self-center">
                              {new Date(msg.timestamp).toLocaleDateString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}

                          <div
                            className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                              isSender
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                            }`}
                          >
                            {msg.type === "text" ? (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            ) : msg.type === "image" ? (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{msg.fileName || "Image"}</p>
                                  <p className="text-xs text-gray-500">Image file</p>
                                </div>
                                <a
                                  href={msg.fileData}
                                  download={msg.fileName}
                                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{msg.fileName}</p>
                                  <p className="text-xs text-gray-500">PDF Document</p>
                                </div>
                                <a
                                  href={msg.fileData}
                                  download={msg.fileName}
                                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              </div>
                            )}

                            <div className={`text-xs mt-2 ${
                              isSender ? "text-blue-100" : "text-gray-400"
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="w-full p-4 relative z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200">
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 z-30">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji) => {
                      setNewMessage(prev => prev + emoji.native);
                      setShowEmojiPicker(false);
                    }}
                    theme="light"
                  />
                </div>
              )}
              <div className="flex items-center bg-gray-100 rounded-full shadow-md px-4 py-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  className="text-gray-500 hover:text-blue-500 mr-2 md:mr-3 transition"
                  onClick={() => fileInputRef.current.click()}
                  title="Attach file"
                >
                  <Paperclip size={18} className="md:w-5 md:h-5" />
                </button>
                <button
                  className="text-gray-500 hover:text-yellow-500 mr-2 md:mr-3 transition"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  title="Emoji"
                >
                  <Smile size={18} className="md:w-5 md:h-5" />
                </button>
                <input
                  type="text"
                  className="flex-grow bg-transparent focus:outline-none text-sm px-2"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full ml-2 shadow-md"
                  disabled={!newMessage.trim()}
                >
                  <Send size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faComment} className="text-blue-500 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Welcome to Messages</h2>
            <p className="text-gray-500 max-w-md leading-relaxed">
              Select a doctor from the sidebar to start a conversation. You can send messages, share files, and make audio/video calls.
            </p>
          </div>
        )}
      </main>

      {/* Call Error Modal */}
      {callError && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
          <div className="bg-red-500 text-white p-4 rounded-2xl shadow-xl border border-red-400 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium">{callError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Audio Call Modal */}
      {showAudioCallModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 w-[360px] shadow-2xl flex flex-col items-center text-center border border-white/20 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
            </div>

            <div className="relative mb-8 mt-4">
              {selectedDoctor.imageUrl ? (
                <img
                  src={selectedDoctor.imageUrl}
                  alt={selectedDoctor.name}
                  className="w-32 h-32 rounded-full object-cover shadow-2xl ring-4 ring-blue-400/30"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-5xl font-bold rounded-full flex items-center justify-center shadow-2xl">
                  {selectedDoctor.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">ONLINE</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">Dr. {selectedDoctor.name}</h3>
            <p className="text-gray-500 mb-4 animate-pulse font-medium">Audio Call • {callStatus}</p>
            {callStatus === "Connected" && (
              <p className="text-gray-600 mb-4 font-mono text-lg">{callDuration}</p>
            )}

            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => {
                  const newMutedState = !isMuted;
                  setIsMuted(newMutedState);
                  const audioTrack = localStreamRef.current?.getAudioTracks()[0];
                  if (audioTrack) {
                    audioTrack.enabled = !newMutedState;
                  }
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110 ${
                  isMuted
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button
                onClick={() => {
                  setShowAudioCallModal(false);
                  socket.emit("call-cancelled", { toUserId: selectedDoctor._id });
                  socket.emit("end-call", { toUserId: selectedDoctor._id });
                }}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl text-white transition-all duration-200 transform hover:scale-110"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCallModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="relative w-full h-full overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              <div className="bg-black/40 backdrop-blur-lg text-white px-4 py-2 rounded-2xl">
                <h3 className="font-semibold">{selectedDoctor?.name ? `Dr. ${selectedDoctor.name}` : "Doctor"}</h3>
                <p className="text-sm opacity-75">Video Call • {callStatus}</p>
              </div>
              <div className="flex gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium font-mono">{callStatus === "Connected" ? callDuration : "Live"}</span>
              </div>
            </div>

            <div className="absolute bottom-32 right-6 w-72 h-44 bg-black/80 border-2 border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <video
                ref={localVideoRef}
                srcObject={localStream}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 text-white text-sm bg-black/60 px-3 py-1 rounded-lg">
                You
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl px-8 py-4">
              <button
                onClick={() => {
                  const newMutedState = !isMuted;
                  setIsMuted(newMutedState);
                  localVideoRef.current?.srcObject?.getAudioTracks().forEach((track) => {
                    track.enabled = !newMutedState;
                  });
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                  isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                  isCameraOn ? "bg-white/20 text-white hover:bg-white/30" : "bg-red-500 text-white"
                }`}
                title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
              >
                <VideoIcon size={24} className={isCameraOn ? "opacity-100" : "opacity-50"} />
              </button>

              <button
                onClick={toggleScreenShare}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                  isScreenSharing ? "bg-blue-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                }`}
                title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
              >
                <Monitor size={24} />
              </button>

              <button
                onClick={() => {
                  socket.emit("call-cancelled", { toUserId: selectedDoctor._id });
                  socket.emit("end-call", { toUserId: selectedDoctor._id });
                  endCall();
                }}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-xl"
                title="End Call"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 w-[360px] shadow-2xl flex flex-col items-center text-center border border-white/20 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
            </div>

            <div className="relative mb-8 mt-4">
              {selectedDoctor?.imageUrl ? (
                <img
                  src={selectedDoctor.imageUrl}
                  alt={selectedDoctor.name}
                  className="w-32 h-32 rounded-full object-cover shadow-2xl ring-4 ring-blue-400/30"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-5xl font-bold rounded-full flex items-center justify-center shadow-2xl">
                  {selectedDoctor?.name?.charAt(0).toUpperCase() || "D"}
                </div>
              )}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">ONLINE</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">Incoming Call</h3>
            <p className="text-lg text-gray-600 mb-1">Dr. {selectedDoctor?.name || "Doctor"}</p>
            <p className="text-gray-500 mb-6 animate-pulse font-medium">{incomingCallType === "audio" ? "Audio Call" : "Video Call"} • Ringing...</p>

            <div className="flex items-center justify-center gap-8">
              <button
                onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl text-white transition-all duration-200 transform hover:scale-110"
                title="Decline Call"
              >
                <PhoneOff size={28} />
              </button>

              <button
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-xl text-white transition-all duration-200 transform hover:scale-110"
                title="Accept Call"
              >
                <Phone size={28} />
              </button>
            </div>
          </div>
        </div>
      )}
      {showCallHistory && (
        <CallHistory
          userId={patientId}
          userModel="Patient"
          onClose={() => setShowCallHistory(false)}
        />
      )}

      {/* Professional Feedback Modal */}
      {showFeedback && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl p-8 w-[480px] max-w-[95vw] shadow-2xl border border-gray-200 relative">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Consultation Feedback
              </h3>
              <p className="text-gray-600">
                Please rate your experience with Dr. {selectedDoctor.name}
              </p>
              {callDuration !== "00:00" && (
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Duration: <span className="font-medium text-gray-800">{callDuration}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setShowFeedback(false);
                setFeedbackRating(0);
                setFeedbackComment("");
              }}
              className="absolute top-4 right-4 w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors"
              disabled={isSubmittingFeedback}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Star Rating */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Overall Rating
              </label>
              <div className="flex justify-center gap-3 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      star <= feedbackRating
                        ? "bg-blue-50 border-blue-300 text-blue-600"
                        : "bg-white border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-400"
                    }`}
                    title={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <span className="text-2xl">★</span>
                  </button>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {feedbackRating === 0 && "Please select a rating"}
                  {feedbackRating === 1 && "Poor"}
                  {feedbackRating === 2 && "Below Average"}
                  {feedbackRating === 3 && "Average"}
                  {feedbackRating === 4 && "Good"}
                  {feedbackRating === 5 && "Excellent"}
                </p>
              </div>
            </div>

            {/* Comment Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Comments (Optional)
              </label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your thoughts about the consultation..."
                className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors text-gray-700 placeholder-gray-400"
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Help us improve our service
                </p>
                <p className="text-xs text-gray-400">
                  {feedbackComment.length}/500
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setFeedbackRating(0);
                  setFeedbackComment("");
                }}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isSubmittingFeedback}
              >
                Skip
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedbackRating || isSubmittingFeedback}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isSubmittingFeedback ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
