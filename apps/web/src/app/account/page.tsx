"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { useOrders } from "@/lib/contexts/OrderContext";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { AddressModal, AddressItem } from "@/components/ui/AddressModal";
import { ProfileEditModal, UserProfile } from "@/components/ui/ProfileEditModal";
import { useCustomer } from "@/lib/contexts/CustomerContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { api } from "@/lib/api";
import { StarRating } from "@/components/ui/StarRating";
import {
  WishlistIcon,
  BagIcon,
  LeafIcon,
  ShieldIcon,
  UserIcon,
  CheckIcon,
  AlertIcon,
  StarIcon,
} from "@/components/ui/Icons";

export default function AccountPage() {
  const router = useRouter();
  const { orders } = useOrders();
  const { wishlistItems } = useWishlist();
  const {
    profile,
    updateProfile,
    addresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    isAuthenticated,
    isLoading,
  } = useCustomer();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  // Reviews State
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // Toast / Feedback State
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Settings State (Notification & Marketing)
  const [settings, setSettings] = useState({
    orderAlerts: true,
    promotionalEmail: true,
  });

  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("floria_user_settings");
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }

    async function checkProvider() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const provider =
            session.user.app_metadata?.provider ||
            session.user.identities?.[0]?.provider;
          if (provider === "google") {
            setIsGoogleUser(true);
          }
        }
      } catch (e) {
        console.error("Provider check error:", e);
      }
    }

    async function loadReviews() {
      try {
        const res = await api.getMyReviews();
        if (res.data?.reviews) {
          setMyReviews(res.data.reviews);
        }
      } catch (e) {
        console.error("Error loading reviews:", e);
      }
    }

    checkProvider();
    loadReviews();
  }, []);

  const handleSaveReview = async () => {
    if (!editingReview) return;
    setSavingReview(true);
    try {
      const res = await api.updateMyReview(editingReview.id, {
        rating: editRating,
        title: editTitle.trim() || undefined,
        body: editBody.trim() || undefined,
      });

      if (res.success) {
        showToast("success", "Review updated successfully.");
        setEditingReview(null);
        const revRes = await api.getMyReviews();
        if (revRes.data?.reviews) setMyReviews(revRes.data.reviews);
      } else {
        showToast("error", res.error?.message ?? "Failed to update review.");
      }
    } catch {
      showToast("error", "Error updating review.");
    } finally {
      setSavingReview(false);
    }
  };

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete Account Modal State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sign Out Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    updateProfile(newProfile);
    setIsProfileModalOpen(false);
    showToast("success", "Personal details updated successfully.");
  };

  const handleSaveAddress = (addr: AddressItem) => {
    saveAddress(addr);
    setIsAddressModalOpen(false);
    setEditingAddress(null);
    showToast("success", "Delivery address saved.");
  };

  const handleDeleteAddress = (id: string) => {
    deleteAddress(id);
    showToast("success", "Address removed.");
  };

  const handleSetDefaultAddress = (id: string) => {
    setDefaultAddress(id);
    showToast("success", "Default delivery address updated.");
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      localStorage.setItem("floria_user_settings", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
    showToast("success", `${key === "orderAlerts" ? "Order Updates" : "Offers & Tips"} preference saved.`);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setUpdatingPassword(true);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordError(error.message || "Failed to update password.");
      } else {
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        showToast("success", "Password updated successfully in Supabase Security Vault.");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Could not connect to security service.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccountConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm account erasure.');
      return;
    }

    try {
      setDeletingAccount(true);
      const res = await api.deleteAccount();

      if (res.success) {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
        setShowDeleteAccountModal(false);
        router.push("/login?message=account_deleted");
      } else {
        setDeleteError(res.error?.message || "Failed to delete account records.");
      }
    } catch (err: any) {
      setDeleteError(err.message || "Error communicating with server.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      setShowLogoutModal(false);
      router.push("/login");
    } catch (e) {
      console.error("Failed to sign out:", e);
    } finally {
      setSigningOut(false);
    }
  };

  // ── Loading Skeleton State ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <CustomerShell>
        <div className="max-w-screen-xl mx-auto py-8 space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-ink-100/70 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-6">
              <div className="h-44 bg-ink-100/70 rounded-2xl" />
              <div className="h-64 bg-ink-100/70 rounded-2xl" />
            </div>
            <div className="h-96 bg-ink-100/70 rounded-2xl" />
          </div>
        </div>
      </CustomerShell>
    );
  }

  // ── Unauthenticated State ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <CustomerShell>
        <div className="max-w-md mx-auto py-16 px-6 bg-floria-linen rounded-2xl border border-floria-border shadow-sm text-center my-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
            <UserIcon size={32} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 mb-1">Sign in to Access Your Account</h1>
            <p className="text-xs text-ink-500">View orders, manage delivery addresses, and save favorite plants.</p>
          </div>

          <div className="space-y-3">
            <GoogleOAuthButton label="Sign in with Google" />
            
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-floria-border"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-floria-border"></div>
            </div>

            <Link
              href="/login"
              className="w-full h-11 flex items-center justify-center bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors min-h-[44px]"
            >
              Sign In with Email
            </Link>
            <Link
              href="/signup"
              className="w-full h-11 flex items-center justify-center border border-floria-border text-ink-800 hover:bg-floria-soft-sand font-bold text-xs uppercase tracking-wider rounded-xl transition-colors min-h-[44px]"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      {/* Toast Feedback Notification */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-lg text-xs font-bold flex items-center gap-2 transition-all ${
          feedback.type === "success" ? "bg-success-50 border-success-200 text-success-800" : "bg-error-50 border-error-200 text-error-800"
        }`}>
          {feedback.type === "success" ? <CheckIcon size={16} /> : <AlertIcon size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-700 font-medium">My Account</span>
      </nav>

      {/* Page Title */}
      <h1 className="font-serif text-3xl font-bold text-ink-900 mb-6">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* ── LEFT COLUMN: Profile, Addresses, Orders & Wishlist Shortcuts ──── */}
        <div className="space-y-6">

          {/* 1. PERSONAL INFORMATION CARD */}
          <section aria-labelledby="section-profile" className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-floria-border">
              <h2 id="section-profile" className="font-serif text-lg font-bold text-ink-900">
                Personal Information
              </h2>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="text-xs font-bold text-forest-800 hover:text-forest-950 transition-colors"
              >
                Edit Details
              </button>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-forest-100 text-forest-800 font-serif font-bold text-2xl flex items-center justify-center border-2 border-forest-200 flex-shrink-0">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* Profile Details */}
              <div className="space-y-1 min-w-0 flex-1">
                <p className="font-sans text-lg font-bold text-ink-900 truncate">
                  {profile.name || "Customer Account"}
                </p>
                <p className="text-xs text-ink-500 truncate">{profile.email}</p>
                <p className="text-xs text-ink-500 font-medium">
                  {profile.phone || "No phone number added"}
                </p>
              </div>
            </div>

            {/* Role-Based Dashboard Shortcuts */}
            {profile.role === "seller" && (
              <div className="pt-2">
                <div className="p-4 bg-forest-900 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-forest-800">
                  <div>
                    <p className="font-serif font-bold text-sm">Seller Partner Portal</p>
                    <p className="text-xs text-forest-200">Manage your nursery inventory, products &amp; orders</p>
                  </div>
                  <Link
                    href="/seller/dashboard"
                    className="inline-flex items-center justify-center px-4 py-2 bg-white text-forest-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-cream-100 transition-colors shadow-xs shrink-0"
                  >
                    Open Seller Dashboard &rarr;
                  </Link>
                </div>
              </div>
            )}

            {(profile.role === "admin" || profile.role === "super_admin") && (
              <div className="pt-2">
                <div className="p-4 bg-ink-900 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-ink-800">
                  <div>
                    <p className="font-serif font-bold text-sm">Platform Admin Console</p>
                    <p className="text-xs text-ink-300">Access seller approvals, catalog, settings &amp; audit logs</p>
                  </div>
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center justify-center px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs shrink-0"
                  >
                    Open Admin Dashboard &rarr;
                  </Link>
                </div>
              </div>
            )}

            {profile.role === "operations" && (
              <div className="pt-2">
                <div className="p-4 bg-forest-800 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-forest-700">
                  <div>
                    <p className="font-serif font-bold text-sm">Operations &amp; Delivery Portal</p>
                    <p className="text-xs text-forest-200">Manage order pickup, packing &amp; delivery assignments</p>
                  </div>
                  <Link
                    href="/operations"
                    className="inline-flex items-center justify-center px-4 py-2 bg-white text-forest-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-cream-100 transition-colors shadow-xs shrink-0"
                  >
                    Open Operations Portal &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Relocated Sign Out Button inside Personal Information */}
            <div className="pt-3 border-t border-floria-border">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full py-2.5 border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors min-h-[44px]"
              >
                Sign Out
              </button>
            </div>
          </section>

          {/* 2. SAVED ADDRESSES SECTION (Shared with Checkout) */}
          <section aria-labelledby="section-addresses" className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-floria-border mb-4">
              <h2 id="section-addresses" className="font-serif text-lg font-bold text-ink-900">
                Saved Delivery Addresses ({addresses.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
                className="text-xs font-bold text-forest-800 hover:text-forest-950 transition-colors"
              >
                + Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="p-6 text-center bg-floria-soft-sand rounded-xl border border-dashed border-floria-border space-y-2">
                <p className="text-xs font-bold text-ink-700">No saved delivery addresses</p>
                <p className="text-[11px] text-ink-400">Add an address to speed up your checkout process.</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  }}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-lg transition-colors mt-2"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-xl border border-floria-border bg-floria-linen hover:border-forest-400 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm font-bold text-ink-900">{addr.full_name}</span>
                        {addr.is_default && (
                          <span className="text-[10px] font-bold text-forest-800 bg-forest-100 px-1.5 py-0.5 rounded uppercase">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(addr);
                            setIsAddressModalOpen(true);
                          }}
                          className="text-ink-400 hover:text-forest-800 transition-colors"
                        >
                          Edit
                        </button>
                        {!addr.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-ink-400 hover:text-ink-700 transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-ink-300 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-ink-600 space-y-0.5">
                      <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p>{addr.city}, {addr.state} - <span className="font-semibold text-ink-800">{addr.pincode}</span></p>
                      <p className="text-ink-500 font-medium">Phone: {addr.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. QUICK NAVIGATION CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Orders Shortcut */}
            <div className="p-5 bg-floria-linen rounded-2xl border border-floria-border shadow-sm flex flex-col justify-between">
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center">
                    <BagIcon size={20} />
                  </div>
                  <span className="text-xs font-bold text-forest-800 bg-forest-100 px-2 py-0.5 rounded-full">
                    {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-ink-900 text-base">My Orders</h3>
                <p className="text-xs text-ink-500 leading-relaxed">
                  View your order history, track live deliveries, and check nursery status updates.
                </p>
              </div>
              <Link
                href="/orders"
                className="w-full flex items-center justify-center py-2.5 border border-floria-border hover:bg-floria-soft-sand text-ink-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center"
              >
                View Orders &rarr;
              </Link>
            </div>

            {/* Wishlist Shortcut */}
            <div className="p-5 bg-floria-linen rounded-2xl border border-floria-border shadow-sm flex flex-col justify-between">
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                    <WishlistIcon size={20} />
                  </div>
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    {wishlistItems.length} Saved
                  </span>
                </div>
                <h3 className="font-serif font-bold text-ink-900 text-base">Wishlist</h3>
                <p className="text-xs text-ink-500 leading-relaxed">
                  Access your saved favorite plants and move items to your cart anytime.
                </p>
              </div>
              <Link
                href="/wishlist"
                className="w-full flex items-center justify-center py-2.5 border border-floria-border hover:bg-floria-soft-sand text-ink-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center"
              >
                View Wishlist &rarr;
              </Link>
            </div>
          </div>

          {/* 4. MY PRODUCT REVIEWS SECTION (Edit Reviews from Account) */}
          <section aria-labelledby="section-reviews" className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-floria-border mb-4">
              <h2 id="section-reviews" className="font-serif text-lg font-bold text-ink-900">
                My Product Reviews &amp; Ratings ({myReviews.length})
              </h2>
            </div>

            {myReviews.length === 0 ? (
              <div className="p-5 text-center bg-floria-soft-sand rounded-xl border border-dashed border-floria-border space-y-1 font-ui">
                <p className="text-xs font-bold text-ink-700">No product reviews yet</p>
                <p className="text-[11px] text-ink-400">Reviews for delivered products will appear here. You can edit them anytime.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl border border-floria-border bg-floria-linen hover:border-forest-400 transition-all font-ui space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/products/${rev.product?.slug || rev.product_id}`}
                          className="font-sans text-sm font-bold text-ink-900 hover:text-forest-800 transition-colors"
                        >
                          {rev.product?.name || "Product"}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1">
                          <StarRating rating={rev.rating} size="sm" />
                          <span className="text-xs font-bold text-ink-800">{rev.rating}/5</span>
                          <span className="text-[10px] text-forest-800 bg-forest-100 px-1.5 py-0.5 rounded border border-forest-200 font-semibold ml-1">
                            Verified Purchase
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReview(rev);
                          setEditRating(rev.rating);
                          setEditTitle(rev.title || "");
                          setEditBody(rev.body || "");
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-forest-800 hover:text-forest-950 bg-forest-100 hover:bg-forest-200 rounded-lg transition-colors border border-forest-200 flex-shrink-0"
                      >
                        Edit Review
                      </button>
                    </div>

                    {rev.title && <p className="text-xs font-bold text-ink-800">{rev.title}</p>}
                    {rev.body && <p className="text-xs text-ink-600 leading-relaxed">{rev.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT COLUMN: Settings, Help & Logout ──────────────────────────── */}
        <div className="space-y-6">

          {/* 4. ACCOUNT SETTINGS SECTION */}
          <section aria-labelledby="section-settings" className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm">
            <h2 id="section-settings" className="font-serif text-lg font-bold text-ink-900 pb-3 border-b border-floria-border mb-4">
              Preferences &amp; Settings
            </h2>

            <div className="space-y-4">
              {/* Order Status Alerts Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-ink-900">Order Updates</p>
                  <p className="text-[11px] text-ink-400">Receive SMS &amp; email delivery notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting("orderAlerts")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.orderAlerts ? "bg-forest-800 justify-end" : "bg-floria-sand justify-start"
                  }`}
                  aria-label="Toggle Order Updates"
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Marketing Preferences */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-floria-border">
                <div>
                  <p className="text-xs font-bold text-ink-900">Offers &amp; Plant Care Tips</p>
                  <p className="text-[11px] text-ink-400">Seasonal care tips and nursery discounts</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting("promotionalEmail")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.promotionalEmail ? "bg-forest-800 justify-end" : "bg-floria-sand justify-start"
                  }`}
                  aria-label="Toggle Offers and Care Tips"
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Password & Security Button (Only for email/password users; hidden for Google OAuth users) */}
              {!isGoogleUser && (
                <div className="pt-2 border-t border-floria-border">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordError(null);
                      setNewPassword("");
                      setConfirmPassword("");
                      setShowPasswordModal(true);
                    }}
                    className="w-full flex items-center justify-between text-xs font-bold text-ink-800 hover:text-forest-800 py-1 transition-colors text-left"
                  >
                    <span>Password &amp; Security</span>
                    <span className="text-ink-400">&rarr;</span>
                  </button>
                </div>
              )}

              {/* Delete Account Button */}
              <div className="pt-2 border-t border-floria-border">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteConfirmationText("");
                    setShowDeleteAccountModal(true);
                  }}
                  className="w-full flex items-center justify-between text-xs font-bold text-red-600 hover:text-red-800 py-1 transition-colors text-left"
                >
                  <span>Delete Account</span>
                  <span className="text-red-400">&rarr;</span>
                </button>
              </div>
            </div>
          </section>

          {/* 5. HELP & SUPPORT BANNER */}
          <div className="p-6 bg-floria-soft-sand rounded-2xl border border-floria-border shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <LeafIcon size={18} className="text-forest-700" />
              <h3 className="font-serif font-bold text-ink-900 text-base">Help &amp; Support</h3>
            </div>
            <p className="text-xs text-ink-500 leading-relaxed">
              Have questions about multi-nursery orders, delivery policies, or plant guarantees?
            </p>
            <Link
              href="/help"
              className="inline-flex items-center justify-center w-full py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {/* 1. Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        initialProfile={profile}
      />

      {/* 2. Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        initialAddress={editingAddress}
      />

      {/* 3. Password & Security Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-floria-linen rounded-2xl p-6 max-w-md w-full border border-floria-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-floria-border pb-3">
              <div className="flex items-center gap-2 text-forest-700">
                <ShieldIcon size={20} />
                <h3 className="font-serif font-bold text-ink-900 text-base">Password &amp; Security</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-ink-400 hover:text-ink-900 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-500">
              Update your account authentication password. This will update your encrypted credentials stored in Supabase Auth.
            </p>

            {passwordError && (
              <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-xs text-error-700 flex items-start gap-2">
                <AlertIcon size={16} className="mt-0.5 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 border border-floria-border text-ink-700 font-bold text-xs uppercase rounded-xl hover:bg-floria-soft-sand transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="flex-1 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase rounded-xl transition-colors disabled:opacity-50"
                >
                  {updatingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Real Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-floria-linen rounded-2xl p-6 max-w-sm w-full border border-floria-border text-center shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-floria-soft-sand text-ink-700 flex items-center justify-center mx-auto">
              <UserIcon size={24} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-ink-900 text-base">Sign Out of Floria</h3>
              <p className="text-xs text-ink-500 mt-1">
                Are you sure you want to sign out? Your session will be invalidated across all browser tabs.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 border border-floria-border text-ink-700 font-bold text-xs uppercase rounded-xl hover:bg-floria-soft-sand"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase rounded-xl disabled:opacity-50"
              >
                {signingOut ? "Signing Out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-floria-linen rounded-2xl p-6 max-w-md w-full border border-floria-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-floria-border pb-3">
              <h3 className="font-serif font-bold text-red-700 text-base">Delete Account Permanently</h3>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="text-ink-400 hover:text-ink-900 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-600 leading-relaxed">
              This action is permanent and cannot be undone. All of your personal profile details, saved delivery addresses, cart items, and wishlist preferences will be wiped from Floria.
            </p>

            {deleteError && (
              <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-xs text-error-700 flex items-start gap-2">
                <AlertIcon size={16} className="mt-0.5 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccountConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Type <strong className="text-red-700">DELETE</strong> to confirm *
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder='Type "DELETE"'
                  className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="flex-1 py-2.5 border border-floria-border text-ink-700 font-bold text-xs uppercase rounded-xl hover:bg-floria-soft-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount || deleteConfirmationText.trim().toUpperCase() !== "DELETE"}
                  className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase rounded-xl disabled:opacity-50 transition-colors"
                >
                  {deletingAccount ? "Deleting Account..." : "Confirm Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs">
          <div className="bg-floria-linen rounded-2xl border border-floria-border shadow-xl max-w-md w-full p-6 space-y-4 font-ui">
            <div className="flex items-center justify-between pb-3 border-b border-floria-border">
              <h3 className="font-serif font-bold text-lg text-ink-900">Edit Your Review</h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="text-ink-400 hover:text-ink-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-ink-800">{editingReview.product?.name || "Product"}</p>

              <div>
                <label className="block text-xs font-bold uppercase text-ink-600 mb-1">Rating</label>
                <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="transition-transform hover:scale-110 focus:outline-none rounded"
                    >
                      <StarIcon
                        size={24}
                        className={star <= editRating ? "text-amber-400 fill-amber-400" : "text-ink-200"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-ink-600 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={120}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-ink-600 mb-1">Review Body (optional)</label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-floria-border">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingReview}
                onClick={handleSaveReview}
                className="px-4 py-2 text-xs font-bold bg-forest-800 hover:bg-forest-900 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {savingReview ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerShell>
  );
}
