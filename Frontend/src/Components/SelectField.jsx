import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const SelectField = ({ label, name, options, required = false, disabled = false, className = "", value, onChange, isEditing }) => (
  <div className={`mb-6 ${className}`}>
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled || (!isEditing)}
        className={`w-full px-4 py-3 border ${disabled || !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white border-gray-200 hover:border-blue-300 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 appearance-none cursor-pointer`}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
        <svg className={`w-5 h-5 ${disabled || !isEditing ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  </div>
);

export default SelectField;