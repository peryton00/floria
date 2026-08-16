import React from "react";

interface FadeUpProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number; // ms
  duration?: number; // ms
  children: React.ReactNode;
  className?: string;
}

export function FadeUp({
  delay = 0,
  duration = 300,
  children,
  className = "",
  style,
  ...props
}: FadeUpProps) {
  return (
    <div
      className={`animate-fade-up ${className}`}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
