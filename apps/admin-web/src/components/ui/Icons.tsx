"use client";

import React from "react";
import { FloriaIcon, type FloriaIconName, type FloriaIconWeight } from "@floria/icons";

export { FloriaIcon };
export type { FloriaIconName, FloriaIconWeight };

export type IconProps = {
  size?: number;
  weight?: FloriaIconWeight;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
  "aria-label"?: string;
};

function createIcon(name: FloriaIconName, defaultSize = 20) {
  const Component = ({ size = defaultSize, weight, className, color, style, onClick, "aria-label": ariaLabel, ...rest }: IconProps) => (
    <FloriaIcon
      name={name}
      size={size}
      weight={weight}
      className={className}
      color={color}
      style={style}
      onClick={onClick}
      ariaLabel={ariaLabel}
      {...rest}
    />
  );
  Component.displayName = `FloriaIcon(${name})`;
  return Component;
}

// ── 1. CUSTOMER UI ICONS ────────────────────────────────────────────────────
export const SearchIcon = createIcon("search", 20);
export const UserIcon = createIcon("user", 20);
export const BagIcon = createIcon("bag", 20);
export const WishlistIcon = createIcon("favorite", 20);
export const VerifiedIcon = createIcon("verified", 16);
export const ShieldIcon = createIcon("shield_check", 20);
export const TruckIcon = createIcon("truck", 20);
export const ReturnIcon = createIcon("return", 20);
export const StarIcon = createIcon("star", 16);
export const BellIcon = createIcon("bell", 20);
export const CreditCardIcon = createIcon("credit_card", 20);
export const BankIcon = createIcon("bank", 20);
export const WalletIcon = createIcon("wallet", 20);
export const CheckCircleIcon = createIcon("check_circle", 48);
export const LockIcon = createIcon("lock", 20);
export const LogoutIcon = createIcon("logout", 20);
export const AlertIcon = createIcon("warning", 20);
export const CheckIcon = createIcon("check", 20);
export const MapPinIcon = createIcon("location", 18);

// ── 2. PLANT & CARE ICONS ───────────────────────────────────────────────────
export const LeafIcon = createIcon("leaf", 20);
export const SproutIcon = createIcon("sprout", 20);
export const PlanterIcon = createIcon("potted_plant", 20);
export const FlaskIcon = createIcon("flower", 20);
export const ToolsIcon = createIcon("settings", 20);
export const FlowerIcon = createIcon("flower", 20);
export const CactusIcon = createIcon("cactus", 20);
export const SunIcon = createIcon("sun", 20);

// ── 3. SELLER / ADMIN DASHBOARD ICONS ───────────────────────────────────────
export const GridIcon = createIcon("categories", 20);
export const OrderIcon = createIcon("orders", 20);
export const UserGroupIcon = createIcon("users", 20);
export const PayoutIcon = createIcon("cash", 20);
export const SettingsIcon = createIcon("settings", 20);
export const ImageIcon = createIcon("camera", 20);
export const TrashIcon = createIcon("trash", 18);
export const EditIcon = createIcon("edit", 18);
export const CopyIcon = createIcon("copy", 18);
export const EyeIcon = createIcon("eye", 18);
export const FilterIcon = createIcon("filter", 18);
export const ZapIcon = createIcon("sparkles", 18);
export const CloseIcon = createIcon("close", 18);
export const RefreshIcon = createIcon("refresh", 18);
export const NurseryIcon = createIcon("storefront", 20);
