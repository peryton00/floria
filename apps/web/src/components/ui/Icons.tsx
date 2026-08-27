"use client";

import React from "react";
import {
  Search,
  User,
  ShoppingBag,
  Heart,
  BadgeCheck,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  CreditCard,
  Landmark,
  Wallet,
  CheckCircle,
  Bell,
  Lock,
  LogOut,
  AlertTriangle,
  Check,
  MapPin,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import {
  Leaf,
  Plant,
  PottedPlant,
  Flask,
  Wrench,
  Flower,
  Cactus,
  Sun,
} from "@phosphor-icons/react";
import {
  IconLayoutGrid,
  IconShoppingBag,
  IconUsers,
  IconCash,
  IconSettings,
} from "@tabler/icons-react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

// ── 1. CUSTOMER UI ICONS (LUCIDE) ──────────────────────────────────────────

export function SearchIcon({ size = 20, className, ...props }: IconProps) {
  return <Search size={size} className={className} {...props} />;
}

export function UserIcon({ size = 20, className, ...props }: IconProps) {
  return <User size={size} className={className} {...props} />;
}

export function BagIcon({ size = 20, className, ...props }: IconProps) {
  return <ShoppingBag size={size} className={className} {...props} />;
}

export function WishlistIcon({ size = 20, className, ...props }: IconProps) {
  return <Heart size={size} className={className} {...props} />;
}

export function VerifiedIcon({ size = 16, className, ...props }: IconProps) {
  return <BadgeCheck size={size} className={className} {...props} />;
}

export function ShieldIcon({ size = 20, className, ...props }: IconProps) {
  return <ShieldCheck size={size} className={className} {...props} />;
}

export function TruckIcon({ size = 20, className, ...props }: IconProps) {
  return <Truck size={size} className={className} {...props} />;
}

export function ReturnIcon({ size = 20, className, ...props }: IconProps) {
  return <RotateCcw size={size} className={className} {...props} />;
}

export function StarIcon({ size = 16, className, ...props }: IconProps) {
  return <Star size={size} className={className} {...props} />;
}

export function BellIcon({ size = 20, className, ...props }: IconProps) {
  return <Bell size={size} className={className} {...props} />;
}

export function CreditCardIcon({ size = 20, className, ...props }: IconProps) {
  return <CreditCard size={size} className={className} {...props} />;
}

export function BankIcon({ size = 20, className, ...props }: IconProps) {
  return <Landmark size={size} className={className} {...props} />;
}

export function WalletIcon({ size = 20, className, ...props }: IconProps) {
  return <Wallet size={size} className={className} {...props} />;
}

export function CheckCircleIcon({ size = 48, className, ...props }: IconProps) {
  return <CheckCircle size={size} className={className} {...props} />;
}

export function LockIcon({ size = 20, className, ...props }: IconProps) {
  return <Lock size={size} className={className} {...props} />;
}

export function LogoutIcon({ size = 20, className, ...props }: IconProps) {
  return <LogOut size={size} className={className} {...props} />;
}

export function AlertIcon({ size = 20, className, ...props }: IconProps) {
  return <AlertTriangle size={size} className={className} {...props} />;
}

export function CheckIcon({ size = 20, className, ...props }: IconProps) {
  return <Check size={size} className={className} {...props} />;
}

export function MapPinIcon({ size = 18, className, ...props }: IconProps) {
  return <MapPin size={size} className={className} {...props} />;
}

// ── 2. PLANT & CARE ICONS (PHOSPHOR) ──────────────────────────────────────

export function LeafIcon({ size = 20, className, ...props }: IconProps) {
  return <Leaf size={size} className={className} {...props} />;
}

export function SproutIcon({ size = 20, className, ...props }: IconProps) {
  return <Plant size={size} className={className} {...props} />;
}

export function PlanterIcon({ size = 20, className, ...props }: IconProps) {
  return <PottedPlant size={size} className={className} {...props} />;
}

export function FlaskIcon({ size = 20, className, ...props }: IconProps) {
  return <Flask size={size} className={className} {...props} />;
}

export function ToolsIcon({ size = 20, className, ...props }: IconProps) {
  return <Wrench size={size} className={className} {...props} />;
}

export function FlowerIcon({ size = 20, className, ...props }: IconProps) {
  return <Flower size={size} className={className} {...props} />;
}

export function CactusIcon({ size = 20, className, ...props }: IconProps) {
  return <Cactus size={size} className={className} {...props} />;
}

export function SunIcon({ size = 20, className, ...props }: IconProps) {
  return <Sun size={size} className={className} {...props} />;
}

// ── 3. SELLER / ADMIN DASHBOARD ICONS (TABLER) ────────────────────────────

export function GridIcon({ size = 20, className, ...props }: IconProps) {
  return <IconLayoutGrid size={size} className={className} {...props} />;
}

export function OrderIcon({ size = 20, className, ...props }: IconProps) {
  return <IconShoppingBag size={size} className={className} {...props} />;
}

export function UserGroupIcon({ size = 20, className, ...props }: IconProps) {
  return <IconUsers size={size} className={className} {...props} />;
}

export function PayoutIcon({ size = 20, className, ...props }: IconProps) {
  return <IconCash size={size} className={className} {...props} />;
}

export function SettingsIcon({ size = 20, className, ...props }: IconProps) {
  return <IconSettings size={size} className={className} {...props} />;
}

export function ImageIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function TrashIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function EditIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function CopyIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function EyeIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function FilterIcon({ size = 18, className, ...props }: IconProps) {
  return <SlidersHorizontal size={size} className={className} {...props} />;
}

export function ZapIcon({ size = 18, className, ...props }: IconProps) {
  return <Zap size={size} className={className} {...props} />;
}
