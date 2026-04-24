import type { InputHTMLAttributes } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  maxLength?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  multiline?: boolean;
}

export default function FormField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  maxLength,
  inputMode,
  multiline = false,
}: FormFieldProps) {
  const baseClass = `w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 ${
    error
      ? "border-red-400 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-900"
      : "border-gray-200 focus:border-orange-400 focus:ring-orange-200/60 dark:border-gray-700 dark:focus:border-orange-500 dark:focus:ring-orange-900/40"
  }`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        {label}
      </label>

      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          className={baseClass}
        />
      )}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
