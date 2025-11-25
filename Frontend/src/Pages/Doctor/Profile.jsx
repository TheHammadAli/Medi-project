import React, { useState, useContext, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faGraduationCap,
  faMapMarkerAlt,
  faClock,
  faCalendarAlt,
  faFileMedical,
  faMoneyBill,
  faInfoCircle,
  faCamera,
  faIdCard,
  faStethoscope
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import ProfileContext from "../../Context/ProfileContext";
import AppContext from "../../Context/AppContext"; // to get logged-in user

const Profile = () => {
  const { user } = useContext(AppContext);
  const { uploadProfile, getProfileByEmail, updateProfile, loading, uploadError } =
    useContext(ProfileContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    licenseNumber: "",
    speciality: "",
    education: "",
    experience: "",
    fees: "",
    address1: "",
    address2: "",
    about: "",
    timing: "",
    daysAvailable: [],
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isExistingProfile, setIsExistingProfile] = useState(false);

  // ✅ Load profile if exists
  useEffect(() => {
    const fetchExisting = async () => {
      if (user?.email) {
        const profile = await getProfileByEmail(user.email);
        if (profile) {
          setFormData({
            name: profile.name || "",
            email: profile.email || "",
            licenseNumber: profile.licenseNumber || "",
            speciality: profile.speciality || "",
            education: profile.education || "",
            experience: profile.experience || "",
            fees: profile.fees || "",
            address1: profile.address1 || "",
            address2: profile.address2 || "",
            about: profile.about || "",
            timing: profile.timing || "",
            daysAvailable: profile.daysAvailable || [],
          });
          setImagePreview(profile.imageUrl || null);
          setIsExistingProfile(true);
        } else {
          setFormData((prev) => ({ ...prev, email: user.email })); // set email at least
        }
      }
    };

    fetchExisting();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => data.append(`${key}[]`, v));
      } else {
        data.append(key, value);
      }
    });

    if (imageFile) {
      data.append("image", imageFile);
    }

    let res;
    if (isExistingProfile) {
      res = await updateProfile(formData.email, data);
    } else {
      res = await uploadProfile(data);
    }

    if (res && res.doctor) {
      toast.success("Doctor profile saved successfully!");
      setImageFile(null);
      setIsExistingProfile(true);
    } else {
      toast.error("Failed to save profile.");
    }
  };

  return (
    <>
      <div className="min-h-screen rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Doctor Profile Management
                  </h1>
                  <p className="text-lg text-gray-600 mb-1">
                    Manage your professional information and settings
                  </p>
                  <p className="text-sm text-gray-500">
                    Complete your professional information to build trust and showcase your expertise.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8">
              {/* Image Upload Section */}
              <div className="mb-10">
                <div className="flex flex-col items-center">
                  <label htmlFor="imageUpload" className="cursor-pointer group">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full overflow-hidden flex items-center justify-center mb-4 shadow-lg border-4 border-white group-hover:border-blue-200 transition-all duration-300">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Doctor"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUser} className="text-5xl text-gray-400" />
                        )}
                      </div>
                      <div className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-blue-700 transition-colors duration-300">
                        <FontAwesomeIcon icon={faCamera} className="text-white text-lg" />
                      </div>
                    </div>
                  </label>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-blue-500 text-sm font-medium">Click to upload profile picture</p>
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG up to 5MB</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Personal Information Section */}
                <div className="space-y-6">

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faEnvelope} className="text-blue-500" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="doctor@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-blue-500" />
                        Education
                      </label>
                      <input
                        type="text"
                        name="education"
                        placeholder="e.g. MBBS, MD, etc."
                        value={formData.education}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faIdCard} className="text-blue-500" />
                        License Number
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        placeholder="Enter your medical license number"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div className="space-y-6">
                  

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faFileMedical} className="text-blue-500" />
                        Speciality
                      </label>
                      <select
                        name="speciality"
                        value={formData.speciality}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Select your speciality</option>
                        <option>General physician</option>
                        <option>Cardiologist</option>
                        <option>Neurologist</option>
                        <option>Dermatologist</option>
                        <option>Diabetologist</option>
                        <option>Pediatrician</option>
                        <option>Orthopedic</option>
                        <option>Gynecologist</option>
                        <option>Psychiatrist</option>
                        <option>Ophthalmologist</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                        Experience
                      </label>
                      <select
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Select experience level</option>
                        <option>1-2 years</option>
                        <option>3-5 years</option>
                        <option>6-10 years</option>
                        <option>10+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faMoneyBill} className="text-blue-500" />
                        Consultation Fees
                      </label>
                      <input
                        type="text"
                        name="fees"
                        placeholder="Enter consultation fees"
                        value={formData.fees}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="lg:col-span-2 space-y-6">
                  

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-500" />
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        name="address1"
                        placeholder="Street address, building number"
                        value={formData.address1}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-500" />
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="address2"
                        placeholder="City, state, postal code"
                        value={formData.address2}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Availability Section */}
                <div className="lg:col-span-2 space-y-6">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                        Available Timing
                      </label>
                      <input
                        type="text"
                        name="timing"
                        placeholder="e.g. 10:00 AM - 2:00 PM"
                        value={formData.timing}
                        onChange={handleChange}
                        className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500" />
                        Available Days
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                          <label key={day} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              value={day}
                              checked={formData.daysAvailable.includes(day)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const value = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  daysAvailable: checked
                                    ? [...prev.daysAvailable, value]
                                    : prev.daysAvailable.filter((d) => d !== value),
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          

              {/* About Me Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600" />
                  <h4 className="text-xl font-semibold text-gray-800">About Me</h4>
                </div>

                <div>
                  <textarea
                    name="about"
                    rows="5"
                    placeholder="Write a brief description about your medical background, expertise, and approach to patient care..."
                    value={formData.about}
                    onChange={handleChange}
                    className="w-full rounded-lg px-4 py-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                <div className="flex-1">
                  {uploadError && (
                    <div className="flex items-center gap-2 text-red-600">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-red-500" />
                      <p>{uploadError}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUser} />
                        {isExistingProfile ? "Update Profile" : "Create Profile"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

