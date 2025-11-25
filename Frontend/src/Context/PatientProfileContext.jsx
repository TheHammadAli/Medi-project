import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import AppContext from "./AppContext";

// Create Context
const PatientProfileContext = createContext();

// Backend URL using environment variable
const API_BASE_URL =  'http://localhost:8000/api';

export const PatientProfileProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patientProfile, setPatientProfile] = useState(null);
  const [medicalReports, setMedicalReports] = useState([]);
  const { user } = useContext(AppContext);

  // Helper function to get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
      return null;
    }

    // Basic token validation
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      // Check if token is expired
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Token expired');
        localStorage.removeItem('token');
        return null;
      }

      return token;
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      return null;
    }
  };

  // Auto-load patient profile when user logs in
  useEffect(() => {
    const loadProfile = async () => {
      const token = getAuthToken();
      if (user && token && !patientProfile) {
        try {
          console.log('PatientProfileContext: Auto-loading profile for user:', user.id);
          await getProfile();
        } catch (error) {
          console.error('PatientProfileContext: Failed to auto-load profile:', error);
        }
      } else if (!user) {
        // Clear profile when user logs out
        setPatientProfile(null);
        setMedicalReports([]);
      }
    };

    loadProfile();
  }, [user]); // Depend on user state changes

  // Also load profile on mount if user is already logged in and we have a token
  useEffect(() => {
    const token = getAuthToken();
    if (token && user && !patientProfile) {
      console.log('PatientProfileContext: Loading profile on mount for existing user');
      getProfile();
    }
  }, []); // Only run on mount

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Remove body from options if it exists and add it to the config
    if (options.body) {
      try {
        config.data = JSON.parse(options.body);
      } catch (error) {
        // If body is not JSON, use it as-is
        config.data = options.body;
      }
      delete config.body;
    }

    try {
      const response = await axios(`${API_BASE_URL}${url}`, config);
      return response.data;
    } catch (error) {
      console.error('API Request failed:', error.response?.data || error.message);
      throw error;
    }
  };

  // Helper function to make file upload requests
  const makeFileUploadRequest = async (url, formData, options = {}) => {
    const token = getAuthToken();

    const response = await axios.post(`${API_BASE_URL}${url}`, formData, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      timeout: 60000, // 60 seconds timeout for file uploads
    });

    return response.data;
  };

  // Get patient profile
  const getProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const profile = await makeAuthenticatedRequest('/patient-profile/');
      setPatientProfile(profile);
      return profile;
    } catch (err) {
      const errorMsg = err.message || "Failed to fetch profile";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get patient profile by patient ID (for doctors)
  const getPatientProfileById = async (patientId) => {
    setLoading(true);
    setError("");
    try {
      const profile = await makeAuthenticatedRequest(`/patient-profile/${patientId}`);
      return profile;
    } catch (err) {
      const errorMsg = err.message || "Failed to fetch patient profile";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Update patient profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError("");
    try {
      console.log('PatientProfileContext.jsx: Sending update profile request with data:', profileData);
      const updatedProfile = await makeAuthenticatedRequest('/patient-profile/', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      console.log('PatientProfileContext.jsx: Profile update successful, response:', updatedProfile);
      setPatientProfile(updatedProfile);
      console.log('PatientProfileContext.jsx: patientProfile state updated:', updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMsg = err.message || "Failed to update profile";
      setError(errorMsg);
      console.error('PatientProfileContext.jsx: Error updating profile:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Upload profile image
  const uploadProfileImage = async (imageFile) => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('profileImage', imageFile);

      const result = await makeFileUploadRequest('/patient-profile/upload-image', formData);
      return result;
    } catch (err) {
      const errorMsg = err.message || "Failed to upload profile image";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Upload medical report
  const uploadMedicalReport = async (reportFile) => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('report', reportFile);

      const result = await makeFileUploadRequest('/patient-profile/upload-report', formData);
      return result;
    } catch (err) {
      const errorMsg = err.message || "Failed to upload medical report";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get all medical reports
  const getMedicalReports = async () => {
    setLoading(true);
    setError("");
    try {
      const reports = await makeAuthenticatedRequest('/patient-profile/reports');
      setMedicalReports(reports);
      return reports;
    } catch (err) {
      const errorMsg = err.message || "Failed to fetch medical reports";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get specific medical report
  const getMedicalReport = async (reportId) => {
    setLoading(true);
    setError("");
    try {
      const report = await makeAuthenticatedRequest(`/patient-profile/reports/${reportId}`);
      return report;
    } catch (err) {
      const errorMsg = err.message || "Failed to fetch medical report";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete medical report
  const deleteMedicalReport = async (reportId) => {
    setLoading(true);
    setError("");
    try {
      await makeAuthenticatedRequest(`/patient-profile/reports/${reportId}`, {
        method: 'DELETE',
      });
      // Remove from local state
      setMedicalReports(prev => prev.filter(report => report._id !== reportId));
      return true;
    } catch (err) {
      const errorMsg = err.message || "Failed to delete medical report";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientProfileContext.Provider
      value={{
        loading,
        error,
        patientProfile,
        medicalReports,
        setPatientProfile,
        setMedicalReports,
        getProfile,
        getPatientProfileById,
        updateProfile,
        uploadProfileImage,
        uploadMedicalReport,
        getMedicalReports,
        getMedicalReport,
        deleteMedicalReport,
      }}
    >
      {children}
    </PatientProfileContext.Provider>
  );
};

export default PatientProfileContext;