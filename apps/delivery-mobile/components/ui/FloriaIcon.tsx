import React from "react";
import type { IconWeight } from "phosphor-react-native";
import type { ColorValue } from "react-native";
import {
  Truck,
  Package,
  NavigationArrow,
  MapPin,
  Clock,
  CheckCircle,
  WarningCircle,
  Check,
  Star,
  Camera,
  Images,
  PhoneCall,
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
  House,
  Receipt,
  User,
  UserPlus,
  Shield,
  Eye,
  EyeSlash,
  ArrowSquareOut,
  Bicycle,
  Moped,
  Phone,
  ChatCircle,
} from "phosphor-react-native";
import { theme } from "../../lib/theme";

export type FloriaIconName =
  | "truck"
  | "shipping"
  | "package"
  | "deliveries"
  | "navigation"
  | "map_pin"
  | "home"
  | "orders"
  | "account"
  | "user"
  | "clock"
  | "warning"
  | "alert"
  | "check_circle"
  | "check"
  | "star"
  | "camera"
  | "gallery"
  | "images"
  | "phone"
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
  | "earnings"
  | "bell"
  | "sparkles"
  | "info"
  | "logout"
  | "login"
  | "shield"
  | "list"
  | "filter"
  | "hub"
  | "eye"
  | "eye_off"
  | "external_link"
  | "route"
  | "scooter"
  | "chat";

interface FloriaIconProps {
  name: FloriaIconName | string;
  size?: number;
  color?: string | ColorValue;
  weight?: IconWeight;
  style?: any;
}

export function FloriaIcon({
  name,
  size = 20,
  color = theme.colors.forest,
  weight = "regular",
  style,
}: FloriaIconProps) {
  const iconProps = { size, color: color as string, weight, style };

  switch (name) {
    case "truck":
    case "shipping":
      return <Truck {...iconProps} />;
    case "package":
    case "deliveries":
      return <Package {...iconProps} />;
    case "navigation":
      return <NavigationArrow {...iconProps} />;
    case "map_pin":
      return <MapPin {...iconProps} />;
    case "home":
      return <House {...iconProps} />;
    case "orders":
      return <Receipt {...iconProps} />;
    case "account":
    case "user":
      return <User {...iconProps} />;
    case "user_plus":
      return <UserPlus {...iconProps} />;
    case "clock":
      return <Clock {...iconProps} />;
    case "warning":
    case "alert":
      return <WarningCircle {...iconProps} />;
    case "check_circle":
      return <CheckCircle {...iconProps} />;
    case "check":
      return <Check {...iconProps} />;
    case "star":
      return <Star {...iconProps} />;
    case "camera":
      return <Camera {...iconProps} />;
    case "gallery":
    case "images":
      return <Images {...iconProps} />;
    case "phone":
      return <PhoneCall {...iconProps} />;
    case "chat":
      return <ChatCircle {...iconProps} />;
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
      return <Plus {...iconProps} />;
    case "close":
      return <X {...iconProps} />;
    case "search":
      return <MagnifyingGlass {...iconProps} />;
    case "wallet":
    case "earnings":
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
    case "shield_outline":
      return <Shield {...iconProps} />;
    case "list":
      return <List {...iconProps} />;
    case "filter":
      return <Sliders {...iconProps} />;
    case "hub":
      return <Buildings {...iconProps} />;
    case "eye":
      return <Eye {...iconProps} />;
    case "eye_off":
      return <EyeSlash {...iconProps} />;
    case "external_link":
      return <ArrowSquareOut {...iconProps} />;
    case "route":
      return <NavigationArrow {...iconProps} />;
    case "scooter":
      return <Moped {...iconProps} />;
    default:
      return <Package {...iconProps} />;
  }
}
