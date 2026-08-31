import React from "react";
import type { StyleProp, TextStyle } from "react-native";
import {
  BaseFloriaIconProps,
  FloriaIconName,
} from "../types";
import { resolveDefaultWeight, resolveIconSize } from "../registry";

export interface FloriaNativeIconProps extends Omit<BaseFloriaIconProps, "name"> {
  name: FloriaIconName;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

type IoniconsGlyph = string;

interface IconMapping {
  outline: IoniconsGlyph;
  fill: IoniconsGlyph;
}

let Ionicons: any;
try {
  Ionicons = require("@expo/vector-icons").Ionicons;
} catch {
  Ionicons = null;
}

const NATIVE_ICON_MAP: Record<FloriaIconName, IconMapping> = {
  // Navigation & Discovery
  home: { outline: "home-outline", fill: "home" },
  search: { outline: "search-outline", fill: "search" },
  explore: { outline: "compass-outline", fill: "compass" },
  categories: { outline: "grid-outline", fill: "grid" },
  cart: { outline: "cart-outline", fill: "cart" },
  bag: { outline: "bag-outline", fill: "bag" },
  favorite: { outline: "heart-outline", fill: "heart" },
  wishlist: { outline: "heart-outline", fill: "heart" },
  heart: { outline: "heart-outline", fill: "heart" },
  orders: { outline: "receipt-outline", fill: "receipt" },
  profile: { outline: "person-outline", fill: "person" },
  user: { outline: "person-outline", fill: "person" },
  users: { outline: "people-outline", fill: "people" },

  // Botanical & Taxonomy
  leaf: { outline: "leaf-outline", fill: "leaf" },
  plant: { outline: "leaf-outline", fill: "leaf" },
  potted_plant: { outline: "leaf-outline", fill: "leaf" },
  flower: { outline: "flower-outline", fill: "flower" },
  cactus: { outline: "leaf-outline", fill: "leaf" },
  tree: { outline: "leaf-outline", fill: "leaf" },
  sun: { outline: "sunny-outline", fill: "sunny" },
  drop: { outline: "water-outline", fill: "water" },
  water: { outline: "water-outline", fill: "water" },
  sprout: { outline: "leaf-outline", fill: "leaf" },
  sparkles: { outline: "sparkles-outline", fill: "sparkles" },
  lightning: { outline: "flash-outline", fill: "flash" },

  // Actions & Controls
  plus: { outline: "add", fill: "add" },
  add: { outline: "add", fill: "add" },
  minus: { outline: "remove", fill: "remove" },
  remove: { outline: "remove", fill: "remove" },
  close: { outline: "close", fill: "close" },
  x: { outline: "close", fill: "close" },
  menu: { outline: "menu-outline", fill: "menu" },
  list: { outline: "list-outline", fill: "list" },
  trash: { outline: "trash-outline", fill: "trash" },
  delete: { outline: "trash-outline", fill: "trash" },
  edit: { outline: "create-outline", fill: "create" },
  pencil: { outline: "pencil-outline", fill: "pencil" },
  share: { outline: "share-social-outline", fill: "share-social" },
  thumbs_up: { outline: "thumbs-up-outline", fill: "thumbs-up" },
  flag: { outline: "flag-outline", fill: "flag" },
  filter: { outline: "options-outline", fill: "options" },
  funnel: { outline: "funnel-outline", fill: "funnel" },
  sort: { outline: "swap-vertical-outline", fill: "swap-vertical" },
  copy: { outline: "copy-outline", fill: "copy" },
  refresh: { outline: "refresh-outline", fill: "refresh" },
  rotate: { outline: "reload-outline", fill: "reload" },
  history: { outline: "time-outline", fill: "time" },
  camera: { outline: "camera-outline", fill: "camera" },
  upload: { outline: "cloud-upload-outline", fill: "cloud-upload" },
  download: { outline: "cloud-download-outline", fill: "cloud-download" },
  external_link: { outline: "open-outline", fill: "open" },
  sliders: { outline: "options-outline", fill: "options" },
  eye: { outline: "eye-outline", fill: "eye" },
  eye_slash: { outline: "eye-off-outline", fill: "eye-off" },
  eye_closed: { outline: "eye-off-outline", fill: "eye-off" },
  check: { outline: "checkmark", fill: "checkmark" },
  arrow_left: { outline: "arrow-back", fill: "arrow-back" },
  arrow_right: { outline: "arrow-forward", fill: "arrow-forward" },
  arrow_up: { outline: "arrow-up", fill: "arrow-up" },
  arrow_down: { outline: "arrow-down", fill: "arrow-down" },
  chevron_left: { outline: "chevron-back", fill: "chevron-back" },
  chevron_right: { outline: "chevron-forward", fill: "chevron-forward" },
  chevron_up: { outline: "chevron-up", fill: "chevron-up" },
  chevron_down: { outline: "chevron-down", fill: "chevron-down" },
  caret_down: { outline: "caret-down", fill: "caret-down" },
  caret_up: { outline: "caret-up", fill: "caret-up" },

  // Commerce & Logistics
  truck: { outline: "bus-outline", fill: "bus" },
  delivery: { outline: "bicycle-outline", fill: "bicycle" },
  box: { outline: "cube-outline", fill: "cube" },
  package: { outline: "cube-outline", fill: "cube" },
  inbox: { outline: "file-tray-outline", fill: "file-tray" },
  return: { outline: "arrow-undo-outline", fill: "arrow-undo" },
  credit_card: { outline: "card-outline", fill: "card" },
  wallet: { outline: "wallet-outline", fill: "wallet" },
  bank: { outline: "business-outline", fill: "business" },
  cash: { outline: "cash-outline", fill: "cash" },
  receipt: { outline: "receipt-outline", fill: "receipt" },
  tag: { outline: "pricetag-outline", fill: "pricetag" },
  discount: { outline: "pricetags-outline", fill: "pricetags" },
  clock: { outline: "time-outline", fill: "time" },
  timer: { outline: "timer-outline", fill: "timer" },
  nursery: { outline: "storefront-outline", fill: "storefront" },
  storefront: { outline: "storefront-outline", fill: "storefront" },
  store: { outline: "storefront-outline", fill: "storefront" },
  star: { outline: "star-outline", fill: "star" },
  star_fill: { outline: "star", fill: "star" },
  shield: { outline: "shield-outline", fill: "shield" },
  shield_check: { outline: "shield-checkmark-outline", fill: "shield-checkmark" },
  verified: { outline: "checkmark-circle-outline", fill: "checkmark-circle" },
  badge_check: { outline: "checkmark-circle-outline", fill: "checkmark-circle" },
  lock: { outline: "lock-closed-outline", fill: "lock-closed" },
  logout: { outline: "log-out-outline", fill: "log-out" },
  login: { outline: "log-in-outline", fill: "log-in" },
  bell: { outline: "notifications-outline", fill: "notifications" },
  bell_ringing: { outline: "notifications-outline", fill: "notifications" },
  notification: { outline: "notifications-outline", fill: "notifications" },
  notifications: { outline: "notifications-outline", fill: "notifications" },
  google: { outline: "logo-google", fill: "logo-google" },
  phone: { outline: "call-outline", fill: "call" },
  mail: { outline: "mail-outline", fill: "mail" },
  location: { outline: "location-outline", fill: "location" },
  map_pin: { outline: "location-outline", fill: "location" },
  navigation: { outline: "navigate-outline", fill: "navigate" },
  compass: { outline: "compass-outline", fill: "compass" },

  // Analytics, Governance & Status Feedback
  dashboard: { outline: "speedometer-outline", fill: "speedometer" },
  analytics: { outline: "stats-chart-outline", fill: "stats-chart" },
  chart: { outline: "bar-chart-outline", fill: "bar-chart" },
  trend_up: { outline: "trending-up-outline", fill: "trending-up" },
  trending_up: { outline: "trending-up-outline", fill: "trending-up" },
  percent: { outline: "calculator-outline", fill: "calculator" },
  close_circle: { outline: "close-circle-outline", fill: "close-circle" },
  save: { outline: "save-outline", fill: "save" },
  calendar: { outline: "calendar-outline", fill: "calendar" },
  award: { outline: "ribbon-outline", fill: "ribbon" },
  pie_chart: { outline: "pie-chart-outline", fill: "pie-chart" },
  inventory: { outline: "archive-outline", fill: "archive" },
  document: { outline: "document-text-outline", fill: "document-text" },
  documents: { outline: "documents-outline", fill: "documents" },
  database: { outline: "server-outline", fill: "server" },
  server: { outline: "server-outline", fill: "server" },
  settings: { outline: "settings-outline", fill: "settings" },
  gavel: { outline: "hammer-outline", fill: "hammer" },
  cpu: { outline: "hardware-chip-outline", fill: "hardware-chip" },
  activity: { outline: "pulse-outline", fill: "pulse" },
  qr_code: { outline: "qr-code-outline", fill: "qr-code" },
  chat: { outline: "chatbubble-ellipses-outline", fill: "chatbubble-ellipses" },
  question: { outline: "help-circle-outline", fill: "help-circle" },
  help: { outline: "help-circle-outline", fill: "help-circle" },
  info: { outline: "information-circle-outline", fill: "information-circle" },
  warning: { outline: "alert-circle-outline", fill: "alert-circle" },
  error: { outline: "alert-circle-outline", fill: "alert-circle" },
  category: { outline: "grid-outline", fill: "grid" },
  layers: { outline: "layers-outline", fill: "layers" },
  hard_drive: { outline: "disc-outline", fill: "disc" },
  user_group: { outline: "people-outline", fill: "people" },
  user_check: { outline: "person-add-outline", fill: "person-add" },
  check_circle: { outline: "checkmark-circle-outline", fill: "checkmark-circle" },
};

/**
 * Universal Floria Mobile / Native Icon component powered by Expo Vector Icons.
 * Ensures fast, hardware-accelerated icon rendering on iOS & Android without DOM SVG conflicts.
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
  if (!Ionicons) {
    return null;
  }

  const mapping = NATIVE_ICON_MAP[name] || { outline: "help-circle-outline", fill: "help-circle" };
  const resolvedWeight = resolveDefaultWeight(name, weight);
  const iconGlyphName = resolvedWeight === "fill" ? mapping.fill : mapping.outline;
  const resolvedSize = resolveIconSize(size);

  return (
    <Ionicons
      name={iconGlyphName}
      size={resolvedSize}
      color={color}
      style={[
        mirrored && { transform: [{ scaleX: -1 }] },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
      {...(rest as any)}
    />
  );
}

export default FloriaIcon;
