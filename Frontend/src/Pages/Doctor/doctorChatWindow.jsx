
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Phone, Video, Paperclip, Smile, Send, PhoneOff, Mic, MicOff, Monitor, Video as VideoIcon, History, ArrowLeft, FileText, User, Calendar, Pill, Stethoscope, ClipboardList, Plus, Trash2, Save, X, Search, AlertCircle, CheckCircle, Eye, Edit3, Clock, Activity } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { motion, AnimatePresence } from "framer-motion";
import socket from "../../Socket/socket";
import CallHistory from "../../Components/CallHistory";
import ringtone from "../../assets/simple-ringtone-25290.mp3";
import outgoingTone from "../../assets/outgoing.mp3";
import {
  getUserMediaWithConstraints,
  verifyAppliedConstraints,
  checkOpusSupport,
  monitorAudioQuality,
  cleanupAudioProcessor,
  debugAudioDevices
} from "../../Utils/audioUtils";
import PatientProfileContext from "../../Context/PatientProfileContext";

const DoctorChatWindow = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getProfile, getPatientProfileById } = useContext(PatientProfileContext);

  const locationPatientName = location.state?.patient?.username || "Patient";
  const patientImage = location.state?.patient?.profileImage;
  const [doctorId, setDoctorId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [fetchedPatientName, setFetchedPatientName] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);

  // Use fetched patient name if available, otherwise fall back to location state
  const patientName = fetchedPatientName || locationPatientName;
  const [patientStatus, setPatientStatus] = useState("offline");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState(null);
  const [incomingFrom, setIncomingFrom] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [showAudioCallModal, setShowAudioCallModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callError, setCallError] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null); // New state variable
  const [localStream, setLocalStream] = useState(null); // State for local stream
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [callDuration, setCallDuration] = useState("00:00");
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [preservePrescriptionModal, setPreservePrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    diagnosis: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showMedicineSuggestions, setShowMedicineSuggestions] = useState(false);
  const [selectedMedicineIndex, setSelectedMedicineIndex] = useState(null);
  const [commonMedicines] = useState([
    'Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Azithromycin',
    'Cetirizine', 'Loratadine', 'Omeprazole', 'Pantoprazole', 'Metformin',
    'Insulin', 'Vitamin D3', 'Calcium', 'Iron', 'Multivitamin',
    'Cough Syrup', 'Antacid', 'Pain Relief', 'Antibiotic', 'Antihistamine'
  ]);

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

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.play().catch(console.error);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0; // Ensure no audio feedback

      // Play with enhanced error handling
      const playLocalVideo = async (retryCount = 0) => {
        try {
          await localVideoRef.current.play();
          console.log("[DoctorChatWindow] Local video playing successfully");
        } catch (err) {
          console.error(`[DoctorChatWindow] Error playing local video (attempt ${retryCount + 1}):`, err);
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
    socket.on("connect", () => {
      console.log("[DoctorChatWindow] Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[DoctorChatWindow] Socket connection error:", err);
    });

    return () => {
      console.log("[DoctorChatWindow] Socket cleanup");
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setDoctorId(decoded.id);
        console.log("[DoctorChatWindow] Decoded doctorId:", decoded.id);
      } catch (err) {
        console.error("[DoctorChatWindow] Invalid token:", err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!doctorId) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/get-doctor/${doctorId}`);
        const data = await res.json();
        if (data.success) {
          setProfileId(data.doctor._id);
          console.log("[DoctorChatWindow] Set profileId:", data.doctor._id);
          fetchMessages(data.doctor._id);
        }
      } catch (err) {
        console.error("[DoctorChatWindow] Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [doctorId]);

  // Fetch patient profile to get patient name using context
  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!patientId) return;
      try {
        // Use context to fetch patient profile by ID
        const data = await getPatientProfileById(patientId);
        if (data.success && data.patient) {
          setPatientProfile(data.patient);
          // Update patient name from profile if not already available from location state
          if (!location.state?.patient?.username) {
            setFetchedPatientName(data.patient.username);
            console.log("[DoctorChatWindow] Fetched patient name from profile:", data.patient.username);
          }
        }
      } catch (err) {
        console.error("[DoctorChatWindow] Error fetching patient profile:", err);
      }
    };
    fetchPatientProfile();
  }, [patientId, location.state?.patient?.username, getPatientProfileById]);

  const fetchMessages = async (docId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/history/${docId}/${patientId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("[DoctorChatWindow] Error loading messages:", err);
    }
  };

  useEffect(() => {
    if (!profileId) return;

    const emitOnline = () => {
      console.log("[DoctorChatWindow] Emitting user-online for doctor:", profileId);
      socket.emit("user-online", { userId: profileId, role: "doctor" });
      console.log("[DoctorChatWindow] ✅ Sent user-online:", profileId);
    };

    socket.on("connect", emitOnline);
    if (socket.connected) emitOnline();

    socket.on("call-error", ({ message }) => {
      setCallError(message);
      setShowAudioCallModal(false);
      setShowVideoCallModal(false);
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
      setTimeout(() => setCallError(null), 5000);
    });

    socket.on("update-user-status", ({ userId, status }) => {
      console.log("[DoctorChatWindow] Received update-user-status:", userId, status, "patientId:", patientId);
      if (userId === patientId) {
        setPatientStatus(status);
        console.log("[DoctorChatWindow] Updated patientStatus to:", status);
      }
    });

    socket.on("receive-message", (msg) => {
      console.log("[DoctorChatWindow] Received message:", msg);
      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) {
          console.log("[DoctorChatWindow] Message already exists, skipping:", msg._id);
          return prev;
        }
        const newMessages = [...prev, msg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return newMessages;
      });
      // Auto-scroll disabled - keeping chat position where user is
    });

    socket.on("incoming-call", ({ fromUserId, offer, callType }) => {
      incomingRingRef.current.loop = true;
      incomingRingRef.current.play().catch(console.error);
      setIncomingCall(true);
      setIncomingCallType(callType);
      setIncomingFrom(fromUserId);
      setIncomingOffer(offer);
    });

    socket.on("call-cancelled", () => {
      console.log("[DoctorChatWindow] Call was cancelled by patient before acceptance/rejection");
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
      setIncomingCall(false);
      setIncomingCallType(null);
      setIncomingFrom(null);
      setIncomingOffer(null);
    });

    socket.on("call-declined", () => {
      console.log("[DoctorChatWindow] Call declined by patient");
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
      setShowAudioCallModal(false);
      setShowVideoCallModal(false);
    });


    socket.on("call-accepted", async ({ answer }) => {
      console.log("[DoctorChatWindow] Call accepted by patient, setting remote description");
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStartTime(Date.now());
        setCallStatus("Connected");
        console.log("[DoctorChatWindow] Call connected, callStartTime set:", Date.now());
        // Don't show feedback on connect - only show when call ends
      } catch (err) {
        console.error("[DoctorChatWindow] Error setting remote description for answer:", err);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("[DoctorChatWindow] Added ICE candidate");
      } catch (err) {
        console.error("[DoctorChatWindow] Error adding ICE candidate:", err);
      }
    });

    socket.on("call-ended", () => {
      console.log("[DoctorChatWindow] Call ended by patient");
      endCall();
    });

    socket.on("call-cancelled", () => {
      console.log("[DoctorChatWindow] Call was cancelled by patient");
      endCall();
    });

    return () => {
      socket.off("connect", emitOnline);
      socket.off("update-user-status");
      socket.off("receive-message");
      socket.off("incoming-call");
      socket.off("call-error");
      socket.off("call-declined");
      socket.off("call-cancelled");
      socket.off("call-accepted");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [profileId, patientId]);

  useEffect(() => {
    if (profileId && patientId && socket) {
      socket.emit("join-room", { doctorId: profileId, patientId });
      console.log("[DoctorChatWindow] Doctor joined room:", `${profileId}:${patientId}`);
    }
  }, [profileId, patientId]);

  // Close medicine suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMedicineSuggestions(false);
      setSelectedMedicineIndex(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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


  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const messagePayload = {
        doctorId: profileId,
        patientId,
        senderId: profileId,
        senderModel: "DocProfile",
        type: file.type.includes("pdf") ? "file" : "image",
        fileData: base64,
        fileName: file.name,
        timestamp: new Date(),
      };
      await sendMessage(messagePayload);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (payload) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        const savedMessage = data.messages[data.messages.length - 1]; // Get the latest message
        
        // Add to local state immediately for better UX
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === savedMessage._id);
          if (exists) return prev;
          const newMessages = [...prev, savedMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return newMessages;
        });
        
        // Emit to socket for real-time delivery to other party
        socket.emit("send-message", {
          ...savedMessage,
          doctorId: profileId,
          patientId: patientId,
        });
        setNewMessage("");
      }
    } catch (err) {
      console.error("[DoctorChatWindow] Error sending message:", err);
    }
    // Auto-scroll disabled - keeping chat position where user is
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const payload = {
      doctorId: profileId,
      patientId,
      senderId: profileId,
      senderModel: "DocProfile",
      text: newMessage,
      type: "text",
      timestamp: new Date(),
    };
    sendMessage(payload);
  };

  const handleAcceptCall = () => {
    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
    setIncomingCall(false);

    // Ensure microphone is enabled by default when accepting call
    setIsMuted(false);

    const startWebRTC = async () => {
      try {
        console.log('🎧 Initializing enhanced audio for incoming call...');

        // Check Opus codec support
        const opusSupport = checkOpusSupport();
        console.log('🎵 Opus codec support:', opusSupport);

        // Debug audio devices if needed
        if (process.env.NODE_ENV === 'development') {
          await debugAudioDevices();
        }

        const stream = await getUserMediaWithConstraints(incomingCallType, { forWebRTC: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
    
        // Verify applied constraints and monitor audio quality
        const constraintReport = await verifyAppliedConstraints(stream);
        console.log('🎛️ Constraint verification report:', constraintReport);
    
        const qualityMetrics = monitorAudioQuality(stream);
        console.log('📊 Audio quality metrics:', qualityMetrics);
    
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Prevent feedback
          localVideoRef.current.play().catch(console.error);
        }

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
          console.log("[DoctorChatWindow] Connection state changed:", pc.connectionState);
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
          console.log("[DoctorChatWindow] ICE connection state:", pc.iceConnectionState);
          if (pc.iceConnectionState === 'failed') {
            console.error("[DoctorChatWindow] ICE connection failed, trying to restart...");
            pc.restartIce();
          }
        };
        peerConnectionRef.current = pc;

        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit("ice-candidate", {
              toUserId: incomingFrom,
              candidate: event.candidate,
            });
          }
        };

        pc.ontrack = (event) => {
          console.log("[DoctorChatWindow] Remote stream received:", event.streams[0]);
          console.log("[DoctorChatWindow] Remote tracks:", event.streams[0].getTracks().map(t => t.kind));

          if (event.streams[0]) {
            const stream = event.streams[0];
            setRemoteStream(stream);

            // Handle video track
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              console.log("[DoctorChatWindow] Remote stream contains video track.");
            } else {
              console.warn("[DoctorChatWindow] Remote stream does NOT contain video track.");
            }

            // Handle audio track - improved audio handling
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
              console.log("[DoctorChatWindow] Remote audio track found:", {
                enabled: audioTrack.enabled,
                muted: audioTrack.muted,
                readyState: audioTrack.readyState,
                settings: audioTrack.getSettings ? audioTrack.getSettings() : 'N/A'
              });

              if (remoteAudioRef.current) {
                // Ensure audio element is properly configured
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.volume = 1.0;
                remoteAudioRef.current.muted = false;

                // Force enable audio track
                audioTrack.enabled = true;

                // Play with enhanced error handling and retry mechanism
                const playAudio = async (retryCount = 0) => {
                  try {
                    await remoteAudioRef.current.play();
                    console.log("[DoctorChatWindow] ✅ Remote audio playing successfully");
                  } catch (err) {
                    console.error(`[DoctorChatWindow] ❌ Error playing remote audio (attempt ${retryCount + 1}):`, err);
                    if (retryCount < 3) {
                      // Try again with exponential backoff
                      setTimeout(() => {
                        playAudio(retryCount + 1);
                      }, 1000 * Math.pow(2, retryCount));
                    } else {
                      console.error("[DoctorChatWindow] ❌ Failed to play audio after multiple attempts");
                      // Try to resume audio context if available
                      if (window.audioContext && window.audioContext.state === 'suspended') {
                        window.audioContext.resume();
                      }
                    }
                  }
                };

                playAudio();
                console.log("[DoctorChatWindow] Remote audio track attached to audio element");
              } else {
                console.error("[DoctorChatWindow] No remote audio element ref found!");
              }
            } else {
              console.warn("[DoctorChatWindow] No audio track in remote stream");
            }
          }
        };

        stream.getTracks().forEach((track) => {
          console.log("[DoctorChatWindow] Adding track to peer connection:", {
            kind: track.kind,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            settings: track.getSettings ? track.getSettings() : 'N/A'
          });
          pc.addTrack(track, stream);
          console.log("[DoctorChatWindow] ✅ Track added to peer connection:", track.kind);
        });

        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        setCallStartTime(Date.now());
        console.log("[DoctorChatWindow] Incoming call accepted, callStartTime set:", Date.now());
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: incomingCallType === "video",
        });
        await pc.setLocalDescription(answer);

        socket.emit("accept-call", {
          toUserId: incomingFrom,
          answer,
        });

        if (incomingCallType === "audio") {
          setShowAudioCallModal(true);
        } else if (incomingCallType === "video") {
          setShowVideoCallModal(true);
        }
      } catch (err) {
        console.error("[DoctorChatWindow] Error accepting call:", err);
        let errorMessage = "Failed to accept call.";

        if (err.name === "NotAllowedError") {
          errorMessage = "Permission denied: Please allow camera and microphone access in your browser settings and refresh the page.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera or microphone found. Please ensure devices are connected and working.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera or microphone is in use by another application. Please close other apps and try again.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "Camera or microphone doesn't support the required settings. Please check your device capabilities.";
        } else if (err.name === "SecurityError") {
          errorMessage = "Security error: Please ensure you're using HTTPS and have proper permissions.";
        } else if (err.name === "AbortError") {
          errorMessage = "Media access was aborted. Please try again.";
        }

        setCallError(errorMessage);
        endCall();
      }
    };

    startWebRTC();
  };

  const handleRejectCall = () => {
    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
    setIncomingCall(false);
    socket.emit("call-declined", { toUserId: incomingFrom });
    socket.emit("end-call", { toUserId: incomingFrom });
    endCall();
  };

  const endCall = () => {
    // First, ensure microphone and camera are turned off
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (track.kind === 'audio') {
          track.enabled = false; // Turn off microphone
          console.log("[DoctorChatWindow] Microphone turned off");
        } else if (track.kind === 'video') {
          track.enabled = false; // Turn off camera
          console.log("[DoctorChatWindow] Camera turned off");
        }
        track.stop(); // Stop the track
      });
      localStreamRef.current = null;
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
    setIsMuted(true); // Set to muted state
    setIsCameraOn(false); // Set to camera off state
    setIsScreenSharing(false);
    setRemoteStream(null); // Clear remote stream on call end
    setLocalStream(null); // Clear local stream on call end
    setCallStartTime(null);
    setElapsedTime(0);
    setCallStatus("Connecting...");

    // Stop all audio elements
    if (outgoingRingRef.current) {
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
    }
    if (incomingRingRef.current) {
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
    }

    console.log("[DoctorChatWindow] Call ended - microphone and camera turned off");
    console.log("[DoctorChatWindow] Prescription modal state preserved:", showPrescriptionModal);
  };

  const handleStartCall = async (type) => {
    if (!profileId || !patientId || !socket.connected) {
      console.error("[DoctorChatWindow] Cannot start call: Missing IDs or socket not connected", {
        profileId,
        patientId,
        socketConnected: socket.connected,
      });
      setCallError("Cannot start call: Connection issue");
      return;
    }

    // Wait briefly to ensure user-online has been processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`[DoctorChatWindow] Initiating ${type} call to patientId: ${patientId} from profileId: ${profileId}`);

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

    // Check audio setup before starting call
    console.log('🎧 Initializing enhanced audio for outgoing call...');
    const opusSupport = checkOpusSupport();
    console.log('🎵 Opus codec support:', opusSupport);

    if (process.env.NODE_ENV === 'development') {
      await debugAudioDevices();
    }

    outgoingRingRef.current.loop = true;
    outgoingRingRef.current.play().catch(console.error);

    try {
      // Run WebRTC setup asynchronously while modal is already visible
      setTimeout(async () => {
        try {
          const stream = await getUserMediaWithConstraints(type, { forWebRTC: true });
          localStreamRef.current = stream;
          setLocalStream(stream);

          // Verify applied constraints and monitor audio quality
          const constraintReport = await verifyAppliedConstraints(stream);
          console.log('🎛️ Constraint verification report:', constraintReport);

          const qualityMetrics = monitorAudioQuality(stream);
          console.log('📊 Audio quality metrics:', qualityMetrics);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.muted = true; // Prevent feedback
            localVideoRef.current.play().catch(console.error);
          }

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
            console.log("[DoctorChatWindow] Connection state changed:", pc.connectionState);
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
            console.log("[DoctorChatWindow] ICE connection state:", pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
              console.error("[DoctorChatWindow] ICE connection failed, trying to restart...");
              pc.restartIce();
            }
          };
          peerConnectionRef.current = pc;

          pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
              socket.emit("ice-candidate", {
                toUserId: patientId,
                candidate: event.candidate,
              });
            }
          };

          pc.ontrack = (event) => {
            console.log("[DoctorChatWindow] Remote stream received:", event.streams[0]);
            console.log("[DoctorChatWindow] Remote tracks:", event.streams[0].getTracks().map(t => t.kind));

            if (event.streams[0]) {
              const stream = event.streams[0];
              setRemoteStream(stream);

              // Handle video track
              const videoTrack = stream.getVideoTracks()[0];
              if (videoTrack) {
                console.log("[DoctorChatWindow] Remote stream contains video track.");
                // Force enable video track
                videoTrack.enabled = true;
              } else {
                console.warn("[DoctorChatWindow] Remote stream does NOT contain video track.");
              }

              // Handle audio track - improved audio handling for outgoing calls
              const audioTrack = stream.getAudioTracks()[0];
              if (audioTrack) {
                console.log("[DoctorChatWindow] Remote audio track found:", {
                  enabled: audioTrack.enabled,
                  muted: audioTrack.muted,
                  readyState: audioTrack.readyState,
                  settings: audioTrack.getSettings ? audioTrack.getSettings() : 'N/A'
                });

                if (remoteAudioRef.current) {
                  // Ensure audio element is properly configured
                  remoteAudioRef.current.srcObject = stream;
                  remoteAudioRef.current.volume = 1.0;
                  remoteAudioRef.current.muted = false;

                  // Play with enhanced error handling
                  const playPromise = remoteAudioRef.current.play();
                  if (playPromise !== undefined) {
                    playPromise.then(() => {
                      console.log("[DoctorChatWindow] ✅ Remote audio playing successfully");
                    }).catch((err) => {
                      console.error("[DoctorChatWindow] ❌ Error playing remote audio:", err);
                      // Try again after user interaction
                      setTimeout(() => {
                        remoteAudioRef.current?.play().catch(console.error);
                      }, 1000);
                    });
                  }
                  console.log("[DoctorChatWindow] Remote audio track attached to audio element");
                } else {
                  console.error("[DoctorChatWindow] No remote audio element ref found!");
                }
              } else {
                console.warn("[DoctorChatWindow] No audio track in remote stream");
              }
            }
          };

          stream.getTracks().forEach((track) => {
            console.log("[DoctorChatWindow] Adding track to peer connection:", {
              kind: track.kind,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              settings: track.getSettings ? track.getSettings() : 'N/A'
            });
            pc.addTrack(track, stream);
            console.log("[DoctorChatWindow] ✅ Track added to peer connection:", track.kind);
          });

          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: type === "video",
          });
          await pc.setLocalDescription(offer);

          socket.emit("call-user", {
            toUserId: patientId,
            fromUserId: profileId,
            callerModel: "DocProfile",
            receiverModel: "Patient",
            offer,
            callType: type,
          });

          // Update status to ringing once setup is complete
          setCallStatus("Ringing");

          // Set callStartTime when doctor initiates call
          setCallStartTime(Date.now());
          console.log("[DoctorChatWindow] Call initiated by doctor, callStartTime set:", Date.now());
        } catch (setupErr) {
          console.error("[DoctorChatWindow] Error in call setup:", setupErr);
          setCallError("Failed to start call.");
          if (type === "audio") {
            setShowAudioCallModal(false);
          } else {
            setShowVideoCallModal(false);
          }
        }
      }, 100); // Small delay to ensure modal is visible first

    } catch (err) {
      console.error("[DoctorChatWindow] Error starting call:", err);
      let errorMessage = "Failed to start call.";

      if (err.name === "NotAllowedError") {
        errorMessage = "Permission denied: Please allow camera and microphone access in your browser settings and refresh the page.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera or microphone found. Please ensure devices are connected and working.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera or microphone is in use by another application. Please close other apps and try again.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera or microphone doesn't support the required settings. Please check your device capabilities.";
      } else if (err.name === "SecurityError") {
        errorMessage = "Security error: Please ensure you're using HTTPS and have proper permissions.";
      } else if (err.name === "AbortError") {
        errorMessage = "Media access was aborted. Please try again.";
      }

      setCallError(errorMessage);
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
      setShowAudioCallModal(false);
      setShowVideoCallModal(false);
    }
  };

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const handlePrescriptionSubmit = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      alert("Authentication error. Please login again.");
      return;
    }

    const prescriptionPayload = {
      patientId: patientId,
      doctorId: profileId,
      medicines: prescriptionData.medicines,
      diagnosis: prescriptionData.diagnosis,
      notes: prescriptionData.notes,
      timestamp: new Date(),
      status: 'active' // Mark as active when generated
    };

    console.log("Generating prescription payload:", prescriptionPayload);

    const response = await fetch("http://localhost:8000/api/prescriptions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(prescriptionPayload)
    });

    const data = await response.json();
    console.log("Generate prescription response:", data);

    if (data.success) {
      console.log("Prescription generated successfully");
      alert("Prescription generated successfully!");
      setShowPrescriptionModal(false);
      setPreservePrescriptionModal(false);
      setPrescriptionData({
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        diagnosis: '',
        notes: ''
      });
    } else {
      console.error("Failed to generate prescription:", data);
      alert("Failed to generate prescription: " + (data.message || "Unknown error"));
    }
  } catch (error) {
    console.error("Error generating prescription:", error);
    alert("Error generating prescription: " + error.message);
  }
};

const addMedicine = () => {
  setPrescriptionData(prev => ({
    ...prev,
    medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  }));
};

const updateMedicine = (index, field, value) => {
  setPrescriptionData(prev => ({
    ...prev,
    medicines: prev.medicines.map((med, i) =>
      i === index ? { ...med, [field]: value } : med
    )
  }));
};

const removeMedicine = (index) => {
  setPrescriptionData(prev => ({
    ...prev,
    medicines: prev.medicines.filter((_, i) => i !== index)
  }));
};

const filteredMedicines = commonMedicines.filter(medicine =>
  medicine.toLowerCase().includes(medicineSearch.toLowerCase())
);

const handleMedicineSelect = (medicineName, index) => {
  updateMedicine(index, 'name', medicineName);
  setMedicineSearch('');
  setShowMedicineSuggestions(false);
  setSelectedMedicineIndex(null);
};

const validatePrescription = () => {
  const errors = [];
  if (!prescriptionData.diagnosis.trim()) errors.push('Diagnosis is required');
  prescriptionData.medicines.forEach((med, index) => {
    if (!med.name.trim()) errors.push(`Medicine ${index + 1}: Name is required`);
    if (!med.dosage.trim()) errors.push(`Medicine ${index + 1}: Dosage is required`);
    if (!med.frequency.trim()) errors.push(`Medicine ${index + 1}: Frequency is required`);
    if (!med.duration.trim()) errors.push(`Medicine ${index + 1}: Duration is required`);
    if (!med.instructions.trim()) errors.push(`Medicine ${index + 1}: Instructions are required`);
  });
  return errors;
};

const handleSavePrescription = async () => {
  setIsSaving(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      alert("Authentication error. Please login again.");
      return;
    }

    const prescriptionPayload = {
      patientId: patientId,
      doctorId: profileId,
      medicines: prescriptionData.medicines,
      diagnosis: prescriptionData.diagnosis, // Map to diagnosis field
      notes: prescriptionData.notes, // Map to notes field
      timestamp: new Date(),
      status: 'draft' // Mark as draft when saved
    };

    console.log("Saving prescription payload:", prescriptionPayload);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/prescriptions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(prescriptionPayload)
    });

    const data = await response.json();
    console.log("Save prescription response:", data);

    if (data.success) {
      console.log("Prescription saved as draft successfully");
      alert("Prescription saved as draft successfully!");
      setShowPrescriptionModal(false);
      setPreservePrescriptionModal(false);
      setPrescriptionData({
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        diagnosis: '',
        notes: ''
      });
    } else {
      console.error("Failed to save prescription:", data);
      alert("Failed to save prescription: " + (data.message || "Unknown error"));
    }
  } catch (error) {
    console.error("Error saving prescription:", error);
    alert("Error saving prescription: " + error.message);
  } finally {
    setIsSaving(false);
  }
};

const handleCancelPrescription = () => {
  // Show confirmation dialog
  const confirmCancel = window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.");

  if (confirmCancel) {
    setShowPrescriptionModal(false);
    setPreservePrescriptionModal(false);
    setPrescriptionData({
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      diagnosis: '',
      notes: ''
    });
    console.log("Prescription modal cancelled");
  }
};


return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50"
  >
    {/* Hidden audio element for remote audio playback */}
    <audio
      ref={remoteAudioRef}
      autoPlay
      playsInline
      muted={false}
      volume={1.0}
      style={{ display: 'none' }}
    />
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg rounded-t-lg"
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/20 rounded-full transition flex-shrink-0"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative flex-shrink-0">
            {patientImage ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md overflow-hidden border-2 border-white/30">
                <img
                  src={patientImage}
                  alt={patientName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md">
                {patientName?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${patientStatus === "online" ? "bg-green-400" : "bg-gray-400"}`}></div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold truncate">{patientName}</h2>
            <p className="text-xs sm:text-sm opacity-90 truncate">
              {patientStatus === "online" ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCallHistory(true)}
            className="bg-white/20 hover:bg-white/30 p-2 sm:p-3 rounded-full transition backdrop-blur-sm"
            title="Call History"
          >
            <History size={18} className="sm:w-5 sm:h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: patientStatus === "online" ? 1.1 : 1 }}
            whileTap={{ scale: patientStatus === "online" ? 0.95 : 1 }}
            onClick={() => patientStatus === "online" && handleStartCall("audio")}
            className={`p-2 sm:p-3 rounded-full transition backdrop-blur-sm ${
              patientStatus === "online"
                ? "bg-white/20 hover:bg-white/30"
                : "bg-gray-400/50 cursor-not-allowed"
            }`}
            title={patientStatus === "online" ? "Audio Call" : "Patient is offline"}
          >
            <Phone size={18} className="sm:w-5 sm:h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: patientStatus === "online" ? 1.1 : 1 }}
            whileTap={{ scale: patientStatus === "online" ? 0.95 : 1 }}
            onClick={() => patientStatus === "online" && handleStartCall("video")}
            className={`p-2 sm:p-3 rounded-full transition backdrop-blur-sm ${
              patientStatus === "online"
                ? "bg-white/20 hover:bg-white/30"
                : "bg-gray-400/50 cursor-not-allowed"
            }`}
            title={patientStatus === "online" ? "Video Call" : "Patient is offline"}
          >
            <Video size={18} className="sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gradient-to-b from-transparent via-blue-50/30 to-indigo-50/30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <AnimatePresence>
          {messages.map((msg, index) => {
            const isSender = msg.senderId === profileId && msg.senderModel === "DocProfile";
            const isPatientMessage = msg.senderId === patientId && msg.senderModel === "Patient";

            if (!isSender && !isPatientMessage) return null;

            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3 sm:mb-4`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-xs md:max-w-sm p-3 sm:p-4 rounded-2xl text-sm shadow-lg transition-all overflow-x-hidden ${
                    isSender
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                  }`}
                >
                  {msg.type === "image" ? (
                    <motion.img
                      src={msg.fileData}
                      alt="sent image"
                      className="rounded-lg max-w-full shadow-sm"
                      whileHover={{ scale: 1.05 }}
                    />
                  ) : msg.type === "file" ? (
                    <div className="flex items-center gap-2 sm:gap-3 bg-red-50 text-gray-800 p-2 sm:p-3 rounded-md shadow-sm">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                        📄
                      </div>
                      <div className="flex flex-col flex-grow overflow-hidden min-w-0">
                        <p className="font-semibold truncate text-sm sm:text-base">{msg.fileName}</p>
                        <span className="text-xs text-gray-500">PDF Document</span>
                      </div>
                      <a href={msg.fileData} download={msg.fileName} className="text-blue-500 hover:text-blue-700 flex-shrink-0 text-lg sm:text-xl" title="Download">
                        ⬇️
                      </a>
                    </div>
                  ) : (
                    <p className="break-words leading-relaxed whitespace-pre-line text-sm sm:text-base">{msg.text}</p>
                  )}
                  <div className={`text-[10px] mt-2 ${isSender ? "text-blue-100" : "text-gray-500"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="w-full p-2 sm:p-4 relative z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        {showEmojiPicker && (
          <div className="absolute bottom-16 sm:bottom-20 left-2 sm:left-4 z-30">
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
        <div className="flex items-center bg-gray-100 rounded-full shadow-md px-3 sm:px-4 py-2 sm:py-3">
          <input
            type="file"
            accept="image/*,.pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="text-gray-500 hover:text-blue-500 mr-1 sm:mr-2 md:mr-3 transition p-1"
            onClick={() => fileInputRef.current.click()}
            title="Attach file"
          >
            <Paperclip size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
          </button>
          <button
            className="text-gray-500 hover:text-yellow-500 mr-1 sm:mr-2 md:mr-3 transition p-1"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            title="Emoji"
          >
            <Smile size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
          </button>
          <input
            type="text"
            className="flex-grow bg-transparent focus:outline-none text-sm sm:text-base px-2 min-w-0"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full ml-1 sm:ml-2 shadow-md flex-shrink-0"
            disabled={!newMessage.trim()}
          >
            <Send size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
          </button>
        </div>
      </div>

      {callError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50"
        >
          <p>{callError}</p>
        </motion.div>
      )}

      {/* Audio Call Modal */}
      {showAudioCallModal && (
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
              {patientImage ? (
                <img
                  src={patientImage}
                  alt={patientName}
                  className="w-32 h-32 rounded-full object-cover shadow-2xl ring-4 ring-blue-400/30"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-5xl font-bold rounded-full flex items-center justify-center shadow-2xl">
                  {patientName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">ONLINE</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">{patientName}</h3>
            <p className="text-gray-500 mb-4 animate-pulse font-medium">Audio Call • {callStatus}</p>
            {callStatus === "Connected" && (
              <p className="text-gray-600 mb-4 font-mono text-lg">{callDuration}</p>
            )}

            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={() => {
                  const newMutedState = !isMuted;
                  setIsMuted(newMutedState);
                  const audioTrack = localStreamRef.current?.getAudioTracks()[0];
                  if (audioTrack) {
                    audioTrack.enabled = !newMutedState;
                  }
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110 ${
                  isMuted
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {isMuted ? <MicOff size={20} className="sm:w-6 sm:h-6" /> : <Mic size={20} className="sm:w-6 sm:h-6" />}
              </button>

              <button
                onClick={() => {
                  setShowPrescriptionModal(true);
                  setPreservePrescriptionModal(true);
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg text-white transition-all duration-200 transform hover:scale-110"
                title="Write Prescription"
              >
                <FileText size={20} className="sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={() => {
                  setShowAudioCallModal(false);
                  socket.emit("call-cancelled", { toUserId: patientId });
                  socket.emit("end-call", { toUserId: patientId });
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl text-white transition-all duration-200 transform hover:scale-110"
              >
                <PhoneOff size={24} className="sm:w-7 sm:h-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoCallModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        >
          <div className="relative w-full h-full">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" srcObject={remoteStream} />
            <div className={`absolute bottom-20 sm:bottom-24 right-3 sm:right-6 w-48 h-28 sm:w-56 sm:h-36 rounded-lg sm:rounded-xl overflow-hidden shadow-lg border-2 border-white`}>
              <video ref={localVideoRef} srcObject={localStream} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-1 left-2 bg-white/80 text-gray-900 text-xs px-2 py-0.5 rounded">
                You (Doctor)
              </div>
            </div>
            <div className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-4 bg-white/60 backdrop-blur-lg rounded-full shadow-lg px-3 sm:px-6 py-2 sm:py-3`}>
              <button
                onClick={() => {
                  const audioTrack = localStreamRef.current?.getAudioTracks()[0];
                  if (audioTrack) {
                    audioTrack.enabled = !isMuted;
                    setIsMuted(!isMuted);
                    peerConnectionRef.current?.getSenders().forEach(sender => {
                      if (sender.track === audioTrack) {
                        sender.track.enabled = audioTrack.enabled;
                      }
                    });
                  }
                }}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow transition ${
                  isMuted ? "bg-gray-500 text-white" : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff size={18} className="sm:w-6 sm:h-6" /> : <Mic size={18} className="sm:w-6 sm:h-6" />}
              </button>
              <button
                onClick={() => {
                  const videoTrack = localStreamRef.current?.getVideoTracks()[0];
                  if (videoTrack) {
                    videoTrack.enabled = !videoTrack.enabled;
                    setIsCameraOn(videoTrack.enabled);
                    peerConnectionRef.current?.getSenders().forEach(sender => {
                      if (sender.track === videoTrack) {
                        sender.track.enabled = videoTrack.enabled;
                      }
                    });
                  }
                }}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow transition ${
                  isCameraOn ? "bg-white text-gray-700 hover:bg-gray-200" : "bg-gray-500 text-white"
                }`}
                title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
              >
                <VideoIcon size={18} className={`sm:w-6 sm:h-6 ${isCameraOn ? "opacity-100" : "opacity-30"}`} />
              </button>
              <button
                onClick={async () => {
                  if (!isScreenSharing) {
                    try {
                      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                      screenStreamRef.current = screenStream;
                      setLocalStream(screenStream);
                      if (localVideoRef.current) {
                        localVideoRef.current.srcObject = screenStream;
                      }
                      setIsScreenSharing(true);
                      // Replace video track in peer connection
                      peerConnectionRef.current?.getSenders().forEach(sender => {
                        if (sender.track && sender.track.kind === 'video') {
                          sender.replaceTrack(screenStream.getVideoTracks()[0]);
                        }
                      });
                    } catch (err) {
                      console.error("Screen share error:", err);
                    }
                  } else {
                    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
                    setIsScreenSharing(false);
                    // Revert to camera stream
                    const camStream = await getUserMediaWithConstraints('video', { forWebRTC: true });
                    localStreamRef.current = camStream; // Update localStreamRef
                    setLocalStream(camStream);
                    if (localVideoRef.current) {
                      localVideoRef.current.srcObject = camStream;
                      localVideoRef.current.play().catch(console.error);
                    }
                    // Replace video track in peer connection
                    peerConnectionRef.current?.getSenders().forEach(sender => {
                      if (sender.track && sender.track.kind === 'video') {
                        sender.replaceTrack(camStream.getVideoTracks()[0]);
                      }
                    });
                  }
                }}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow transition ${
                  isScreenSharing ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
                title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
              >
                <Monitor size={18} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => {
                  setShowPrescriptionModal(true);
                  setPreservePrescriptionModal(true);
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700 hover:bg-gray-400 flex items-center justify-center shadow text-white transition"
                title="Write Prescription"
              >
                <FileText size={18} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => {
                  socket.emit("call-cancelled", { toUserId: patientId });
                  socket.emit("end-call", { toUserId: patientId });
                  endCall();
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center transition"
                title="End Call"
              >
                <PhoneOff size={20} className="sm:w-7 sm:h-7" />
              </button>
            </div>
          </div>
        </motion.div>
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
              {patientImage ? (
                <img
                  src={patientImage}
                  alt={patientName}
                  className="w-32 h-32 rounded-full object-cover shadow-2xl ring-4 ring-blue-400/30"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-5xl font-bold rounded-full flex items-center justify-center shadow-2xl">
                  {patientName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">ONLINE</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">Incoming Call</h3>
            <p className="text-lg text-gray-600 mb-1">{patientName}</p>
            <p className="text-gray-500 mb-6 animate-pulse font-medium">{incomingCallType === "audio" ? "Audio Call" : "Video Call"} • Ringing...</p>

            <div className="flex items-center justify-center gap-8">
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl text-white transition-all duration-200 transform hover:scale-110"
                title="Decline Call"
              >
                <PhoneOff size={28} />
              </button>

              <button
                onClick={handleAcceptCall}
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
          userId={profileId}
          userModel="DocProfile"
          onClose={() => setShowCallHistory(false)}
        />
      )}

      {(showPrescriptionModal || preservePrescriptionModal) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col"
          >
            {/* Professional Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 sm:px-8 py-4 sm:py-6 text-white relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-800/90 backdrop-blur-sm"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <FileText size={20} className="text-white sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-1">Digital Prescription</h2>
                    <p className="text-blue-100 text-sm sm:text-base">Professional medical prescription system</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setPreservePrescriptionModal(false);
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/30"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)]">
              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
                  {/* Patient Information - Professional Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                        <User size={16} className="text-white sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Patient Information</h3>
                        <p className="text-gray-600 text-xs sm:text-sm">Consultation details and patient data</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200">
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Patient Name</label>
                        <p className="text-gray-900 font-bold text-base sm:text-lg">{patientName}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200">
                        <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Consultation Date</label>
                        <p className="text-gray-900 font-bold text-sm sm:text-lg flex items-center gap-2">
                          <Calendar size={14} className="text-green-600 sm:w-[18px] sm:h-[18px]" />
                          {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-purple-200 sm:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Patient ID</label>
                        <p className="text-gray-900 font-mono text-xs sm:text-sm bg-white p-2 sm:p-3 rounded-lg border">#{patientId?.slice(-8) || 'N/A'}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Diagnosis Section - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                        <Stethoscope size={16} className="text-white sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Clinical Assessment</h3>
                        <p className="text-gray-600 text-xs sm:text-sm">Diagnosis and clinical findings</p>
                      </div>
                    </div>
                    <textarea
                      value={prescriptionData.diagnosis}
                      onChange={(e) => setPrescriptionData(prev => ({ ...prev, diagnosis: e.target.value }))}
                      className="w-full p-3 sm:p-5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none text-gray-700 placeholder-gray-400"
                      rows={3}
                      placeholder="Enter comprehensive clinical diagnosis, symptoms, observations, and assessment findings..."
                    />
                  </motion.div>

                  {/* Enhanced Medicines Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                          <Pill size={16} className="text-white sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Medication Management</h3>
                          <p className="text-gray-600 text-xs sm:text-sm">Prescribed medications and treatment plan</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addMedicine}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 self-start sm:self-auto"
                      >
                        <Plus size={14} className="sm:w-4 sm:h-4" />
                        Add Medication
                      </button>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      {prescriptionData.medicines.map((medicine, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-gray-200 relative group hover:border-blue-300 transition-all duration-300"
                        >
                          <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg text-sm">
                            {index + 1}
                          </div>

                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            {prescriptionData.medicines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMedicine(index)}
                                className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300"
                              >
                                <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 mt-4">
                            {/* Medicine Name with Search */}
                            <div className="sm:col-span-2 lg:col-span-4">
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                Medicine Name *
                                <span className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">!</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={medicine.name}
                                  onChange={(e) => {
                                    updateMedicine(index, 'name', e.target.value);
                                    setMedicineSearch(e.target.value);
                                    setShowMedicineSuggestions(true);
                                    setSelectedMedicineIndex(index);
                                  }}
                                  onFocus={() => {
                                    setShowMedicineSuggestions(true);
                                    setSelectedMedicineIndex(index);
                                  }}
                                  className="w-full p-2 sm:p-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white pr-8 sm:pr-10 text-sm"
                                  placeholder="Search medicine..."
                                />
                                <Search size={14} className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 sm:w-4 sm:h-4" />

                                {showMedicineSuggestions && selectedMedicineIndex === index && medicineSearch && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-lg z-10 mt-1 max-h-40 sm:max-h-48 overflow-y-auto"
                                  >
                                    {filteredMedicines.slice(0, 6).map((med, medIndex) => (
                                      <button
                                        key={medIndex}
                                        onClick={() => handleMedicineSelect(med, index)}
                                        className="w-full text-left p-2 sm:p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200 text-sm"
                                      >
                                        {med}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </div>
                            </div>

                            {/* Dosage */}
                            <div className="lg:col-span-2">
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Dosage *</label>
                              <input
                                type="text"
                                value={medicine.dosage}
                                onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                                className="w-full p-2 sm:p-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-sm"
                                placeholder="e.g., 500mg, 10ml, 1 tablet"
                              />
                            </div>

                            {/* Frequency */}
                            <div className="lg:col-span-3">
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Frequency *</label>
                              <select
                                value={medicine.frequency || ''}
                                onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                                className="w-full p-2 sm:p-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-sm"
                              >
                                <option value="">Select frequency</option>
                                <option value="Once daily">Once daily</option>
                                <option value="Twice daily">Twice daily</option>
                                <option value="Three times daily">Three times daily</option>
                                <option value="Four times daily">Four times daily</option>
                                <option value="As needed">As needed (PRN)</option>
                                <option value="Before meals">Before meals</option>
                                <option value="After meals">After meals</option>
                                <option value="At bedtime">At bedtime</option>
                                <option value="As directed">As directed</option>
                              </select>
                            </div>

                            {/* Duration */}
                            <div className="lg:col-span-2">
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Duration *</label>
                              <input
                                type="text"
                                value={medicine.duration}
                                onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                                className="w-full p-2 sm:p-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-sm"
                                placeholder="e.g., 7 days, 2 weeks"
                              />
                            </div>

                            {/* Instructions - Full Width */}
                            <div className="sm:col-span-2 lg:col-span-12">
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Special Instructions *</label>
                              <input
                                type="text"
                                value={medicine.instructions}
                                onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                                className="w-full p-2 sm:p-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-sm"
                                placeholder="e.g., Take with food, Avoid alcohol, Complete full course"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Enhanced Notes Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                        <ClipboardList size={16} className="text-white sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Additional Instructions</h3>
                        <p className="text-gray-600 text-xs sm:text-sm">Follow-up care and special instructions</p>
                      </div>
                    </div>
                    <textarea
                      value={prescriptionData.notes}
                      onChange={(e) => setPrescriptionData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-3 sm:p-5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none text-gray-700 placeholder-gray-400"
                      rows={3}
                      placeholder="Additional instructions, precautions, follow-up recommendations, lifestyle modifications..."
                    />
                  </motion.div>
                </div>
              </div>

              {/* Preview Sidebar */}
              <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 sm:p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="lg:sticky lg:top-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Eye size={16} className="text-blue-500 sm:w-5 sm:h-5" />
                    Prescription Preview
                  </h3>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200">
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <Activity size={20} className="text-white sm:w-6 sm:h-6" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Medical Prescription</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div>
                        <p className="font-semibold text-gray-700">Patient:</p>
                        <p className="text-gray-900">{patientName}</p>
                      </div>

                      {prescriptionData.diagnosis && (
                        <div>
                          <p className="font-semibold text-gray-700">Diagnosis:</p>
                          <p className="text-gray-900 line-clamp-2">{prescriptionData.diagnosis}</p>
                        </div>
                      )}

                      {prescriptionData.medicines.some(med => med.name) && (
                        <div>
                          <p className="font-semibold text-gray-700">Medications:</p>
                          <div className="space-y-1">
                            {prescriptionData.medicines.filter(med => med.name).map((med, idx) => (
                              <p key={idx} className="text-gray-900 text-xs">
                                • {med.name} - {med.dosage}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div className="mt-3 sm:mt-4">
                    {(() => {
                      const errors = validatePrescription();
                      return (
                        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="flex items-center gap-2">
                            {errors.length === 0 ? (
                              <CheckCircle size={14} className="text-green-600 sm:w-4 sm:h-4" />
                            ) : (
                              <AlertCircle size={14} className="text-red-600 sm:w-4 sm:h-4" />
                            )}
                            <span className={`text-xs sm:text-sm font-semibold ${errors.length === 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {errors.length === 0 ? 'Ready to Generate' : `${errors.length} Issues Found`}
                            </span>
                          </div>
                          {errors.length > 0 && (
                            <div className="mt-2 text-xs text-red-600">
                              {errors.slice(0, 3).map((error, idx) => (
                                <p key={idx}>• {error}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                    <button
                      onClick={async () => {
                        const errors = validatePrescription();
                        if (errors.length === 0) {
                          setIsGenerating(true);
                          try {
                            const token = localStorage.getItem("token");
                            if (!token) {
                              alert("Authentication error. Please login again.");
                              return;
                            }

                            // First save the prescription
                            const prescriptionPayload = {
                              patientId: patientId,
                              doctorId: profileId,
                              medicines: prescriptionData.medicines,
                              diagnosis: prescriptionData.diagnosis,
                              notes: prescriptionData.notes,
                              timestamp: new Date(),
                              status: 'active'
                            };

                            const response = await fetch(`${import.meta.env.VITE_API_URL}/prescriptions/`, {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                              },
                              body: JSON.stringify(prescriptionPayload)
                            });

                            const data = await response.json();

                            if (data.success) {
                              // Generate and download PDF
                              const pdfResponse = await fetch(`${import.meta.env.VITE_API_URL}/prescriptions/${data.data._id}/pdf`, {
                                method: "GET",
                                headers: {
                                  "Authorization": `Bearer ${token}`
                                }
                              });

                              if (pdfResponse.ok) {
                                const blob = await pdfResponse.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                a.download = `prescription_${data.data.prescriptionNumber}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);

                                alert("Prescription generated and downloaded successfully!");
                                setShowPrescriptionModal(false);
                                setPreservePrescriptionModal(false);
                                setPrescriptionData({
                                  medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                                  diagnosis: '',
                                  notes: ''
                                });
                              } else {
                                throw new Error('Failed to generate PDF');
                              }
                            } else {
                              throw new Error(data.message || 'Failed to generate prescription');
                            }
                          } catch (error) {
                            console.error("Error generating prescription:", error);
                            alert("Error generating prescription: " + error.message);
                          } finally {
                            setIsGenerating(false);
                          }
                        } else {
                          alert('Please fix the following errors before generating:\n' + errors.join('\n'));
                        }
                      }}
                      disabled={isSaving || isGenerating}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <FileText size={14} className="sm:w-4 sm:h-4" />
                          Generate & Download PDF
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        const errors = validatePrescription();
                        if (errors.length === 0) {
                          handleSavePrescription();
                        } else {
                          alert('Please fix the following errors before saving:\n' + errors.join('\n'));
                        }
                      }}
                      disabled={isSaving || isGenerating}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} className="sm:w-4 sm:h-4" />
                          Save Prescription
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCancelPrescription}
                      disabled={isSaving || isGenerating}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    >
                      <X size={14} className="sm:w-4 sm:h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="bg-gray-50 px-4 sm:px-8 py-3 sm:py-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Professional prescription system - All fields marked with * are required
                  </p>
                </div>
                <div className="flex gap-2 sm:gap-4">
                  <button
                    onClick={handleCancelPrescription}
                    disabled={isSaving || isGenerating}
                    className="px-4 sm:px-8 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <X size={14} className="sm:w-4 sm:h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const errors = validatePrescription();
                      if (errors.length === 0) {
                        handleSavePrescription();
                      } else {
                        alert('Please fix the following errors before saving:\n' + errors.join('\n'));
                      }
                    }}
                    disabled={isSaving || isGenerating}
                    className="px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} className="sm:w-4 sm:h-4" />
                        Save Prescription
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const errors = validatePrescription();
                      if (errors.length === 0) {
                        setIsGenerating(true);
                        handlePrescriptionSubmit();
                        setIsGenerating(false);
                      } else {
                        alert('Please fix the following errors:\n' + errors.join('\n'));
                      }
                    }}
                    disabled={isSaving || isGenerating}
                    className="px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText size={14} className="sm:w-4 sm:h-4" />
                        Generate Prescription
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  );
};

export default DoctorChatWindow;

