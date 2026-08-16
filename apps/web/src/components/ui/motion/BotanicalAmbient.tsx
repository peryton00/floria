import React from "react";

interface BotanicalAmbientProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function BotanicalAmbient({ children, className = "", ...props }: BotanicalAmbientProps) {
  return (
    <div className={`animate-botanical-sway pointer-events-none select-none ${className}`} {...props}>
      {children}
    </div>
  );
}
