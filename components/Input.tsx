"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-bold text-navy-deep uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl border bg-white text-navy-deep text-sm font-medium
            placeholder:text-foreground/40 placeholder:font-normal
            transition-all duration-200
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-gray-200 focus:border-gold-warm focus:ring-2 focus:ring-gold-soft'
            }
            ${props.disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}
            ${className}
          `}
          {...props}
        />
        {(error || helperText) && (
          <span className={`text-xs ${error ? 'text-red-500' : 'text-foreground/50'}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;