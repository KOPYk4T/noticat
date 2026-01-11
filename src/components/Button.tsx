import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "text";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-800 disabled:hover:bg-neutral-900 shadow-lg shadow-neutral-900/20",
  secondary: "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 shadow-sm shadow-neutral-200/50",
  ghost: "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50",
  text: "text-neutral-400 hover:text-neutral-600",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-10 py-4 text-lg rounded-2xl",
};

export const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = "font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const widthStyles = fullWidth ? "w-full flex-1" : "";
  const hoverScaleStyles = variant === "primary" && size === "lg" ? "hover:scale-[1.02] active:scale-[0.98]" : "";

  return (
    <button
      className={`${baseStyles} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${widthStyles} ${hoverScaleStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
