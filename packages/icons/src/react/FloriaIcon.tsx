"use client";

import React from "react";
import * as PhosphorIcons from "@phosphor-icons/react";
import {
  BaseFloriaIconProps,
  FloriaIconName,
} from "../types.js";
import {
  PHOSPHOR_ICON_NAME_MAP,
  resolveDefaultWeight,
  resolveIconSize,
} from "../registry.js";

export interface FloriaWebIconProps extends Omit<BaseFloriaIconProps, "name"> {
  name: FloriaIconName;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

/**
 * Universal Floria Web Icon component powered by Phosphor Icons.
 * Ensures consistent weight, sizing, and accessibility across all Web interfaces.
 */
export function FloriaIcon({
  name,
  size = "md",
  weight,
  color = "currentColor",
  mirrored = false,
  className,
  style,
  ariaLabel,
  onClick,
  ...rest
}: FloriaWebIconProps) {
  const phosphorName = PHOSPHOR_ICON_NAME_MAP[name] || "Question";
  const IconComponent = (PhosphorIcons as Record<string, any>)[phosphorName] || PhosphorIcons.Question;

  const resolvedSize = resolveIconSize(size);
  const resolvedWeight = resolveDefaultWeight(name, weight);

  const accessibilityProps = ariaLabel
    ? {
        "aria-label": ariaLabel,
        role: "img",
      }
    : {
        "aria-hidden": true,
      };

  return (
    <IconComponent
      size={resolvedSize}
      weight={resolvedWeight}
      color={color}
      mirrored={mirrored}
      className={className}
      style={style}
      onClick={onClick}
      {...accessibilityProps}
      {...rest}
    />
  );
}

export default FloriaIcon;
