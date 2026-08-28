"use client";

import React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Receipt,
  Store as LucideStore,
  User,
  Settings,
  Bell,
  LogOut,
  Search,
  Plus,
  AlertTriangle,
  Check,
  CheckCircle,
  X,
  XCircle,
  Clock,
  Truck,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  UploadCloud,
  FileText,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  MapPin as LucideMapPin,
  Mail as LucideMail,
  Phone as LucidePhone,
  Lock as LucideLock,
} from "lucide-react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
};

export const GridIcon = ({ size = 20, className, ...props }: IconProps) => (
  <LayoutDashboard size={size} className={className} {...props} />
);

export const OrderIcon = ({ size = 20, className, ...props }: IconProps) => (
  <ShoppingBag size={size} className={className} {...props} />
);

export const PackageIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Package size={size} className={className} {...props} />
);

export const InventoryIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <Boxes size={size} className={className} {...props} />;

export const PayoutIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Receipt size={size} className={className} {...props} />
);

export const StoreIcon = ({ size = 20, className, ...props }: IconProps) => (
  <LucideStore size={size} className={className} {...props} />
);

export const Store = StoreIcon;

export const UserIcon = ({ size = 20, className, ...props }: IconProps) => (
  <User size={size} className={className} {...props} />
);

export const SettingsIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Settings size={size} className={className} {...props} />
);

export const BellIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Bell size={size} className={className} {...props} />
);

export const LogoutIcon = ({ size = 20, className, ...props }: IconProps) => (
  <LogOut size={size} className={className} {...props} />
);

export const SearchIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Search size={size} className={className} {...props} />
);

export const PlusIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Plus size={size} className={className} {...props} />
);

export const AlertIcon = ({ size = 20, className, ...props }: IconProps) => (
  <AlertTriangle size={size} className={className} {...props} />
);

export const CheckIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Check size={size} className={className} {...props} />
);

export const CheckCircleIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <CheckCircle size={size} className={className} {...props} />;

export const CloseIcon = ({ size = 20, className, ...props }: IconProps) => (
  <X size={size} className={className} {...props} />
);

export const ClockIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Clock size={size} className={className} {...props} />
);

export const TruckIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Truck size={size} className={className} {...props} />
);

export const ArrowRightIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <ArrowRight size={size} className={className} {...props} />;

export const ArrowLeftIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <ArrowLeft size={size} className={className} {...props} />;

export const ChevronDownIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <ChevronDown size={size} className={className} {...props} />;

export const ChevronRightIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <ChevronRight size={size} className={className} {...props} />;

export const EyeIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Eye size={size} className={className} {...props} />
);

export const EditIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Edit2 size={size} className={className} {...props} />
);

export const DeleteIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Trash2 size={size} className={className} {...props} />
);

export const UploadIcon = ({ size = 20, className, ...props }: IconProps) => (
  <UploadCloud size={size} className={className} {...props} />
);

export const DocumentIcon = ({ size = 20, className, ...props }: IconProps) => (
  <FileText size={size} className={className} {...props} />
);

export const RefreshIcon = ({ size = 20, className, ...props }: IconProps) => (
  <RefreshCw size={size} className={className} {...props} />
);

export const ExternalLinkIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <ExternalLink size={size} className={className} {...props} />;

export const MapPin = ({ size = 20, className, ...props }: IconProps) => (
  <LucideMapPin size={size} className={className} {...props} />
);

export const Mail = ({ size = 20, className, ...props }: IconProps) => (
  <LucideMail size={size} className={className} {...props} />
);

export const Phone = ({ size = 20, className, ...props }: IconProps) => (
  <LucidePhone size={size} className={className} {...props} />
);

export const Lock = ({ size = 20, className, ...props }: IconProps) => (
  <LucideLock size={size} className={className} {...props} />
);
