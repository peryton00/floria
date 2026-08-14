"use client";

import { useState, useEffect } from "react";
import { LockIcon } from "@/components/ui/Icons";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  initialProfile: UserProfile;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}: ProfileEditModalProps) {
  const [formData, setFormData] = useState<UserProfile>(initialProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialProfile) {
      setFormData(initialProfile);
    }
    setErrors({});
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-ink-100">
        <div className="flex items-center justify-between pb-4 border-b border-ink-100 mb-4">
          <h2 id="profile-modal-title" className="font-serif text-lg font-bold text-ink-900">
            Edit Personal Information
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-ink-400 hover:text-ink-900 text-lg font-bold p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Option */}
          <div className="flex items-center gap-4 py-2">
            <div className="w-14 h-14 rounded-full bg-forest-100 text-forest-800 font-serif font-bold text-xl flex items-center justify-center border border-forest-200">
              {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900">Customer Avatar</p>
              <p className="text-[11px] text-ink-400">Generated from your profile name</p>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="edit-name" className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
            {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Email Address (Immutable / Locked) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="edit-email" className="block text-xs font-bold text-ink-700 uppercase tracking-wider">
                Email Address (Primary Account Key)
              </label>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-ink-400">
                <LockIcon size={12} />
                <span>Locked</span>
              </div>
            </div>
            <input
              id="edit-email"
              type="email"
              disabled
              readOnly
              value={formData.email}
              className="w-full px-3 py-2 text-xs rounded-xl border border-ink-100 bg-ink-50 text-ink-500 cursor-not-allowed select-none"
            />
            <p className="text-[10px] text-ink-400 mt-1">
              Email address cannot be changed after account creation.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="edit-phone" className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
            {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-ink-200 hover:border-ink-400 text-ink-700 font-bold text-xs uppercase rounded-xl transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700 min-h-[44px]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
