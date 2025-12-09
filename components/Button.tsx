import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseStyles = "relative font-bold uppercase tracking-wider transition-all duration-200 transform focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed clip-path-slant";
  
  const variants = {
    primary: "bg-neon-blue text-black hover:bg-white hover:shadow-[0_0_15px_rgba(0,255,255,0.7)]",
    secondary: "bg-transparent border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white hover:shadow-[0_0_15px_rgba(188,19,254,0.5)]",
    danger: "bg-red-500 text-white hover:bg-red-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.7)]",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-8 py-3 text-base",
    lg: "px-10 py-4 text-xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};
