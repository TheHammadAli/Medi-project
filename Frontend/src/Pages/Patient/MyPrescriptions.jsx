import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../Context/AppContext";
import { toast } from "sonner";
import SlideInOnScroll from "../../Components/SlideInOnScroll";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFilePdf, faCalendarAlt, faUserMd, faPills, faClock } from "@fortawesome/free-solid-svg-icons";

const MyPrescriptions = () => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 Debug - useEffect triggered");
    console.log("🔍 Debug - User state:", user);
    console.log("🔍 Debug - User role:", user?.role);

    // Test basic API connectivity first
    testAPIConnection();

    // Check for user ID with multiple possible field names
    const userId = user?._id || user?.id;
    console.log("🔍 Debug - User ID:", userId);

    if (user && userId) {
      console.log("🔍 Debug - User has ID, fetching prescriptions");
      console.log("🔍 Debug - User role check:", user.role || 'no role specified');

      // Check if user is a patient (this endpoint requires patient role)
      if (user.role !== 'patient' && user.role !== undefined) {
        console.warn("⚠️ Warning - User role is not 'patient', current role:", user.role);
        toast.error("This page requires patient access. Please log in as a patient.");
        setLoading(false);
        return;
      }

      fetchPrescriptions();
    } else if (user && !userId) {
      console.log("🔍 Debug - User exists but no ID found:", user);
      toast.error("User ID not found. Please log in again.");
      setLoading(false);
    } else {
      console.log("🔍 Debug - No user found, waiting for user context to load");
      // Don't set loading to false here - wait for user context to load
    }
  }, [user]);

  // Check if user is logged in when component mounts and set up timeout
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔍 Debug - Component mount - Token exists:", !!token);
    console.log("🔍 Debug - Component mount - User state:", user);

    // Set a timeout to handle cases where user context fails to load
    const timeoutId = setTimeout(() => {
      if (!user) {
        console.log("🔍 Debug - User context loading timeout reached");
        toast.error("Session loading timeout. Please refresh the page.");
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [user]);

  // Test basic API connectivity
  const testAPIConnection = async () => {
    try {
      console.log("🔍 Testing basic API connectivity...");
      const response = await fetch("http://localhost:8000/api/prescriptions/", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("🔍 API Test - Status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("🔍 API Test - Response:", data);
      } else {
        console.error("🔍 API Test - Error response:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("🔍 API Test - Network error:", error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Enhanced Debug: Check token availability and format
      console.log("🔍 Debug - Token from localStorage:", token);
      console.log("🔍 Debug - Token length:", token ? token.length : 0);
      console.log("🔍 Debug - Token parts:", token ? token.split('.').length : 0);
      console.log("🔍 Debug - User from context:", user);
      console.log("🔍 Debug - User ID field:", user ? (user._id || user.id) : 'No user');

      if (!token) {
        console.error("❌ No token found in localStorage");
        toast.error("Please log in to view prescriptions");
        setLoading(false);
        return;
      }

      // Validate token format
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        console.error("❌ Invalid token format in localStorage");
        toast.error("Invalid session token. Please log in again.");
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }

      if (!user) {
        console.error("❌ No user found in context");
        toast.error("User session expired. Please log in again.");
        setLoading(false);
        return;
      }

      // Check for user ID with multiple possible field names
      const userId = user._id || user.id;
      if (!userId) {
        console.error("❌ No user ID found in user object:", user);
        toast.error("User ID not found. Please log in again.");
        setLoading(false);
        return;
      }


      const requestUrl = `${import.meta.env.VITE_API_URL}/prescriptions/list/${userId}`;
      const requestHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("🔍 Debug - Making request to:", requestUrl);
      console.log("🔍 Debug - Request headers:", requestHeaders);
      console.log("🔍 Debug - Authorization header starts with Bearer:", requestHeaders.Authorization.startsWith("Bearer "));

      const response = await fetch(requestUrl, {
        headers: requestHeaders,
      });

      console.log("🔍 Debug - Response status:", response.status);
      console.log("🔍 Debug - Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error("❌ API Error - Response not ok:", response.status, response.statusText);

        // Try to get error details from response
        let errorDetails = "Unknown error";
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
          console.error("❌ API Error Details:", errorData);
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError);
          errorDetails = await response.text();
        }

        if (response.status === 401) {
          console.error("❌ 401 Error - Authentication failed. Error details:", errorDetails);
          toast.error("Authentication failed. Please log in again.");
          return;
        } else if (response.status === 403) {
          console.error("❌ 403 Error - Access denied. Error details:", errorDetails);
          toast.error("Access denied. You don't have permission to view prescriptions.");
          return;
        } else if (response.status === 404) {
          console.error("❌ 404 Error - Not found. Error details:", errorDetails);
          toast.error("Prescription service not found. Please try again later.");
          return;
        } else {
          console.error("❌ Server error:", response.status, errorDetails);
          toast.error(`Server error (${response.status}). Please try again.`);
          return;
        }
      }

      const data = await response.json();
      console.log("🔍 Debug - Response data:", data);

      if (data.success) {
        setPrescriptions(data.data || []);
        console.log("✅ Prescriptions loaded successfully:", data.data?.length || 0);
      } else {
        console.error("❌ API Error:", data);
        toast.error(data.error?.message || "Failed to fetch prescriptions");
      }
    } catch (error) {
      console.error("❌ Error fetching prescriptions:", error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error("Error loading prescriptions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const downloadPrescriptionPDF = async (prescriptionId, prescriptionNumber) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to download prescriptions");
        return;
      }

      console.log("🔍 Downloading PDF for prescription:", prescriptionId);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/prescriptions/${prescriptionId}/pdf`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. You don't have permission to download this prescription.");
        } else if (response.status === 404) {
          toast.error("Prescription not found.");
        } else {
          toast.error(`Failed to download PDF (${response.status})`);
        }
        return;
      }

      // Get the PDF as a blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `prescription_${prescriptionNumber || prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("✅ PDF downloaded successfully");
      toast.success("Prescription PDF downloaded successfully");

    } catch (error) {
      console.error("❌ Error downloading PDF:", error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error("Error downloading prescription PDF. Please try again.");
      }
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <SlideInOnScroll direction="up">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6  bg-gradient-to-r from-blue-500 to-purple-600  bg-clip-text text-transparent">
                My Prescriptions
              </h1>
              <p className="text-lg sm:text-xl md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                Access and download all your prescriptions in one place
              </p>
            </SlideInOnScroll>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-green-50 via-emerald-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <SlideInOnScroll direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                  {prescriptions.length}
                </div>
                <div className="text-gray-600 font-medium text-xs sm:text-sm">Total Prescriptions</div>
              </div>
            </SlideInOnScroll>
            <SlideInOnScroll direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                  {prescriptions.filter(p => p.status === 'active').length}
                </div>
                <div className="text-gray-600 font-medium text-xs sm:text-sm">Active</div>
              </div>
            </SlideInOnScroll>
            <SlideInOnScroll direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                  {prescriptions.filter(p => p.pdfGenerated).length}
                </div>
                <div className="text-gray-600 font-medium text-xs sm:text-sm">PDF Available</div>
              </div>
            </SlideInOnScroll>
            <SlideInOnScroll direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">
                  {new Date().getMonth() + 1}
                </div>
                <div className="text-gray-600 font-medium text-xs sm:text-sm">This Month</div>
              </div>
            </SlideInOnScroll>
          </div>
        </div>
      </section>

      {/* Prescriptions Section */}
      <section className="py-12 sm:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {loading ? (
            <SlideInOnScroll direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mb-3 sm:mb-4"></div>
                  <p className="text-gray-600 font-medium text-sm sm:text-base">Loading your prescriptions...</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">Please wait a moment</p>
                </div>
              </div>
            </SlideInOnScroll>
          ) : !user || !user._id ? (
           /* Not Logged In State */
           <SlideInOnScroll direction="up">
             <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100">
               <div className="flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-100 to-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                   <FontAwesomeIcon icon={faUserMd} className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                 </div>
                 <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Login Required</h3>
                 <p className="text-gray-600 max-w-md leading-relaxed text-sm sm:text-base px-4 mb-6">
                   Please log in to view your prescriptions and access your medical records.
                 </p>
                 <button
                   onClick={() => navigate("/login")}
                   className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 shadow-lg"
                 >
                   Login to Continue
                 </button>
               </div>
             </div>
           </SlideInOnScroll>
          ) : prescriptions.length === 0 ? (
           /* Empty State */
           <SlideInOnScroll direction="up">
             <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100">
               <div className="flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                   <FontAwesomeIcon icon={faFilePdf} className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                 </div>
                 <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No prescriptions yet</h3>
                 <p className="text-gray-600 max-w-md leading-relaxed text-sm sm:text-base px-4">
                   You don't have any prescriptions yet. Once you consult with a doctor and get a prescription, it will appear here.
                 </p>
               </div>
             </div>
           </SlideInOnScroll>
          ) : (
            /* Prescriptions List */
            <div className="space-y-3 sm:space-y-4">
              {prescriptions.map((prescription, index) => (
                <SlideInOnScroll
                  key={prescription._id}
                  direction={index % 2 === 0 ? "left" : "right"}
                >
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
                    {/* Prescription Header */}
                    <div className="bg-gradient-to-r from-green-50 to-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                            prescription.status === 'active' ? "bg-green-500" : "bg-gray-500"
                          }`}></div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                              Prescription #{prescription.prescriptionNumber || prescription._id?.slice(-8)}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                              Dr. {prescription.doctor?.name || 'Unknown Doctor'}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                            prescription.status === 'active'
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {prescription.status || "Active"}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            PDF Available
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prescription Details */}
                    <div className="px-4 sm:px-6 py-4 sm:py-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        {/* Date */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {formatDate(prescription.createdAt)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">Date Issued</p>
                          </div>
                        </div>

                        {/* Doctor */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faUserMd} className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {prescription.doctor?.name || 'Unknown Doctor'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">Prescribed By</p>
                          </div>
                        </div>

                        {/* Medicines */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faPills} className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                              {prescription.medicines?.length || 0} medicine{(prescription.medicines?.length || 0) !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">Total Items</p>
                          </div>
                        </div>
                      </div>

                      {/* Medicine List Preview */}
                      {prescription.medicines && prescription.medicines.length > 0 && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                            <FontAwesomeIcon icon={faPills} className="w-4 h-4 text-green-600" />
                            Prescribed Medicines
                          </h4>
                          <div className="space-y-1 sm:space-y-2">
                            {prescription.medicines.slice(0, 3).map((medicine, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="font-medium text-gray-700">{medicine.name}</span>
                                <span className="text-gray-500">
                                  {medicine.dosage} - {medicine.duration}
                                </span>
                              </div>
                            ))}
                            {prescription.medicines.length > 3 && (
                              <p className="text-xs text-gray-500 italic">
                                +{prescription.medicines.length - 3} more medicines
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                        <button
                          onClick={() => navigate(`/prescription/${prescription._id}`)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 border border-blue-200"
                        >
                          <FontAwesomeIcon icon={faFilePdf} className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </button>
                        <button
                          onClick={() => downloadPrescriptionPDF(prescription._id, prescription.prescriptionNumber)}
                          className="bg-green-50 hover:bg-green-100 text-green-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 border border-green-200"
                        >
                          <FontAwesomeIcon icon={faDownload} className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Download PDF</span>
                          <span className="sm:hidden">Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </SlideInOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-24 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SlideInOnScroll direction="up">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                Need a New Prescription?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 sm:mb-8 leading-relaxed px-4">
                Consult with our qualified doctors to get the medical care and prescriptions you need.
              </p>
              <button
                onClick={() => navigate("/doctors")}
                className="inline-flex items-center gap-2 sm:gap-3 bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-green-50 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <FontAwesomeIcon icon={faUserMd} className="w-4 h-4 sm:w-5 sm:h-5" />
                Find a Doctor
              </button>
            </div>
          </SlideInOnScroll>
        </div>
      </section>
    </div>
  );
};

export default MyPrescriptions;
