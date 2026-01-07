import React from "react";

export default function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  hint,
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
