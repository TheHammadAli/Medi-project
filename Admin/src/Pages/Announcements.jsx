import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

const Announcements = () => {
  const [message, setMessage] = useState("");
  const [announcementList, setAnnouncementList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  // ✅ Submit new announcement
  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/announcement/create", { message });
      toast.success("Announcement posted!");
      setMessage("");
      fetchAnnouncements(); // refresh list
    } catch (err) {
      console.error("Error posting announcement:", err);
      toast.error("Failed to post announcement.");
    }
  };

  // ✅ Get all announcements (optional)
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/announcement/all"); // If available
      setAnnouncementList(res.data);
    } catch (err) {
      console.error("Error fetching announcements");
    } finally {
      setLoading(false);
    }
  };

  
  // ✅ Open delete confirmation modal
  const handleDelete = (announcement) => {
    setAnnouncementToDelete(announcement);
    setShowModal(true);
  };

  // ✅ Confirm delete announcement
  const confirmDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/announcement/${announcementToDelete._id}`);
      toast.success("Announcement deleted successfully!");
      setAnnouncementList(announcementList.filter((a) => a._id !== announcementToDelete._id));
      setShowModal(false);
      setAnnouncementToDelete(null);
    } catch (err) {
      console.error("❌ Error deleting announcement:", err);
      toast.error("Failed to delete announcement.");
    }
  };
  

  // ✅ Format date to "16 Nov, 2025"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);



  return (
    <div className="min-h-screen rounded-xl bg-gradient-to-br from-blue-20 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Announcements</h1>
                <p className="text-sm text-gray-500">Create and manage system-wide announcements for users</p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <FontAwesomeIcon icon={faBullhorn} className="text-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Announcement Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FontAwesomeIcon icon={faPlus} className="mr-2 text-blue-600" />
            Create New Announcement
          </h2>
          <div className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Write your announcement message here..."
            />
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Post Announcement
            </button>
          </div>
        </div>

        {/* Announcements Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <FontAwesomeIcon icon={faBullhorn} className="text-4xl text-blue-600 mb-4 animate-pulse" />
            <p className="text-gray-600">Loading announcements...</p>
          </div>
        ) : announcementList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-600">No announcements yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Posted</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {announcementList.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        <div className="line-clamp-3">{a.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(a.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(a)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && announcementToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full mx-2 sm:mx-4 border border-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Delete Announcement?
              </h3>
              <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                Are you sure you want to delete this announcement? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                >
                  Keep Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
