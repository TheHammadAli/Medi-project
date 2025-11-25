import React from "react";

const TextAreaField = ({ label, name, placeholder, required = false, disabled = false, className = "", value, onChange, isEditing }) => (
  <div className={`mb-6 ${className}`}>
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled || (!isEditing)}
      rows={4}
      className={`w-full px-4 py-3 border ${disabled || !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white border-gray-200 hover:border-blue-300 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none`}
      required={required}
    />
  </div>
);

export default TextAreaField;