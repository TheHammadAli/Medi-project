import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faUserMd, faEnvelope, faBullhorn, faComments, faFileAlt } from "@fortawesome/free-solid-svg-icons";

const AdminPanal = () => {
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setIsLoading(true);
      try {
        const [patientsRes, doctorsRes, subsRes, blogsRes, feedbacksRes, announcementsRes] = await Promise.all([
          axios.get("http://localhost:8000/api/auth/patients/count"),
          axios.get("http://localhost:8000/api/doctors/count"),
          axios.get("http://localhost:8000/api/newsletter/subscribers/count"),
          axios.get("http://localhost:8000/api/blogs/"),
          axios.get("http://localhost:8000/api/feedback/all"),
          axios.get("http://localhost:8000/api/announcement/all"),
        ]);

        setTotalPatients(patientsRes.data.count || 0);
        setTotalDoctors(doctorsRes.data.count || 0);
        setTotalSubscribers(subsRes.data.count || 0);
        setTotalBlogs(blogsRes.data.length || 0);
        setTotalFeedbacks(feedbacksRes.data.length || 0);
        setTotalAnnouncements(announcementsRes.data.length || 0);
      } catch (err) {
        console.error("❌ Error fetching counts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="min-h-screen rounded-xl bg-gradient-to-br from-blue-20 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-lg text-gray-600 mb-1">Welcome back, <span className="font-semibold text-indigo-600">Admin</span></p>
                <p className="text-sm text-gray-500">Monitor key metrics and platform overview</p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <FontAwesomeIcon icon={faUsers} className="text-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Patients Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Total Patients</h3>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-blue-600">{totalPatients}</p>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faUsers} className="text-2xl text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Registered patients on the platform</p>
          </div>

          {/* Doctors Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Total Doctors</h3>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-green-600">{totalDoctors}</p>
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faUserMd} className="text-2xl text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Verified doctors available</p>
          </div>

          {/* Subscribers Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Newsletter Subscribers</h3>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-purple-600">{totalSubscribers}</p>
                )}
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faEnvelope} className="text-2xl text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Users subscribed to updates</p>
          </div>

          {/* Blogs Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Total Blogs</h3>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-indigo-600">{totalBlogs}</p>
                )}
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faFileAlt} className="text-2xl text-indigo-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Published blog posts</p>
          </div>

          {/* Feedbacks Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Total Feedbacks</h3>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-yellow-600">{totalFeedbacks}</p>
                )}
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faComments} className="text-2xl text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">User feedback submissions</p>
          </div>

          {/* Announcements Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Total Announcements</h3>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-red-600">{totalAnnouncements}</p>
                )}
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faBullhorn} className="text-2xl text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Platform announcements</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <button className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <FontAwesomeIcon icon={faUserMd} className="mr-2" />
              <span className="font-medium">Manage Doctors</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <FontAwesomeIcon icon={faUsers} className="mr-2" />
              <span className="font-medium">Manage Patients</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <FontAwesomeIcon icon={faBullhorn} className="mr-2" />
              <span className="font-medium">Announcements</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <FontAwesomeIcon icon={faComments} className="mr-2" />
              <span className="font-medium">Feedbacks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanal;
