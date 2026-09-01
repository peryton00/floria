import React from "react";
import type { IconWeight } from "phosphor-react-native";
import {
  Plant,
  House,
  Receipt,
  User,
  Storefront,
  Package,
  Clock,
  WarningCircle,
  CheckCircle,
  Check,
  Star,
  Trash,
  Camera,
  Images,
  PhoneCall,
  WhatsappLogo,
  EnvelopeSimple,
  Key,
  LockSimple,
  CaretRight,
  CaretLeft,
  ArrowLeft,
  Plus,
  X,
  MagnifyingGlass,
  Wallet,
  Bell,
  Sparkle,
  Info,
  SignOut,
  SignIn,
  ShieldCheck,
  List,
  Sliders,
  Buildings,
} from "phosphor-react-native";
import { Colors } from "../../lib/theme";

export type FloriaIconName =
  | "leaf"
  | "plant"
  | "home"
  | "orders"
  | "account"
  | "user"
  | "storefront"
  | "inventory"
  | "package"
  | "clock"
  | "warning"
  | "check_circle"
  | "check"
  | "star"
  | "trash"
  | "delete"
  | "camera"
  | "gallery"
  | "images"
  | "phone"
  | "whatsapp"
  | "mail"
  | "key"
  | "lock"
  | "chevron_right"
  | "chevron_left"
  | "arrow_left"
  | "plus"
  | "close"
  | "search"
  | "wallet"
  | "bell"
  | "sparkles"
  | "info"
  | "logout"
  | "login"
  | "shield"
  | "list"
  | "filter"
  | "nursery";

interface FloriaIconProps {
  name: FloriaIconName | string;
  size?: number;
  color?: string;
  weight?: IconWeight;
  style?: any;
}

export function FloriaIcon({
  name,
  size = 20,
  color = Colors.forest,
  weight = "regular",
  style,
}: FloriaIconProps) {
  const iconProps = { size, color, weight, style };

  switch (name) {
    case "leaf":
    case "plant":
      return <Plant {...iconProps} />;
    case "home":
      return <House {...iconProps} />;
    case "orders":
      return <Receipt {...iconProps} />;
    case "account":
    case "user":
      return <User {...iconProps} />;
    case "storefront":
      return <Storefront {...iconProps} />;
    case "inventory":
    case "package":
      return <Package {...iconProps} />;
    case "clock":
      return <Clock {...iconProps} />;
    case "warning":
    case "alert":
      return <WarningCircle {...iconProps} />;
    case "check_circle":
    case "success":
      return <CheckCircle {...iconProps} />;
    case "check":
      return <Check {...iconProps} />;
    case "star":
      return <Star {...iconProps} />;
    case "trash":
    case "delete":
      return <Trash {...iconProps} />;
    case "camera":
      return <Camera {...iconProps} />;
    case "gallery":
    case "images":
      return <Images {...iconProps} />;
    case "phone":
      return <PhoneCall {...iconProps} />;
    case "whatsapp":
      return <WhatsappLogo {...iconProps} />;
    case "mail":
      return <EnvelopeSimple {...iconProps} />;
    case "key":
      return <Key {...iconProps} />;
    case "lock":
      return <LockSimple {...iconProps} />;
    case "chevron_right":
      return <CaretRight {...iconProps} />;
    case "chevron_left":
      return <CaretLeft {...iconProps} />;
    case "arrow_left":
      return <ArrowLeft {...iconProps} />;
    case "plus":
    case "add":
      return <Plus {...iconProps} />;
    case "close":
      return <X {...iconProps} />;
    case "search":
      return <MagnifyingGlass {...iconProps} />;
    case "wallet":
      return <Wallet {...iconProps} />;
    case "bell":
      return <Bell {...iconProps} />;
    case "sparkles":
      return <Sparkle {...iconProps} />;
    case "info":
      return <Info {...iconProps} />;
    case "logout":
      return <SignOut {...iconProps} />;
    case "login":
      return <SignIn {...iconProps} />;
    case "shield":
      return <ShieldCheck {...iconProps} />;
    case "list":
      return <List {...iconProps} />;
    case "filter":
      return <Sliders {...iconProps} />;
    case "nursery":
      return <Buildings {...iconProps} />;
    default:
      return <Plant {...iconProps} />;
  }
}
