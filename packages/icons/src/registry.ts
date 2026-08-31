// Floria Icon System — Canonical Phosphor Registry & Resolver
import {
  FloriaIconName,
  FloriaIconSize,
  FloriaIconWeight,
  ICON_SIZE_MAP,
} from "./types.js";

/**
 * Maps semantic Floria icon names to their canonical Phosphor component identifier.
 */
export const PHOSPHOR_ICON_NAME_MAP: Record<FloriaIconName, string> = {
  // Navigation & Discovery
  home: "House",
  search: "MagnifyingGlass",
  explore: "Compass",
  categories: "SquaresFour",
  cart: "ShoppingCart",
  bag: "ShoppingBag",
  favorite: "Heart",
  wishlist: "Heart",
  heart: "Heart",
  orders: "Receipt",
  profile: "User",
  user: "User",
  users: "UsersThree",

  // Botanical & Taxonomy
  leaf: "Leaf",
  plant: "Plant",
  potted_plant: "PottedPlant",
  flower: "Flower",
  cactus: "Cactus",
  tree: "Tree",
  sun: "Sun",
  drop: "Drop",
  water: "Drop",
  sprout: "Plant",
  sparkles: "Sparkle",
  lightning: "Lightning",

  // Actions & Controls
  plus: "Plus",
  add: "Plus",
  minus: "Minus",
  remove: "Minus",
  close: "X",
  x: "X",
  menu: "List",
  list: "List",
  trash: "Trash",
  delete: "Trash",
  edit: "PencilSimple",
  pencil: "PencilSimple",
  share: "ShareNetwork",
  thumbs_up: "ThumbsUp",
  flag: "Flag",
  filter: "Funnel",
  funnel: "Funnel",
  sort: "SortAscending",
  copy: "Copy",
  refresh: "ArrowsClockwise",
  rotate: "ArrowCounterClockwise",
  history: "ClockCounterClockwise",
  camera: "Camera",
  upload: "UploadSimple",
  download: "DownloadSimple",
  external_link: "ArrowSquareOut",
  sliders: "SlidersHorizontal",
  eye: "Eye",
  eye_slash: "EyeSlash",
  eye_closed: "EyeSlash",
  check: "Check",
  arrow_left: "ArrowLeft",
  arrow_right: "ArrowRight",
  arrow_up: "ArrowUp",
  arrow_down: "ArrowDown",
  chevron_left: "CaretLeft",
  chevron_right: "CaretRight",
  chevron_up: "CaretUp",
  chevron_down: "CaretDown",
  caret_down: "CaretDown",
  caret_up: "CaretUp",

  // Commerce & Logistics
  truck: "Truck",
  delivery: "Truck",
  box: "Package",
  package: "Package",
  inbox: "Package",
  return: "ArrowCounterClockwise",
  credit_card: "CreditCard",
  wallet: "Wallet",
  bank: "Bank",
  cash: "Money",
  receipt: "Receipt",
  tag: "Tag",
  discount: "Percent",
  clock: "Clock",
  timer: "Timer",
  nursery: "Storefront",
  storefront: "Storefront",
  store: "Storefront",
  star: "Star",
  star_fill: "Star",
  shield: "ShieldCheck",
  shield_check: "ShieldCheck",
  verified: "SealCheck",
  badge_check: "SealCheck",
  lock: "Lock",
  logout: "SignOut",
  login: "SignIn",
  bell: "Bell",
  bell_ringing: "BellRinging",
  notification: "Bell",
  notifications: "Bell",
  google: "GoogleLogo",
  phone: "Phone",
  mail: "EnvelopeSimple",
  location: "MapPin",
  map_pin: "MapPin",
  navigation: "NavigationArrow",
  compass: "Compass",

  // Analytics, Governance & Status Feedback
  dashboard: "Gauge",
  analytics: "ChartBar",
  chart: "ChartBar",
  trend_up: "TrendUp",
  trending_up: "TrendUp",
  percent: "Percent",
  close_circle: "XCircle",
  save: "FloppyDisk",
  calendar: "CalendarBlank",
  award: "Award",
  pie_chart: "ChartPie",
  inventory: "Package",
  document: "FileText",
  documents: "FileText",
  database: "Database",
  server: "HardDrives",
  settings: "Gear",
  gavel: "Gavel",
  cpu: "Cpu",
  activity: "Activity",
  qr_code: "QrCode",
  chat: "ChatCircleDots",
  question: "Question",
  help: "Question",
  info: "Info",
  warning: "WarningCircle",
  error: "WarningOctagon",
  category: "SquaresFour",
  layers: "Stack",
  hard_drive: "HardDrive",
  user_group: "UsersThree",
  user_check: "UserCheck",
  check_circle: "CheckCircle",
};

/**
 * Resolves a size token ('xs' | 'sm' | 'md' | 'lg' | 'xl') or pixel number to a numerical pixel value.
 */
export function resolveIconSize(size: FloriaIconSize = "md"): number {
  if (typeof size === "number") return size;
  return ICON_SIZE_MAP[size] || ICON_SIZE_MAP.md;
}

/**
 * Resolves default weight for an icon. By default returns 'regular' unless 'star_fill' is used.
 */
export function resolveDefaultWeight(
  name: FloriaIconName,
  weight?: FloriaIconWeight,
): FloriaIconWeight {
  if (weight) return weight;
  if (name === "star_fill") return "fill";
  return "regular";
}
