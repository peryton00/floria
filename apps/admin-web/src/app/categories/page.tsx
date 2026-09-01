"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { useToast } from "@/lib/contexts/ToastContext";
import { TableSkeleton } from "@/components/ui/loading";
import { MediaUploader } from "@/components/media/MediaUploader";
import {
  CloseIcon,
  SearchIcon,
  EditIcon,
  CopyIcon,
  CheckIcon,
  GridIcon,
  LeafIcon,
  RefreshIcon,
} from "@/components/ui/Icons";

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
  const [sortBy, setSortBy] = useState<"ORDER_ASC" | "ORDER_DESC" | "NAME_ASC">("ORDER_ASC");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [bannerUrl, setBannerUrl] = useState("");
  const [assetId, setAssetId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      } else {
        setError(res.error?.message || "Failed to load categories");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || "");
    setSlug(cat.slug || "");
    setDescription(cat.description || "");
    setDisplayOrder(cat.display_order ?? 1);
    setBannerUrl(cat.image_url || cat.banner_url || "");
    setAssetId(cat.banner_asset_id || cat.asset_id || "");
    setShowCreateModal(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      let res;
      const imagePayload: any = {
        name,
        slug,
        description,
        display_order: displayOrder,
      };

      if (bannerUrl) {
        imagePayload.image_url = bannerUrl;
      }
      if (assetId) {
        imagePayload.banner_asset_id = assetId;
      }

      if (editingCategory) {
        res = await api.updateAdminCategory(editingCategory.id, imagePayload);
      } else {
        res = await api.createAdminCategory(imagePayload);
      }

      if (res.success) {
        toast.success(
          editingCategory ? "Category updated" : "Category created",
          `Category '${name}' was saved successfully.`
        );
        await fetchCategories();
        setShowCreateModal(false);
        resetForm();
      } else {
        toast.error("Failed to save category", res.error?.message || "Operation failed");
      }
    } catch (e: any) {
      toast.error("Failed to save category", e.message || "Error saving category");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (cat: any) => {
    if (cat.is_active) {
      const countRes = await api.getCategoryProductsCount(cat.id);
      const activeCount = countRes.data?.activeProductsCount || 0;
      if (activeCount > 0) {
        const confirmDisable = confirm(
          `Warning: Category '${cat.name}' has ${activeCount} active product listings assigned to it.\nDeactivating this category will hide these products from storefront search filters.\n\nDo you wish to proceed?`
        );
        if (!confirmDisable) return;
      }
    }

    try {
      const res = await api.updateAdminCategory(cat.id, { is_active: !cat.is_active });
      if (res.success) {
        toast.success(
          cat.is_active ? "Category deactivated" : "Category activated",
          `Category '${cat.name}' status was updated.`
        );
        await fetchCategories();
      } else {
        toast.error("Failed to update status", res.error?.message || "Operation failed");
      }
    } catch (e: any) {
      toast.error("Failed to update status", e.message || "Error updating category");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSlug(id);
      setTimeout(() => setCopiedSlug(null), 2000);
      toast.success("Slug Copied", `Copied "${text}" to clipboard.`);
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setDisplayOrder(1);
    setBannerUrl("");
    setAssetId("");
    setEditingCategory(null);
  };

  // Metrics calculation
  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.is_active).length;
  const disabledCount = totalCount - activeCount;
  const bannerCoverage = totalCount > 0
    ? Math.round((categories.filter((c) => c.banner_url || c.image_url).length / totalCount) * 100)
    : 0;

  // Filtered and Sorted Categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        const matchesSearch =
          cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (statusFilter === "ACTIVE") return cat.is_active;
        if (statusFilter === "DISABLED") return !cat.is_active;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "ORDER_ASC") return (a.display_order ?? 0) - (b.display_order ?? 0);
        if (sortBy === "ORDER_DESC") return (b.display_order ?? 0) - (a.display_order ?? 0);
        if (sortBy === "NAME_ASC") return (a.name || "").localeCompare(b.name || "");
        return 0;
      });
  }, [categories, searchQuery, statusFilter, sortBy]);

  return (
    <AdminShell>
      <div className="space-y-8 pb-16 max-w-7xl mx-auto">
        {/* Top Hero & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-cream-300/60">
          <div className="space-y-2">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/[0.04] border border-forest-900/10 text-forest-800 text-[10px] font-mono font-medium tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Taxonomy Architecture
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-ink-900 leading-none">
              Category Management
            </h1>
            <p className="text-xs sm:text-sm text-ink-600 max-w-xl leading-relaxed">
              Curate and order botanical catalog taxonomies, assign high-fidelity WebP imagery, and configure customer discovery routes.
            </p>
          </div>

          {/* Primary CTA - Nested Island Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchCategories}
              className="p-3 rounded-full bg-white border border-cream-400/60 text-ink-600 hover:text-ink-900 hover:bg-cream-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96]"
              title="Refresh categories"
            >
              <RefreshIcon size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="group relative inline-flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-forest-800 text-white font-medium text-xs tracking-wide shadow-[0_4px_16px_-2px_rgba(30,58,43,0.25)] hover:bg-forest-900 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <span>Create New Category</span>
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/90 group-hover:bg-white/25 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                +
              </span>
            </button>
          </div>
        </div>

        {/* Analytics & Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-1.5 rounded-2xl bg-cream-200/60 border border-cream-400/40">
            <div className="p-3.5 rounded-[calc(1rem-2px)] bg-white/80 border border-white flex flex-col justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-ink-500 uppercase">Total Taxa</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-2xl font-semibold text-ink-900">{totalCount}</span>
                <span className="text-[10px] text-ink-400">nodes</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-2xl bg-cream-200/60 border border-cream-400/40">
            <div className="p-3.5 rounded-[calc(1rem-2px)] bg-white/80 border border-white flex flex-col justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-emerald-700 uppercase">Active Live</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-2xl font-semibold text-emerald-800">{activeCount}</span>
                <span className="text-[10px] text-emerald-600">visible</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-2xl bg-cream-200/60 border border-cream-400/40">
            <div className="p-3.5 rounded-[calc(1rem-2px)] bg-white/80 border border-white flex flex-col justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-terracotta-700 uppercase">Disabled</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-2xl font-semibold text-terracotta-800">{disabledCount}</span>
                <span className="text-[10px] text-terracotta-600">hidden</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-2xl bg-cream-200/60 border border-cream-400/40">
            <div className="p-3.5 rounded-[calc(1rem-2px)] bg-white/80 border border-white flex flex-col justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-ink-500 uppercase">Visual Assets</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-2xl font-semibold text-ink-900">{bannerCoverage}%</span>
                <span className="text-[10px] text-ink-400">media sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Control Bar */}
        <div className="p-2 rounded-2xl bg-cream-200/60 border border-cream-400/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <SearchIcon
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category by name, slug, or keywords..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-cream-400/70 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-0.5"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>

          {/* Status & Sort Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Status Pills */}
            <div className="p-1 rounded-xl bg-cream-300/60 border border-cream-400/40 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium tracking-wide transition-all ${
                  statusFilter === "ALL"
                    ? "bg-white text-ink-900 shadow-xs font-semibold"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium tracking-wide transition-all ${
                  statusFilter === "ACTIVE"
                    ? "bg-white text-emerald-800 shadow-xs font-semibold"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DISABLED")}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium tracking-wide transition-all ${
                  statusFilter === "DISABLED"
                    ? "bg-white text-terracotta-800 shadow-xs font-semibold"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                Disabled ({disabledCount})
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-white border border-cream-400/70 text-[11px] text-ink-700 focus:outline-none focus:border-forest-700/60 cursor-pointer shadow-xs"
            >
              <option value="ORDER_ASC">Position: Low to High</option>
              <option value="ORDER_DESC">Position: High to Low</option>
              <option value="NAME_ASC">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-error-50 border border-error-100 text-xs text-error-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-error-600 hover:text-error-900 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Category Cards Layout Grid */}
        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : filteredCategories.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-cream-100 border border-dashed border-cream-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream-200 text-ink-400 flex items-center justify-center mx-auto">
              <LeafIcon size={24} />
            </div>
            <h3 className="font-serif text-lg font-medium text-ink-800">No matching categories found</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Try adjusting your search query or status filter, or create a brand new botanical taxonomy category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="inline-block mt-2 px-4 py-1.5 rounded-full bg-white border border-cream-300 text-xs text-ink-700 font-medium hover:bg-cream-50"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((c) => {
              const catImg = c.banner_url || c.image_url;
              const isCopied = copiedSlug === c.id;

              return (
                /* Doppelrand (Double-Bezel) Outer Enclosure */
                <div
                  key={c.id}
                  className="group relative p-1.5 rounded-[1.75rem] bg-cream-200/70 border border-cream-400/50 shadow-[0_2px_12px_-2px_rgba(30,58,43,0.04)] hover:border-forest-700/25 hover:bg-cream-300/70 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_16px_36px_-8px_rgba(30,58,43,0.08)] flex flex-col justify-between"
                >
                  {/* Inner Content Core */}
                  <div className="p-4 sm:p-5 rounded-[calc(1.75rem-0.375rem)] bg-white border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(30,58,43,0.03)] flex flex-col justify-between h-full space-y-4">
                    
                    {/* Panoramic Media Showcase */}
                    <div className="relative h-36 w-full rounded-xl overflow-hidden bg-gradient-to-br from-cream-100 to-cream-200 border border-cream-300/40 shadow-inner flex-shrink-0 group/img">
                      {catImg ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={catImg}
                          alt={c.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-ink-400 gap-1 bg-cream-100">
                          <LeafIcon size={24} className="opacity-40" />
                          <span className="text-[10px] font-mono font-medium tracking-wider uppercase opacity-60">No Banner</span>
                        </div>
                      )}

                      {/* Optical Gradient Scrim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                      {/* Top-Left Floating Badge: Position */}
                      <div className="absolute top-2.5 left-2.5 backdrop-blur-md bg-black/40 text-white/95 font-mono text-[9px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full border border-white/20 shadow-xs">
                        POS #{String(c.display_order ?? 0).padStart(2, "0")}
                      </div>

                      {/* Top-Right Floating Status Pill */}
                      <div className="absolute top-2.5 right-2.5">
                        <span
                          className={`backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border flex items-center gap-1.5 shadow-xs ${
                            c.is_active
                              ? "bg-emerald-950/50 text-emerald-300 border-emerald-400/30"
                              : "bg-ink-950/50 text-ink-300 border-ink-400/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.is_active ? "bg-emerald-400 animate-pulse" : "bg-ink-400"
                            }`}
                          />
                          {c.is_active ? "Active" : "Draft"}
                        </span>
                      </div>

                      {/* Bottom-left quick title overlay on image */}
                      <div className="absolute bottom-2.5 left-3 right-3 text-white">
                        <p className="font-serif text-base font-medium leading-snug drop-shadow-sm truncate">
                          {c.name}
                        </p>
                      </div>
                    </div>

                    {/* Metadata & Description */}
                    <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                      {/* Slug Interactive Capsule */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(c.slug, c.id)}
                          className="group/slug inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cream-100/90 hover:bg-cream-200/90 border border-cream-300/60 font-mono text-[10px] text-ink-600 transition-colors text-left max-w-full truncate"
                          title="Click to copy slug"
                        >
                          <span className="text-ink-400 font-sans text-[9px] uppercase font-bold tracking-wider">Slug:</span>
                          <span className="truncate">{c.slug}</span>
                          {isCopied ? (
                            <CheckIcon size={12} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <CopyIcon size={12} className="text-ink-400 group-hover/slug:text-ink-700 flex-shrink-0" />
                          )}
                        </button>

                        <span className="text-[10px] font-mono text-ink-400 tracking-wide">
                          ID: {c.id?.slice(0, 6)}…
                        </span>
                      </div>

                      {/* Description Body */}
                      <p className="text-ink-600 text-xs leading-relaxed line-clamp-2 min-h-[34px] font-sans">
                        {c.description || "No botanical description provided for this catalog taxon."}
                      </p>
                    </div>

                    {/* Card Action Footer */}
                    <div className="pt-3 border-t border-cream-200/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`px-3 py-1.5 rounded-xl font-medium text-[10px] uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                          c.is_active
                            ? "border border-cream-400/80 hover:bg-terracotta-50 text-ink-700 hover:text-terracotta-700 hover:border-terracotta-200"
                            : "border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>

                      {/* Edit Details Island Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="group/btn relative inline-flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-forest-800 hover:bg-forest-900 text-white font-medium text-[10px] uppercase tracking-wider shadow-xs transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                      >
                        <span>Edit Details</span>
                        <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-white/90 group-hover/btn:bg-white/25 group-hover/btn:rotate-12 transition-all">
                          <EditIcon size={11} />
                        </span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create or Edit Category */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Modal Double-Bezel Container */}
            <div className="p-1.5 rounded-[2rem] bg-cream-200/90 border border-white/60 shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-white p-6 sm:p-7 space-y-5 max-h-[85vh] overflow-y-auto">
                
                {/* Modal Header */}
                <div className="flex justify-between items-start border-b border-cream-200/80 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-forest-700 font-mono text-[9px] uppercase tracking-[0.2em] font-semibold mb-1">
                      <GridIcon size={12} />
                      {editingCategory ? "Taxon Mutation" : "New Node Registry"}
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-medium text-ink-900">
                      {editingCategory ? "Edit Category Details" : "Create New Category"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="p-2 rounded-full hover:bg-cream-100 text-ink-400 hover:text-ink-900 transition-colors"
                    aria-label="Close modal"
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>

                {/* Form Controls */}
                <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                      Category Name <span className="text-terracotta-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Rare Tropical Aroids"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-cream-400/80 text-xs text-ink-900 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 transition-all placeholder:text-ink-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                      URL Slug (Unique Key) <span className="text-terracotta-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="rare-tropical-aroids"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-cream-400/80 text-xs font-mono text-ink-900 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 transition-all placeholder:text-ink-400"
                    />
                    <p className="text-[10px] text-ink-400 font-sans">
                      Used for SEO routing: <span className="font-mono text-ink-600">/categories/{slug || "slug"}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Botanical descriptions, habitat highlights, and customer care taxonomy details..."
                      className="w-full p-3.5 rounded-xl border border-cream-400/80 text-xs text-ink-900 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 transition-all placeholder:text-ink-400 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                      Display Order Position
                    </label>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-cream-400/80 text-xs text-ink-900 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 transition-all"
                    />
                  </div>

                  {/* Category Banner Media Uploader */}
                  <div className="pt-3 border-t border-cream-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                        Category Banner Media Asset
                      </label>
                      <span className="text-[10px] font-mono text-forest-700 bg-forest-50 px-2 py-0.5 rounded">
                        WebP Optimized
                      </span>
                    </div>

                    <MediaUploader
                      profile="CATEGORY"
                      currentUrl={bannerUrl || undefined}
                      onUploadSuccess={async (res) => {
                        setBannerUrl(res.url);
                        setAssetId(res.assetId);
                        if (editingCategory) {
                          try {
                            setActionLoading(true);
                            const updateRes = await api.updateCategoryBanner(editingCategory.id, res.assetId);
                            if (updateRes.success) {
                              toast.success("Category banner attached", "Category image updated successfully.");
                              fetchCategories();
                            } else {
                              setError(updateRes.error?.message || "Failed to update category banner");
                            }
                          } catch (err: any) {
                            setError(err.message || "Failed to update category banner");
                          } finally {
                            setActionLoading(false);
                          }
                        }
                      }}
                      label="Upload WebP Category Banner"
                    />
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-cream-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1 py-2.5 rounded-full border border-cream-400 text-ink-700 font-medium text-xs uppercase tracking-wider hover:bg-cream-100 transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-full bg-forest-800 hover:bg-forest-900 text-white font-medium text-xs uppercase tracking-wider shadow-[0_4px_12px_-2px_rgba(30,58,43,0.2)] transition-all duration-300 disabled:opacity-50"
                    >
                      {actionLoading ? "Saving..." : editingCategory ? "Save Changes" : "Create Node"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
