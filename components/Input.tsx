import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full mb-4">
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-university-500 focus:border-university-500 transition-colors ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
