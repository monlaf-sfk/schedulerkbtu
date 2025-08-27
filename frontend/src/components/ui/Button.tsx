import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyles = "px-6 py-3 font-bold rounded-xl transition-all duration-200 shadow-lg";

  const variantStyles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-500 border border-emerald-500/50 hover:shadow-xl",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 disabled:bg-slate-500 border border-slate-600/50 hover:border-slate-500",
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};