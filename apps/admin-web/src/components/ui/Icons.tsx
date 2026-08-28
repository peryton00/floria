"use client";

import React from "react";
import {
  LayoutDashboard,
  Users as LucideUsers,
  Store,
  Package,
  Layers,
  ShoppingBag,
  Truck,
  DollarSign,
  FileText,
  Activity,
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
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Filter,
  Lock as LucideLock,
  Mail as LucideMail,
  Phone as LucidePhone,
  MapPin as LucideMapPin,
} from "lucide-react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
};

export const DashboardIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => (
  <LayoutDashboard size={size} className={className} {...props} />
);

export const UsersIcon = ({ size = 20, className, ...props }: IconProps) => (
  <LucideUsers size={size} className={className} {...props} />
);

export const SellersIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Store size={size} className={className} {...props} />
);

export const ProductsIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Package size={size} className={className} {...props} />
);

export const CategoriesIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <Layers size={size} className={className} {...props} />;

export const OrdersIcon = ({ size = 20, className, ...props }: IconProps) => (
  <ShoppingBag size={size} className={className} {...props} />
);

export const LogisticsIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <Truck size={size} className={className} {...props} />;

export const FinanceIcon = ({ size = 20, className, ...props }: IconProps) => (
  <DollarSign size={size} className={className} {...props} />
);

export const AuditIcon = ({ size = 20, className, ...props }: IconProps) => (
  <FileText size={size} className={className} {...props} />
);

export const HealthIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Activity size={size} className={className} {...props} />
);

export const SettingsIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Settings size={size} className={className} {...props} />
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

export const RefreshIcon = ({ size = 20, className, ...props }: IconProps) => (
  <RefreshCw size={size} className={className} {...props} />
);

export const ShieldCheckIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <ShieldCheck size={size} className={className} {...props} />;

export const ShieldAlertIcon = ({
  size = 20,
  className,
  ...props
}: IconProps) => <ShieldAlert size={size} className={className} {...props} />;

export const SlidersIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Sliders size={size} className={className} {...props} />
);

export const FilterIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Filter size={size} className={className} {...props} />
);

export const EyeIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Eye size={size} className={className} {...props} />
);

export const EditIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Edit2 size={size} className={className} {...props} />
);

export const DeleteIcon = ({ size = 20, className, ...props }: IconProps) => (
  <Trash2 size={size} className={className} {...props} />
);

export const Lock = ({ size = 20, className, ...props }: IconProps) => (
  <LucideLock size={size} className={className} {...props} />
);

export const Mail = ({ size = 20, className, ...props }: IconProps) => (
  <LucideMail size={size} className={className} {...props} />
);

export const Phone = ({ size = 20, className, ...props }: IconProps) => (
  <LucidePhone size={size} className={className} {...props} />
);

export const MapPin = ({ size = 20, className, ...props }: IconProps) => (
  <LucideMapPin size={size} className={className} {...props} />
);
