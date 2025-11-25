import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const Feedback = () => {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleExitIntent = (e) => {
      if (e.clientY < 0) {
        setShowModal(true);
      }
    };

    document.addEventListener("mouseout", handleExitIntent);
    return () => document.removeEventListener("mouseout", handleExitIntent);
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter some feedback.");
      return;
    }
  
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to submit feedback.");
      return;
    }
  
    try {
      await axios.post(
        "http://localhost:5000/api/feedback/create",
        { message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      toast.success("Feedback sent!");
      setMessage("");
      setShowModal(false);
    } catch (err) {
      toast.error("❌ Failed to send feedback.");
      console.error(err);
    }
  };
  

  return (
    <>
      {showModal && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl w-80 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">💬 Quick Feedback</h3>
            <p className="text-sm text-gray-600 mb-3">Got a moment? Tell us what we can improve!</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows="3"
              placeholder="Your feedback..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setShowModal(false)}
              >
                Dismiss
              </button>
              <button
                className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 transition"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Feedback;
