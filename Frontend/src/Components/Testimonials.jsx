import React, { useContext, useState } from "react";
import AppContext from "../Context/AppContext";
import { toast } from "sonner";
import SlideInOnScroll from "./SlideInOnScroll";

const Testimonials = () => {
  const { testimonials, loading, addTestimonial, setTestimonials } = useContext(AppContext);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    status: "patient",
    comment: "",
  });

  const getRole = (status) => {
    if (!status) return "Patient";
    return status.trim().charAt(0).toUpperCase() + status.trim().slice(1).toLowerCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await addTestimonial(formData);

    if (!result.error) {
      setTestimonials((prev) => [
        {
          _id: result._id,
          name: formData.name,
          status: formData.status,
          comment: formData.comment,
        },
        ...prev,
      ]);
      toast.success("✅ Testimonial submitted successfully!");
      setFormData({ name: "", status: "patient", comment: "" });
      setShowForm(false);
    } else {
      toast.error("❌ Failed to submit testimonial. Please try again.");
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <SlideInOnScroll direction="up">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                What Our Customers Say
              </h1>
              <p className="text-xl md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Real stories from doctors and patients who trust our platform every day.
              </p>
            </SlideInOnScroll>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Customer Testimonials</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from our satisfied users
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center">
                <p className="text-gray-600 text-lg">Loading testimonials...</p>
              </div>
            ) : testimonials.length > 0 ? (
              testimonials.slice(0, 6).map((testimonial, index) => (
                <SlideInOnScroll key={testimonial._id} direction={index % 2 === 0 ? "up" : "up"}>
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 text-center h-full">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{testimonial.name}</h3>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4
                        ${testimonial.status?.toLowerCase() === "doctor"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                        }`}
                    >
                      {getRole(testimonial.status)}
                    </span>
                    {testimonial.message && (
                      <p className="text-gray-600 italic mb-2">"{testimonial.message}"</p>
                    )}
                    {testimonial.comment && (
                      <div className="mt-2">
                        <p className="text-gray-600 text-sm">{testimonial.comment}</p>
                      </div>
                    )}
                  </div>
                </SlideInOnScroll>
              ))
            ) : (
              <div className="col-span-full text-center">
                <p className="text-gray-600 text-lg">No testimonials available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Share Experience Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideInOnScroll direction="up">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Share Your Experience</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                We would love to hear your thoughts and experiences. Your feedback helps us improve and serve you better.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                aria-label="Open testimonial submission form"
              >
                Submit Your Thoughts
              </button>
            </div>
          </SlideInOnScroll>
        </div>
      </section>


      {/* Modal Overlay */}
      {showForm && (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 overflow-auto"
    onClick={() => setShowForm(false)}
  >
    <div className="flex justify-center pt-20 min-h-full px-4 sm:px-6">
      {/* Centered Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-50 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-600">Submit Testimonial</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-400 hover:text-red-500 text-2xl font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Sarah Khan"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
            <textarea
              rows={4}
              placeholder="Share your experience here..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              required
            />
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full shadow-md transition-all duration-300"
            >
              Submit Testimonial
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Testimonials;
