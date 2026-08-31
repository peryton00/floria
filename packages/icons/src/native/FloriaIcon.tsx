import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import * as PhosphorIconsNative from "phosphor-react-native";
import {
  BaseFloriaIconProps,
  FloriaIconName,
} from "../types";
import {
  PHOSPHOR_ICON_NAME_MAP,
  resolveDefaultWeight,
  resolveIconSize,
} from "../registry";

export interface FloriaNativeIconProps extends Omit<BaseFloriaIconProps, "name"> {
  name: FloriaIconName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Universal Floria Mobile / Native Icon component powered by Phosphor Icons.
 * Ensures identical visual language across iOS and Android mobile platforms.
 */
export function FloriaIcon({
  name,
  size = "md",
  weight,
  color = "#1C3524",
  mirrored = false,
  style,
  accessibilityLabel,
  ...rest
}: FloriaNativeIconProps) {
  const phosphorName = PHOSPHOR_ICON_NAME_MAP[name] || "Question";
  const IconComponent =
    (PhosphorIconsNative as Record<string, any>)[phosphorName] ||
    PhosphorIconsNative.Question;

  const resolvedSize = resolveIconSize(size);
  const resolvedWeight = resolveDefaultWeight(name, weight);

  return (
    <IconComponent
      size={resolvedSize}
      weight={resolvedWeight}
      color={color}
      mirrored={mirrored}
      style={style}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      {...rest}
    />
  );
}

export default FloriaIcon;
