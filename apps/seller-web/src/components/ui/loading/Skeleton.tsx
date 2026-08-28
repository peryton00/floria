import React from "react";

export type SkeletonVariant =
  "text" | "avatar" | "image" | "rectangle" | "circle";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "rectangle",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "text":
        return "h-4 rounded w-full my-1";
      case "avatar":
        return "w-10 h-10 rounded-full shrink-0";
      case "circle":
        return "rounded-full shrink-0";
      case "image":
        return "w-full aspect-[4/3] rounded-xl";
      case "rectangle":
      default:
        return "rounded-lg w-full h-full";
    }
  };

  const customStyle: React.CSSProperties = {
    ...(width !== undefined
      ? { width: typeof width === "number" ? `${width}px` : width }
      : {}),
    ...(height !== undefined
      ? { height: typeof height === "number" ? `${height}px` : height }
      : {}),
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      style={customStyle}
      className={`bg-stone-200/80 animate-pulse motion-reduce:animate-none motion-reduce:opacity-60 ${getVariantStyles()} ${className}`}
      {...props}
    />
  );
}
