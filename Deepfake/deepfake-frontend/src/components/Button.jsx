import React from "react";

export default function Button({
  children,
  type = "button",
  disabled = false,
  className = "",
  variant = "primary",
  as: Component = "button",
  ...props
}) {
  const baseStyles = "px-6 py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-purple-500/50",
  };

  const buttonStyles = `${baseStyles} ${variants[variant]} ${className}`;

  if (Component === "button") {
    return (
      <button type={type} disabled={disabled} className={buttonStyles} {...props}>
        {children}
      </button>
    );
  }

  return (
    <Component className={buttonStyles} disabled={disabled} {...props}>
      {children}
    </Component>
  );
}
