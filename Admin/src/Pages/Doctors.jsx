import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUserMd } from "@fortawesome/free-solid-svg-icons";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);

  // ✅ Fetch all doctors
  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/doctor-profile/all");
      setDoctors(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch doctors:", err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ✅ Open delete confirmation modal
  const handleDelete = (doctor) => {
    setDoctorToDelete(doctor);
    setShowModal(true);
  };

  // ✅ Confirm delete doctor
  const confirmDelete = async () => {
    if (!doctorToDelete) return;
    try {
      await axios.delete(`http://localhost:8000/api/doctor-profile/${doctorToDelete._id}`);
      toast.success("Doctor removed successfully!");
      setDoctors(doctors.filter((doc) => doc._id !== doctorToDelete._id));
      setShowModal(false);
      setDoctorToDelete(null);
    } catch (err) {
      toast.error("Failed to remove doctor");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen rounded-xl bg-gradient-to-br from-blue-20 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Doctors</h1>
                
                <p className="text-sm text-gray-500">View and manage all registered doctors on the platform</p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <FontAwesomeIcon icon={faUserMd} className="text-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              {/* Full-width image with no padding */}
              <div className="h-48 overflow-hidden">
                <img
                  src={doctor.imageUrl}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Padding only for content below image */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{doctor.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{doctor.speciality}</p>
                <button
                  onClick={() => handleDelete(doctor)}
                  className="w-full bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Remove Doctor
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && doctorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full mx-2 sm:mx-4 border border-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Remove Doctor?
              </h3>
              <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                Are you sure you want to remove <span className="font-semibold text-gray-800">{doctorToDelete.name}</span> from the platform? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Yes, Remove
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                >
                  Keep Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
