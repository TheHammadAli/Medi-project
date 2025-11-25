import React, { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../Context/AppContext";
import InputField from "../../Components/InputField";
import TextAreaField from "../../Components/TextAreaField";
import SelectField from "../../Components/SelectField";
import PatientProfileContext from "../../Context/PatientProfileContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faPhone, faMapMarkerAlt, faCalendarAlt, faEdit, faSave, faTimes, faVenus, faMars, faWeight, faRulerVertical, faHeartbeat, faFileMedical, faUpload, faDownload, faEye, faTrash, faPills, faAllergies, faStethoscope } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import SlideInOnScroll from "../../Components/SlideInOnScroll";

const PatientProfile = () => {
  const { user, setUser } = useContext(AppContext);
  const {
    loading: profileLoading,
    error,
    patientProfile,
    getProfile,
    updateProfile,
    uploadProfileImage,
    uploadMedicalReport,
    getMedicalReports,
    deleteMedicalReport
  } = useContext(PatientProfileContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [medicalReports, setMedicalReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    bloodType: "",
    allergies: "",
    medicalConditions: "",
    currentMedications: "",
    height: "",
    weight: "",
    bloodPressure: ""
  });

  // Load profile data on component mount and when user changes
  useEffect(() => {
    const loadProfileData = async () => {
      if (user && !patientProfile) {
        console.log("PatientProfile.jsx: Loading profile data on mount");
        try {
          await getProfile();
        } catch (error) {
          console.error("PatientProfile.jsx: Error loading profile on mount:", error);
        }
      }
    };

    loadProfileData();
  }, [user]); // Only depend on user, not patientProfile to avoid infinite loops

  // Helper function to format date for HTML date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "";
      // Return date in YYYY-MM-DD format for HTML date input
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Initialize form data when profile data is available
  useEffect(() => {
    console.log("PatientProfile.jsx: Initial useEffect triggered by user or patientProfile change", { user, patientProfile });
    // Use patientProfile from PatientProfileContext if available, otherwise fall back to user from AppContext
    const profileData = patientProfile || user;

    if (profileData) {
      setFormData(prevFormData => {
        const newFormData = {
          fullName: profileData.firstName && profileData.lastName
            ? `${profileData.firstName} ${profileData.lastName}`
            : profileData.firstName || profileData.lastName || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          dateOfBirth: formatDateForInput(profileData.dateOfBirth),
          gender: profileData.gender || "",
          address: profileData.address || "",
          emergencyContact: profileData.emergencyContact || "",
          emergencyPhone: profileData.emergencyPhone || "",
          bloodType: profileData.bloodType || "",
          allergies: profileData.allergies || "",
          medicalConditions: profileData.medicalConditions || "",
          currentMedications: profileData.currentMedications || "",
          height: profileData.height || "",
          weight: profileData.weight || "",
          bloodPressure: profileData.bloodPressure || ""
        };
        console.log("PatientProfile.jsx: Initial formData set", newFormData);
        return newFormData;
      });

      // Set profile image if available
      if (profileData.profileImage) {
        setProfileImage(profileData.profileImage);
      }
    }
  }, [user, patientProfile]);

  // Additional effect to ensure form data is updated when PatientProfileContext data changes
  useEffect(() => {
    console.log("PatientProfile.jsx: useEffect triggered by patientProfile change", patientProfile);
    if (patientProfile) {
      setFormData(prevFormData => {
        const newFormData = {
          ...prevFormData,
          fullName: patientProfile.firstName && patientProfile.lastName
            ? `${patientProfile.firstName} ${patientProfile.lastName}`
            : patientProfile.firstName || patientProfile.lastName || prevFormData.fullName,
          email: patientProfile.email || prevFormData.email,
          phone: patientProfile.phone || prevFormData.phone,
          dateOfBirth: formatDateForInput(patientProfile.dateOfBirth) || prevFormData.dateOfBirth,
          gender: patientProfile.gender || prevFormData.gender,
          address: patientProfile.address || prevFormData.address,
          emergencyContact: patientProfile.emergencyContact || prevFormData.emergencyContact,
          emergencyPhone: patientProfile.emergencyPhone || prevFormData.emergencyPhone,
          bloodType: patientProfile.bloodType || prevFormData.bloodType,
          allergies: patientProfile.allergies || prevFormData.allergies,
          medicalConditions: patientProfile.medicalConditions || prevFormData.medicalConditions,
          currentMedications: patientProfile.currentMedications || prevFormData.currentMedications,
          height: patientProfile.height || prevFormData.height,
          weight: patientProfile.weight || prevFormData.weight,
          bloodPressure: patientProfile.bloodPressure || prevFormData.bloodPressure
        };
        console.log("PatientProfile.jsx: New formData after patientProfile update", newFormData);
        return newFormData;
      });

      // Update profile image if available in PatientProfileContext
      if (patientProfile.profileImage) {
        setProfileImage(patientProfile.profileImage);
      }
    }
  }, [patientProfile]);

  // Load medical reports when reports tab is selected
  useEffect(() => {
    if (activeTab === "reports" && user) {
      loadMedicalReports();
    }
  }, [activeTab, user]);

  // Load medical reports from API
  const loadMedicalReports = async () => {
    setReportsLoading(true);
    try {
      console.log('Loading medical reports...');
      const response = await getMedicalReports();
      console.log('Medical reports loaded:', response);
      setMedicalReports(response.reports || []);
    } catch (error) {
      console.error("Error loading medical reports:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error("Failed to load medical reports");
      }
      setMedicalReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Split fullName into firstName and lastName for backend
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const dataToSend = {
        ...formData,
        firstName,
        lastName
      };
      // Remove fullName from the data being sent to backend
      delete dataToSend.fullName;

      console.log('PatientProfile.jsx: Updating profile with data:', dataToSend);
      const response = await updateProfile(dataToSend);
      console.log('PatientProfile.jsx: Profile update response:', response);
      toast.success("Profile updated successfully!");

      // Update both contexts with the response data
      if (response) {
        // Update the user data in AppContext with the response data
        if (response.user) {
          setUser(prevUser => ({
            ...prevUser,
            ...response.user
          }));
          console.log('PatientProfile.jsx: AppContext user updated:', response.user);
        }

        // Update the PatientProfileContext with the updated profile data
        if (response.patientProfile) {
          // The PatientProfileContext already updates its own state in updateProfile function
          // But we can ensure consistency here if needed
          console.log('PatientProfile.jsx: PatientProfileContext patientProfile updated (via context function):', response.patientProfile);
        }
      }

      // Refresh the profile data from PatientProfileContext to ensure we have the latest data
      const refreshedProfile = await getProfile();
      console.log('PatientProfile.jsx: Profile data refreshed from getProfile:', refreshedProfile);

      setIsEditing(false);
    } catch (error) {
      console.error("PatientProfile.jsx: Error updating profile:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original profile data from PatientProfileContext or AppContext
    const profileData = patientProfile || user;

    if (profileData) {
      setFormData({
        fullName: profileData.firstName && profileData.lastName
          ? `${profileData.firstName} ${profileData.lastName}`
          : profileData.firstName || profileData.lastName || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        dateOfBirth: formatDateForInput(profileData.dateOfBirth),
        gender: profileData.gender || "",
        address: profileData.address || "",
        emergencyContact: profileData.emergencyContact || "",
        emergencyPhone: profileData.emergencyPhone || "",
        bloodType: profileData.bloodType || "",
        allergies: profileData.allergies || "",
        medicalConditions: profileData.medicalConditions || "",
        currentMedications: profileData.currentMedications || "",
        height: profileData.height || "",
        weight: profileData.weight || "",
        bloodPressure: profileData.bloodPressure || ""
      });

      // Reset profile image if available
      if (profileData.profileImage) {
        setProfileImage(profileData.profileImage);
      }
    }
    setIsEditing(false);
  };

  // Medical Reports Functions
  const validateFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload only PDF, image files, or Word documents.");
      return false;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB.");
      return false;
    }

    return true;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (files) => {
    const validFiles = Array.from(files).filter(validateFile);

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
       // Upload files one by one
       for (let i = 0; i < validFiles.length; i++) {
         const file = validFiles[i];
         await uploadMedicalReport(file);
       }

       // Reload medical reports after successful uploads
       await loadMedicalReports();
       toast.success(`${validFiles.length} medical report(s) uploaded successfully!`);
     } catch (error) {
       console.error("Error uploading medical reports:", error);
       toast.error("Failed to upload some medical reports. Please try again.");
     } finally {
       setUploading(false);
     }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const removeReport = async (reportId) => {
    try {
      await deleteMedicalReport(reportId);
      setMedicalReports(prev => prev.filter(report => report._id !== reportId));
      toast.success("Medical report removed successfully!");
    } catch (error) {
      console.error("Error removing medical report:", error);
      toast.error("Failed to remove medical report. Please try again.");
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file.");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
        return;
      }

      setImageUploading(true);

      try {
        const response = await uploadProfileImage(file);
        setProfileImage(response.imageUrl);

        // Update both contexts with the new profile image
         if (response.imageUrl) {
           // Update the user data in AppContext
           setUser(prevUser => ({
             ...prevUser,
             profileImage: response.imageUrl
           }));

           // Update the PatientProfileContext as well if it exists
           if (patientProfile) {
             // The PatientProfileContext should be updated via the API response
             // but we can ensure consistency here
           }
         }

        toast.success("Profile picture updated successfully!");
      } catch (error) {
        console.error("Error uploading profile image:", error);
        toast.error("Failed to upload profile image. Please try again.");
      } finally {
        setImageUploading(false);
      }
    }
  };

  const viewReport = async (report) => {
    if (report.url) {
      setActionLoading(prev => ({ ...prev, [`view-${report._id}`]: true }));
      try {
        window.open(report.url, '_blank');
        toast.success("Report opened in new tab");
      } catch (error) {
        console.error("Error opening report:", error);
        toast.error("Failed to open report. Please try again.");
      } finally {
        setActionLoading(prev => ({ ...prev, [`view-${report._id}`]: false }));
      }
    } else {
      toast.error("Report URL not available");
    }
  };

  const downloadReport = async (report) => {
    if (report.url) {
      setActionLoading(prev => ({ ...prev, [`download-${report._id}`]: true }));
      try {
        const link = document.createElement('a');
        link.href = report.url;
        link.download = report.name || 'medical-report';
        link.style.display = 'none';

        // Add timestamp to ensure unique downloads
        const timestamp = new Date().getTime();
        const fileExtension = report.name ? report.name.split('.').pop() : 'pdf';
        const baseName = report.name ? report.name.replace(`.${fileExtension}`, '') : 'medical-report';
        link.download = `${baseName}_${timestamp}.${fileExtension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Download started");
      } catch (error) {
        console.error("Error downloading report:", error);
        toast.error("Failed to download report. Please try again.");
      } finally {
        setActionLoading(prev => ({ ...prev, [`download-${report._id}`]: false }));
      }
    } else {
      toast.error("Report URL not available for download");
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8 border border-white/20 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full lg:w-auto">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-xl flex-shrink-0 overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="text-3xl sm:text-4xl" />
                  )}
                </div>

                {isEditing && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="profile-image-upload"
                      disabled={!isEditing}
                    />
                    <FontAwesomeIcon icon={faUser} className="text-white text-xl" />
                  </div>
                )}

                {imageUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h1 className="text-lg sm:text-xl font-bold text-gray-600 mb-1 truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.fullName
                    ? user.fullName
                    : user?.username || "User"}
                </h1>
                <p className="text-gray-600 flex items-center justify-center sm:justify-start gap-2 mb-2 text-sm sm:text-base">
                  <FontAwesomeIcon icon={faEnvelope} className="text-sm flex-shrink-0" />
                  <span className="truncate">{(patientProfile?.email || user.email)}</span>
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <span className="flex items-center justify-center sm:justify-start gap-1">
                    <FontAwesomeIcon icon={faPhone} className="text-sm flex-shrink-0" />
                    <span className="truncate">{(patientProfile?.phone || user.phone) || "Not provided"}</span>
                  </span>
                  <span className="flex items-center justify-center sm:justify-start gap-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sm flex-shrink-0" />
                    <span className="truncate">
                      {(patientProfile?.dateOfBirth || user.dateOfBirth)
                        ? new Date(patientProfile?.dateOfBirth || user.dateOfBirth).toLocaleDateString()
                        : "Not provided"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-initial"
                  >
                    <FontAwesomeIcon icon={faSave} />
                    <span className="hidden sm:inline">{loading ? "Saving..." : "Save Changes"}</span>
                    <span className="sm:hidden">{loading ? "Saving..." : "Save"}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base flex-1 sm:flex-initial"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    <span className="hidden sm:inline">Cancel</span>
                    <span className="sm:hidden">Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 w-full lg:w-auto text-sm sm:text-base"
                >
                  <FontAwesomeIcon icon={faEdit} />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 lg:mb-8 border border-white/20 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: faUser },
              { id: "personal", label: "Personal Info", icon: faUser },
              { id: "medical", label: "Medical Info", icon: faStethoscope },
              { id: "reports", label: "Medical Reports", icon: faFileMedical },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-0 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-white/20 backdrop-blur-sm">
          {activeTab === "overview" && (
            <SlideInOnScroll>
              <div className="space-y-6 lg:space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 text-center border border-blue-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FontAwesomeIcon icon={faHeartbeat} className="text-white text-base sm:text-lg" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">12</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Total Appointments</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-6 text-center border border-green-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FontAwesomeIcon icon={faStethoscope} className="text-white text-base sm:text-lg" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">8</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Consultations Completed</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 text-center border border-purple-100 sm:col-span-2 md:col-span-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FontAwesomeIcon icon={faUser} className="text-white text-base sm:text-lg" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Member</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Since {new Date().getFullYear()}</p>
                  </div>
                </div>

                {/* Quick Medical Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 sm:p-6 border border-amber-100">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faPills} className="text-amber-600" />
                      Current Medications
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {(patientProfile?.currentMedications || user?.currentMedications) || "No current medications listed"}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 sm:p-6 border border-red-100">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faAllergies} className="text-red-600" />
                      Allergies
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {(patientProfile?.allergies || user?.allergies) || "No known allergies"}
                    </p>
                  </div>
                </div>
              </div>
            </SlideInOnScroll>
          )}

          {activeTab === "personal" && (
            <SlideInOnScroll>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div>
                  <div className="space-y-4">
                    <InputField
                      label="Full Name"
                      name="fullName"
                      placeholder="Enter your full name"
                      icon={faUser}
                      required
                      disabled
                      value={formData.fullName}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      icon={faEnvelope}
                      required
                      disabled
                      value={formData.email}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                    <InputField
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      icon={faPhone}
                      value={formData.phone}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                    <InputField
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      icon={faCalendarAlt}
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                    <SelectField
                      label="Gender"
                      name="gender"
                      options={[
                        { value: "", label: "Select Gender" },
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "non-binary", label: "Non-Binary" },
                        { value: "genderfluid", label: "Genderfluid" },
                        { value: "agender", label: "Agender" },
                        { value: "transgender-male", label: "Transgender Male" },
                        { value: "transgender-female", label: "Transgender Female" },
                        { value: "two-spirit", label: "Two-Spirit" },
                        { value: "other", label: "Other" },
                        { value: "prefer-not-to-say", label: "Prefer not to say" }
                      ]}
                      value={formData.gender}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                    <TextAreaField
                      label="Address"
                      name="address"
                      placeholder="Enter your full address"
                      value={formData.address}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                  </div>
                </div>

                <div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Height"
                        name="height"
                        placeholder="cm"
                        icon={faRulerVertical}
                        value={formData.height}
                        onChange={handleInputChange}
                        isEditing={isEditing}
                      />
                      <InputField
                        label="Weight"
                        name="weight"
                        placeholder="kg"
                        icon={faWeight}
                        value={formData.weight}
                        onChange={handleInputChange}
                        isEditing={isEditing}
                      />
                    </div>
                    <InputField
                      label="Blood Pressure"
                      name="bloodPressure"
                      placeholder="e.g., 120/80"
                      icon={faHeartbeat}
                      value={formData.bloodPressure}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                    <SelectField
                      label="Blood Type"
                      name="bloodType"
                      options={[
                        { value: "", label: "Select Blood Type" },
                        { value: "A+", label: "A Positive (A+)" },
                        { value: "A-", label: "A Negative (A-)" },
                        { value: "B+", label: "B Positive (B+)" },
                        { value: "B-", label: "B Negative (B-)" },
                        { value: "AB+", label: "AB Positive (AB+)" },
                        { value: "AB-", label: "AB Negative (AB-)" },
                        { value: "O+", label: "O Positive (O+)" },
                        { value: "O-", label: "O Negative (O-)" },
                        { value: "unknown", label: "Unknown" },
                        { value: "not-tested", label: "Not Tested" }
                      ]}
                      value={formData.bloodType}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                  </div>
                </div>
              </div>
            </SlideInOnScroll>
          )}

          {activeTab === "medical" && (
            <SlideInOnScroll>
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-4">
                    <TextAreaField
                      label="Allergies"
                      name="allergies"
                      placeholder="List any known allergies (e.g., nuts, pollen, medications)"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                    <TextAreaField
                      label="Current Medications"
                      name="currentMedications"
                      placeholder="List current medications with dosages"
                      value={formData.currentMedications}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                  </div>
                  <div className="space-y-4">
                    <TextAreaField
                      label="Medical Conditions"
                      name="medicalConditions"
                      placeholder="List any chronic conditions or medical history"
                      value={formData.medicalConditions}
                      onChange={handleInputChange}
                      isEditing={isEditing}
                    />
                  </div>
                </div>
              </div>
            </SlideInOnScroll>
          )}

          {activeTab === "reports" && (
            <SlideInOnScroll>
              <div>

                {/* File Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 mb-6 lg:mb-8 ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="file-upload"
                  />
                  <div className="space-y-3 sm:space-y-4">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                      <FontAwesomeIcon icon={faUpload} className="text-white text-xl sm:text-2xl" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                        Upload Medical Reports
                      </p>
                      <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                        Drag and drop your files here, or click to browse
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Supported: PDF, JPG, PNG, GIF, DOC, DOCX (Max: 10MB each)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
                      <div>
                        <p className="font-semibold text-blue-800 text-sm sm:text-base">Uploading files...</p>
                        <p className="text-xs sm:text-sm text-blue-600">Please wait while we process your medical reports.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Uploaded Reports List */}
                {medicalReports.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Uploaded Reports ({medicalReports.length})
                    </h3>
                    <div className="grid gap-3 sm:gap-4">
                      {medicalReports.map((report) => (
                        <div key={report._id} className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-200">
                          <div className="flex flex-col gap-3 sm:gap-4">
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon
                                  icon={faFileMedical}
                                  className="text-white text-base sm:text-lg"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 text-base sm:text-lg truncate">{report.name}</p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {formatFileSize(report.fileSize)} • {new Date(report.uploadDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => viewReport(report)}
                                disabled={actionLoading[`view-${report._id}`]}
                                className="p-2 sm:p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                                title="View Report"
                              >
                                {actionLoading[`view-${report._id}`] ? (
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 mx-auto"></div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <FontAwesomeIcon icon={faEye} className="text-sm sm:text-lg" />
                                    <span className="text-xs sm:hidden">View</span>
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => downloadReport(report)}
                                disabled={actionLoading[`download-${report._id}`]}
                                className="p-2 sm:p-3 text-green-600 hover:bg-green-50 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                                title="Download Report"
                              >
                                {actionLoading[`download-${report._id}`] ? (
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-green-600 mx-auto"></div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <FontAwesomeIcon icon={faDownload} className="text-sm sm:text-lg" />
                                    <span className="text-xs sm:hidden">Download</span>
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => removeReport(report._id)}
                                className="p-2 sm:p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 flex-1 sm:flex-initial"
                                title="Remove Report"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <FontAwesomeIcon icon={faTrash} className="text-sm sm:text-lg" />
                                  <span className="text-xs sm:hidden">Delete</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {reportsLoading && (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 text-sm sm:text-base">Loading medical reports...</p>
                  </div>
                )}

                {/* Empty State */}
                {!reportsLoading && medicalReports.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                      <FontAwesomeIcon icon={faFileMedical} className="text-gray-400 text-xl sm:text-2xl" />
                    </div>
                    <p className="text-gray-600 mb-2 text-base sm:text-lg">No medical reports uploaded yet</p>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto px-4">
                      Upload your medical reports, test results, or doctor's notes to keep them organized in one place.
                    </p>
                  </div>
                )}
              </div>
            </SlideInOnScroll>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;