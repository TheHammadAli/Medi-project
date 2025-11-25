import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// ✅ Create Context
const ProfileContext = createContext();

// ✅ Backend base URL (adjust as needed)
const BASE_URL = "http://localhost:8000/api/doctor-profile";

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // ✅ Fetch all doctor profiles from backend
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/all`);
      setProfiles(res.data);
    } catch (err) {
      console.error("Error fetching profiles:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Upload a new profile to backend
  const uploadProfile = async (formData) => {
    try {
      setLoading(true);
      setUploadError("");

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const res = await axios.post(`${BASE_URL}/add`, formData, config);
      setProfiles((prev) => [...prev, res.data.doctor]);
      return res.data;
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      setUploadError("Failed to upload profile.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get single profile by email
  const getProfileByEmail = async (email) => {
    try {
      const res = await axios.get(`${BASE_URL}/${email}`);
      return res.data;
    } catch (err) {
      console.error("Fetch single profile failed", err.message);
      return null;
    }
  };

  // ✅ Update profile
  const updateProfile = async (email, formData) => {
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const res = await axios.put(`${BASE_URL}/update/${email}`, formData, config);
      return res.data;
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      return null;
    }
  };

  // ✅ Auto-fetch on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        loading,
        uploadError,
        fetchProfiles,
        uploadProfile,
        getProfileByEmail,   
        updateProfile,       
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileContext;
