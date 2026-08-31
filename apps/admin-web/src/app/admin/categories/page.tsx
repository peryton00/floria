"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { useToast } from "@/lib/contexts/ToastContext";
import { TableSkeleton } from "@/components/ui/loading";
import { MediaUploader } from "@/components/media/MediaUploader";
import { CloseIcon } from "@/components/ui/Icons";

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

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
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
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

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setDisplayOrder(1);
    setBannerUrl("");
    setAssetId("");
    setEditingCategory(null);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Category Management</h1>
            <p className="text-xs text-ink-400 mt-0.5">Organize plant and garden catalog taxonomies and display order.</p>
          </div>

          <button
            type="button"
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            + Create New Category
          </button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Category Cards Layout Grid */}
        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">No categories found in system.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => {
              const catImg = c.banner_url || c.image_url;
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-ink-200 transition-colors"
                >
                  <div className="flex items-start justify-between min-w-0 gap-3">
                    {catImg ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-ink-100 relative flex-shrink-0 bg-cream-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={catImg} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-dashed border-ink-200 flex items-center justify-center text-[10px] text-ink-400 font-bold bg-cream-50 flex-shrink-0">
                        No Img
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink-900 leading-tight">{c.name}</p>
                      <p className="text-[10px] text-ink-400 font-mono mt-0.5 truncate">Slug: {c.slug}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${c.is_active ? "bg-success-50 text-success-700 border-success-100" : "bg-ink-50 text-ink-500 border-ink-100"}`}>
                      {c.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-ink-550 leading-relaxed min-h-[36px] line-clamp-2">{c.description || "No description provided."}</p>
                    <div className="flex justify-between text-[10px] font-mono text-ink-400">
                      <span>Position: {c.display_order ?? 0}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-ink-50 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className="px-2.5 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 font-bold text-[9px] uppercase tracking-wider text-ink-700 transition-colors"
                    >
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="px-2.5 py-1 rounded-lg bg-forest-50 text-forest-700 hover:bg-forest-100 font-bold text-[9px] uppercase tracking-wider transition-colors"
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create or Edit Category */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-ink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-ink-900">
                  {editingCategory ? "Edit Category Details" : "Create New Category"}
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="text-ink-400 hover:text-ink-900 transition-colors p-1"
                  aria-label="Close modal"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Rare Succulents"
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    URL Slug (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="rare-succulents"
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description for customer category page..."
                    className="w-full p-3 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Display Order Position
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                  />
                </div>

                {/* Category Banner Media Uploader */}
                <div className="pt-2 border-t border-ink-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Category WebP Banner Image
                  </label>
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

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Save Category
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider hover:bg-cream-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
