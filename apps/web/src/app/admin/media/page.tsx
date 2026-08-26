"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  ImageIcon,
  SearchIcon,
  AlertIcon,
  CheckCircleIcon,
  ShieldIcon,
  ToolsIcon,
  TrashIcon,
  EditIcon,
  CopyIcon,
  EyeIcon,
} from "@/components/ui/Icons";

interface MediaItem {
  id: string;
  is_legacy: boolean;
  original_filename: string;
  media_category: string;
  mime_type: string;
  file_size_bytes: number;
  status: string;
  storage_bucket?: string;
  created_at: string;
  uploader_name?: string;
  seller_name?: string;
  public_url: string;
  variants?: Record<string, string>;
  product_name?: string;
  alt_text?: string;
}

interface StatsData {
  totalAssets: number;
  readyAssets: number;
  totalStorageBytes: number;
  totalStorageMb: number;
}

const CATEGORY_TABS = [
  { id: "ALL", label: "All Media" },
  { id: "PRODUCT", label: "Products" },
  { id: "SELLER_LOGO", label: "Nursery Logos & Banners" },
  { id: "CATEGORY", label: "Category Covers" },
  { id: "USER_AVATAR", label: "User Avatars" },
  { id: "REVIEW_IMAGE", label: "Reviews" },
  { id: "DOCUMENT", label: "Documents" },
  { id: "LEGACY", label: "Legacy Product Images" },
];

export default function AdminMediaPage() {
  const { toast } = useToast();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Multi-Selection State for Mass Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editFilename, setEditFilename] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingItem, setDeletingItem] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadProfile, setUploadProfile] = useState("CATEGORY");
  const [isUploading, setIsUploading] = useState(false);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = (await api.getAdminMedia({
        category: selectedCategory,
        status: selectedStatus,
        search: search.trim() || undefined,
        page,
        limit: 30,
      })) as any;

      if (res.success && res.data) {
        setItems(res.data);
        if (res.stats) setStats(res.stats);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        toast.error("Error", res.error?.message || "Failed to load media assets");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Network error loading media assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus, page]);

  // Multi-select Handlers
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const currentPageIds = items.map((i) => i.id);
    const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    try {
      setIsBulkDeleting(true);
      setBulkDeleteProgress({ current: 0, total: idsToDelete.length });

      let successCount = 0;
      let processedCount = 0;

      // Delete in parallel batches of 3
      for (let i = 0; i < idsToDelete.length; i += 3) {
        const batch = idsToDelete.slice(i, i + 3);
        await Promise.all(
          batch.map(async (id) => {
            try {
              const res = await api.deleteAdminMedia(id);
              if (res.success) successCount++;
            } catch (err) {
              console.warn("Failed deleting item", id, err);
            } finally {
              processedCount++;
              setBulkDeleteProgress({ current: processedCount, total: idsToDelete.length });
            }
          })
        );
      }

      toast.success("Mass Deletion Completed", `Successfully deleted ${successCount} of ${idsToDelete.length} selected assets.`);
      setIsBulkDeleteModalOpen(false);
      clearSelection();
      loadMedia();
    } catch (err: any) {
      toast.error("Mass Deletion Error", err.message || "Failed to process mass deletion");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMedia();
  };

  const handleCopyUrl = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success("Copied", "Image URL copied to clipboard!");
  };

  const openEditModal = (item: MediaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setEditFilename(item.original_filename);
    setEditAltText(item.alt_text || "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      setIsUpdating(true);
      const res = await api.updateAdminMedia(editingItem.id, {
        filename: editFilename,
        altText: editAltText,
      });

      if (res.success) {
        toast.success("Updated", "Image metadata updated successfully");
        setEditingItem(null);
        loadMedia();
      } else {
        toast.error("Update Failed", res.error?.message || "Failed to update image");
      }
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Failed to update image");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteAdminMedia(deletingItem.id);

      if (res.success) {
        toast.success("Deleted", "Image permanently deleted from database and storage");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deletingItem.id);
          return next;
        });
        setDeletingItem(null);
        if (previewItem?.id === deletingItem.id) setPreviewItem(null);
        loadMedia();
      } else {
        toast.error("Delete Failed", res.error?.message || "Failed to delete image");
      }
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Failed to delete image");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadPreviewUrl) {
      toast.error("Missing File", "Please select an image file to upload");
      return;
    }

    try {
      setIsUploading(true);
      const res = await api.uploadAdminMedia({
        filename: uploadFile.name,
        mimeType: uploadFile.type || "image/webp",
        base64Data: uploadPreviewUrl,
        profile: uploadProfile,
      });

      if (res.success) {
        toast.success("Uploaded", "New image uploaded successfully!");
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadPreviewUrl(null);
        loadMedia();
      } else {
        toast.error("Upload Failed", res.error?.message || "Image upload failed");
      }
    } catch (err: any) {
      toast.error("Upload Failed", err.message || "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "PRODUCT":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "SELLER_LOGO":
      case "NURSERY":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "CATEGORY":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "USER_AVATAR":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "REVIEW_IMAGE":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const isPageAllSelected =
    items.length > 0 && items.every((i) => selectedIds.has(i.id));

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2DDD5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#1E3A2B] text-white">
                <ImageIcon size={20} />
              </span>
              <h1 className="font-serif text-2xl font-bold text-[#212529]">
                Media & Image Registry
              </h1>
            </div>
            <p className="text-xs text-[#6C756F] mt-1">
              Inspect, manage, edit metadata, and safely delete all uploaded media assets across Floria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-[#1E3A2B] hover:bg-[#274D39] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-all flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Upload New Media
            </button>
          </div>
        </div>

        {/* KPI Dashboard Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6C756F]">
                  Total Assets
                </span>
                <span className="p-1.5 rounded bg-emerald-50 text-emerald-700">
                  <ImageIcon size={14} />
                </span>
              </div>
              <p className="text-2xl font-bold text-[#212529] mt-2">{stats.totalAssets}</p>
              <p className="text-[11px] text-[#6C756F] mt-0.5">Indexed images & documents</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6C756F]">
                  Ready / Active
                </span>
                <span className="p-1.5 rounded bg-blue-50 text-blue-700">
                  <CheckCircleIcon size={14} />
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">{stats.readyAssets}</p>
              <p className="text-[11px] text-blue-700/70 mt-0.5">Optimized WebP variants</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6C756F]">
                  Storage Footprint
                </span>
                <span className="p-1.5 rounded bg-purple-50 text-purple-700">
                  <ToolsIcon size={14} />
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {stats.totalStorageMb} <span className="text-xs font-normal">MB</span>
              </p>
              <p className="text-[11px] text-purple-700/70 mt-0.5">Supabase Storage object size</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6C756F]">
                  Security Status
                </span>
                <span className="p-1.5 rounded bg-amber-50 text-amber-700">
                  <ShieldIcon size={14} />
                </span>
              </div>
              <p className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1">
                ● Enforced CDN Security
              </p>
              <p className="text-[11px] text-[#6C756F] mt-1">EXIF sanitized & RLS protected</p>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#E2DDD5]">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.id);
                  setPage(1);
                  clearSelection();
                }}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                  selectedCategory === tab.id
                    ? "bg-[#1E3A2B] text-white shadow-xs"
                    : "text-[#6C756F] hover:bg-[#F9F8F3] hover:text-[#212529]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search filename or asset ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-[#F9F8F3] focus:outline-none focus:ring-1 focus:ring-[#1E3A2B]"
              />
              <SearchIcon size={14} className="absolute left-3 top-2.5 text-[#6C756F]" />
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Status Select */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                  clearSelection();
                }}
                className="px-3 py-2 text-xs rounded-lg border border-[#E2DDD5] bg-[#F9F8F3] focus:outline-none focus:ring-1 focus:ring-[#1E3A2B]"
              >
                <option value="ALL">All Statuses</option>
                <option value="READY">Ready</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center border border-[#E2DDD5] rounded-lg overflow-hidden bg-[#F9F8F3]">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "grid" ? "bg-[#1E3A2B] text-white" : "text-[#6C756F] hover:text-[#212529]"
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "table" ? "bg-[#1E3A2B] text-white" : "text-[#6C756F] hover:text-[#212529]"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* BULK SELECTION ACTION TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E2DDD5] bg-cream-50/50 p-2.5 rounded-lg">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-[#212529] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPageAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#E2DDD5] text-[#1E3A2B] focus:ring-[#1E3A2B]"
                />
                Select All on Page ({items.length})
              </label>

              {selectedIds.size > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#1E3A2B] text-white font-mono text-xs font-bold">
                  {selectedIds.size} Selected
                </span>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-[#E2DDD5] rounded-lg"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <TrashIcon size={14} />
                  Delete Selected ({selectedIds.size})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 text-center bg-white rounded-xl border border-[#E2DDD5]">
            <div className="inline-block w-8 h-8 border-3 border-[#1E3A2B] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-[#6C756F] uppercase tracking-wider">
              Fetching Media Assets...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-[#E2DDD5] p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
              <ImageIcon size={24} />
            </div>
            <h3 className="text-sm font-bold text-[#212529]">No Media Assets Found</h3>
            <p className="text-xs text-[#6C756F] max-w-sm mx-auto">
              No images match your active filters ({selectedCategory}, {selectedStatus}). Try clearing your search or upload a new asset.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`bg-white rounded-xl border transition-all flex flex-col group cursor-pointer relative ${
                    isSelected ? "border-[#1E3A2B] ring-2 ring-[#1E3A2B]/20 shadow-md" : "border-[#E2DDD5] hover:shadow-md"
                  }`}
                >
                  {/* Selection Checkbox Pill */}
                  <div className="absolute top-2 right-2 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelect(item.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-[#E2DDD5] text-[#1E3A2B] focus:ring-[#1E3A2B] cursor-pointer"
                    />
                  </div>

                  {/* Thumbnail Preview Box */}
                  <div className="relative aspect-square bg-[#F9F8F3] border-b border-[#E2DDD5] overflow-hidden flex items-center justify-center">
                    <Image
                      src={item.public_url}
                      alt={item.original_filename}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                    {/* Category Pill */}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getCategoryBadgeClass(
                        item.media_category
                      )}`}
                    >
                      {item.media_category}
                    </span>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-[1px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewItem(item);
                        }}
                        title="Preview Image"
                        className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white transition-colors"
                      >
                        <EyeIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openEditModal(item, e)}
                        title="Edit Metadata"
                        className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white transition-colors"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCopyUrl(item.public_url, e)}
                        title="Copy Public URL"
                        className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white transition-colors"
                      >
                        <CopyIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingItem(item);
                        }}
                        title="Delete Asset"
                        className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <p
                        className="text-xs font-bold text-[#212529] truncate"
                        title={item.original_filename}
                      >
                        {item.original_filename}
                      </p>
                      <p className="text-[10px] text-[#6C756F] truncate mt-0.5">
                        {item.seller_name || item.uploader_name || "System"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#6C756F] pt-2 border-t border-[#F9F8F3]">
                      <span className="font-mono">{formatFileSize(item.file_size_bytes)}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F8F3] border-b border-[#E2DDD5] text-[10px] font-mono uppercase tracking-wider text-[#6C756F]">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={isPageAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-[#E2DDD5] text-[#1E3A2B] focus:ring-[#1E3A2B]"
                      />
                    </th>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Filename / Asset ID</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Owner / Seller</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]">
                  {items.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected ? "bg-emerald-50/50" : "hover:bg-[#F9F8F3]/50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4 rounded border-[#E2DDD5] text-[#1E3A2B] focus:ring-[#1E3A2B]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="relative w-10 h-10 rounded border border-[#E2DDD5] bg-[#F9F8F3] overflow-hidden flex-shrink-0 cursor-pointer"
                            onClick={() => setPreviewItem(item)}
                          >
                            <Image
                              src={item.public_url}
                              alt={item.original_filename}
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#212529]">
                          <p className="truncate max-w-xs">{item.original_filename}</p>
                          <p className="font-mono text-[9px] text-[#6C756F] truncate">{item.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getCategoryBadgeClass(
                              item.media_category
                            )}`}
                          >
                            {item.media_category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6C756F]">
                          {item.seller_name || item.uploader_name || "System"}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#6C756F]">
                          {formatFileSize(item.file_size_bytes)}
                        </td>
                        <td className="px-4 py-3 text-[#6C756F]">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => openEditModal(item, e)}
                              title="Edit Metadata"
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                            >
                              <EditIcon size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleCopyUrl(item.public_url, e)}
                              title="Copy URL"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                            >
                              <CopyIcon size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              title="Delete Asset"
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#6C756F]">
              Page <span className="font-bold text-[#212529]">{page}</span> of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  clearSelection();
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-[#E2DDD5] bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  clearSelection();
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-[#E2DDD5] bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW LIGHTBOX MODAL */}
        {previewItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E2DDD5] max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-6 relative">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 font-bold text-sm"
              >
                ✕
              </button>

              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                <Image
                  src={previewItem.public_url}
                  alt={previewItem.original_filename}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-[#212529] text-base">
                  {previewItem.original_filename}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#6C756F]">
                  <div>
                    <span className="font-semibold text-[#212529]">Asset ID:</span> {previewItem.id}
                  </div>
                  <div>
                    <span className="font-semibold text-[#212529]">MIME:</span> {previewItem.mime_type}
                  </div>
                  <div>
                    <span className="font-semibold text-[#212529]">Size:</span> {formatFileSize(previewItem.file_size_bytes)}
                  </div>
                  <div>
                    <span className="font-semibold text-[#212529]">Category:</span> {previewItem.media_category}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2DDD5]">
                <button
                  type="button"
                  onClick={(e) => handleCopyUrl(previewItem.public_url, e)}
                  className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5"
                >
                  <CopyIcon size={14} />
                  Copy URL
                </button>
                <a
                  href={previewItem.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-[#1E3A2B] text-white hover:bg-[#274D39] font-bold text-xs flex items-center gap-1.5"
                >
                  <EyeIcon size={14} />
                  Open Full Resolution
                </a>
              </div>
            </div>
          </div>
        )}

        {/* EDIT METADATA MODAL */}
        {editingItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E2DDD5] max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-gray-100 text-gray-800">
                  <EditIcon size={18} />
                </span>
                <h3 className="font-serif text-lg font-bold text-[#212529]">Edit Image Metadata</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#212529] mb-1">Original Filename</label>
                  <input
                    type="text"
                    value={editFilename}
                    onChange={(e) => setEditFilename(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2DDD5] focus:outline-none focus:ring-1 focus:ring-[#1E3A2B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#212529] mb-1">Alt Text (SEO & Accessibility)</label>
                  <input
                    type="text"
                    placeholder="Descriptive alt text..."
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2DDD5] focus:outline-none focus:ring-1 focus:ring-[#1E3A2B]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DDD5]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg border border-[#E2DDD5] text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-lg bg-[#1E3A2B] hover:bg-[#274D39] text-white text-xs font-bold uppercase tracking-wider"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SINGLE DELETE CONFIRMATION MODAL */}
        {deletingItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-red-200 max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <span className="p-2 rounded-full bg-red-100">
                  <TrashIcon size={20} />
                </span>
                <h3 className="font-serif text-lg font-bold text-red-900">Confirm Asset Deletion</h3>
              </div>

              <p className="text-xs text-gray-700">
                Are you sure you want to permanently delete <span className="font-bold text-gray-900">{deletingItem.original_filename}</span>?
              </p>

              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertIcon size={14} /> Warning:
                </p>
                <p>• Removes file objects permanently from Supabase Storage buckets.</p>
                <p>• Unlinks references from linked products, categories, or nursery profiles.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="px-4 py-2 rounded-lg border border-[#E2DDD5] text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <TrashIcon size={14} />
                  {isDeleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MASS / BULK DELETE CONFIRMATION MODAL */}
        {isBulkDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-red-200 max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <span className="p-2 rounded-full bg-red-100">
                  <TrashIcon size={20} />
                </span>
                <h3 className="font-serif text-lg font-bold text-red-900">
                  {isBulkDeleting ? "Deleting Selected Assets..." : "Mass Delete Confirmation"}
                </h3>
              </div>

              {isBulkDeleting ? (
                /* LIVE VISUAL PROGRESS BAR */
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between text-xs font-bold text-red-900">
                    <span>Deleting assets from database & storage...</span>
                    <span className="font-mono text-red-700 font-bold">
                      {bulkDeleteProgress.total > 0
                        ? Math.round((bulkDeleteProgress.current / bulkDeleteProgress.total) * 100)
                        : 0}%
                    </span>
                  </div>

                  {/* Visual Progress Bar Track & Indicator */}
                  <div className="w-full bg-red-100 rounded-full h-4 overflow-hidden border border-red-200 p-0.5 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-red-600 via-rose-500 to-red-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                      style={{
                        width: `${
                          bulkDeleteProgress.total > 0
                            ? Math.round((bulkDeleteProgress.current / bulkDeleteProgress.total) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-600">
                    <span>Processed: {bulkDeleteProgress.current} / {bulkDeleteProgress.total}</span>
                    <span>Remaining: {bulkDeleteProgress.total - bulkDeleteProgress.current}</span>
                  </div>
                </div>
              ) : (
                /* CONFIRMATION STEP */
                <>
                  <p className="text-xs text-gray-700">
                    Are you sure you want to permanently delete <span className="font-bold text-red-700">{selectedIds.size} selected image assets</span>?
                  </p>

                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertIcon size={14} /> Permanent Action Notice:
                    </p>
                    <p>• All selected images will be removed from database tables.</p>
                    <p>• Associated objects in Supabase Storage buckets will be permanently deleted.</p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkDeleteModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-[#E2DDD5] text-xs font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDeleteConfirm}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                    >
                      <TrashIcon size={14} />
                      Confirm Delete ({selectedIds.size})
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ADMIN UPLOAD MODAL */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E2DDD5] max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#212529]">Upload New Media Asset</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#212529] mb-1">Target Profile / Purpose</label>
                  <select
                    value={uploadProfile}
                    onChange={(e) => setUploadProfile(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2DDD5] focus:outline-none focus:ring-1 focus:ring-[#1E3A2B]"
                  >
                    <option value="CATEGORY">Category Cover Image</option>
                    <option value="PRODUCT">Product Image</option>
                    <option value="NURSERY">Nursery Banner</option>
                    <option value="SELLER_LOGO">Seller / Nursery Logo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#212529] mb-1">Select Image File</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    onChange={handleFileSelect}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1E3A2B] file:text-white hover:file:bg-[#274D39]"
                  />
                </div>

                {uploadPreviewUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-[#E2DDD5] bg-[#F9F8F3]">
                    <Image
                      src={uploadPreviewUrl}
                      alt="Upload Preview"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DDD5]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2DDD5] text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUploading || !uploadFile}
                  onClick={handleUploadSubmit}
                  className="px-4 py-2 rounded-lg bg-[#1E3A2B] hover:bg-[#274D39] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {isUploading ? "Processing & Uploading..." : "Upload Image"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
