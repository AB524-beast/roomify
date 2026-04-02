import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullName?: string;
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullName,
  className = '',
  children,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `${baseClass}--${variant}`;
  const sizeClass = `${baseClass}--${size}`;
  const fullClass = fullName ? `${baseClass}--${fullName.toLowerCase().replace(/\s+/g, '-')}` : '';
  const combinedClassName = [baseClass, variantClass, sizeClass, fullClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

