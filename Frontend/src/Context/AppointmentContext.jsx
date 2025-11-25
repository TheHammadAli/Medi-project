import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AppointmentContext = createContext();

const BASE_URL = "http://localhost:8000/api/appointments";

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Book Appointment
  const bookAppointment = async (formData) => {
    try {
      setLoading(true);
      console.log("📡 Making axios request to:", `${BASE_URL}/book`);
      console.log("📦 Axios request data:", formData);

      const res = await axios.post(`${BASE_URL}/book`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Appointment booking response:", res.data);
      setAppointments((prev) => [...prev, res.data.data]); // Adjust based on backend response
      return { success: true, data: res.data };
    } catch (err) {
      console.error("❌ Booking failed:", err.response?.data || err.message);
      console.error("❌ Full error object:", err);
      setError(err.response?.data?.message || "Booking failed");
      return { success: false, message: err.response?.data?.message || "Booking failed" };
    } finally {
      setLoading(false);
    }
  };

  // Get Appointments for a Doctor
  const getDoctorAppointments = useCallback(async (doctorId) => {
    try {
      setLoading(true);
      console.log("Fetching for doctor:", doctorId);
      const res = await axios.get(`${BASE_URL}/doctor/${doctorId}`);
      console.log("Appointments response:", res.data);
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch:", err);
      setError(err.response?.data?.message || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  // Get Booked Slots
  const getBookedSlots = async (doctorId, appointmentDate) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/booked/${doctorId}${appointmentDate ? `?date=${appointmentDate}` : ""}`
      );
      return res.data.map((appt) => appt.appointmentTime);
    } catch (err) {
      console.error("❌ Error fetching booked slots:", err);
      return [];
    }
  };

  // Get Appointments for a Patient
   const getPatientAppointments = useCallback(async (patientId) => {
     try {
       setLoading(true);
       console.log("📡 Fetching appointments for patient:", patientId);
       console.log("📡 Token from localStorage:", localStorage.getItem('token'));

       // Validate patientId
       if (!patientId) {
         throw new Error("Patient ID is required");
       }

       console.log("📡 Making request to:", `${BASE_URL}/patient/${patientId}`);
       const res = await axios.get(`${BASE_URL}/patient/${patientId}`, {
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('token')}`,
           'Content-Type': 'application/json'
         }
       });

       console.log("✅ Patient appointments response:", res.data);

       // Handle both array response and object response with data property
       const appointmentsData = Array.isArray(res.data) ? res.data : res.data.data || [];
       setAppointments(appointmentsData);

       return { success: true, data: appointmentsData };
     } catch (err) {
       console.error("❌ Failed to fetch patient appointments:", err.response?.data || err.message);
       console.error("❌ Full error object:", err);

       // Handle specific error cases
       if (err.response?.status === 403) {
         setError("Access denied. You can only view your own appointments.");
       } else if (err.response?.status === 404) {
         setError("Patient not found or no appointments available.");
         setAppointments([]); // Clear appointments if patient not found
       } else {
         setError(err.response?.data?.message || "Failed to fetch appointments");
       }

       return {
         success: false,
         message: err.response?.data?.message || "Failed to fetch appointments",
         status: err.response?.status
       };
     } finally {
       setLoading(false);
     }
   }, []);

  // Cancel Appointment
  const cancelAppointment = async (appointmentId) => {
    try {
      const res = await axios.put(`${BASE_URL}/cancel/${appointmentId}`);
      setAppointments((prev) => prev.filter((appt) => appt._id !== appointmentId));
      return { success: true };
    } catch (err) {
      console.error("❌ Cancel error:", err);
      return { success: false };
    }
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading,
        error,
        bookAppointment,
        getDoctorAppointments,
        getBookedSlots,
        getPatientAppointments,
        cancelAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export default AppointmentContext;