import axios from "axios";

const API_URL = "http://localhost:8000/api/chat";

// Fetch chat history between doctor and patient
export const fetchChatHistory = async (doctorId, patientId) => {
  try {
    const response = await axios.get(
      `${API_URL}/history/${doctorId}/${patientId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (messageData) => {
  try {
    const response = await axios.post(`${API_URL}/send`, messageData);
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Doctor's chat list
export const fetchDoctorMessages = async (doctorId) => {
  try {
    const res = await axios.get(`${API_URL}/doctor-chats/${doctorId}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching doctor messages:", error);
    throw error;
  }
};

// Patient's chat list ← NEW
export const fetchPatientMessages = async (patientId) => {
  try {
    const res = await axios.get(`${API_URL}/patient-chats/${patientId}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching patient messages:", error);
    throw error;
  }
};
