"use client";

import { useState, useEffect } from "react";
import { useCustomer } from "@/lib/contexts/CustomerContext";
import { MapPinIcon, CheckIcon, AlertIcon, CloseIcon } from "@/components/ui/Icons";

export interface AddressItem {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string;
  is_default?: boolean;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressItem) => void;
  initialAddress?: AddressItem | null;
}

export function AddressModal({
  isOpen,
  onClose,
  onSave,
  initialAddress,
}: AddressModalProps) {
  const { profile } = useCustomer();

  const [formData, setFormData] = useState<Omit<AddressItem, "id">>({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    instructions: "",
    is_default: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (initialAddress) {
      setFormData({
        full_name: initialAddress.full_name || profile?.name || "",
        phone: initialAddress.phone || profile?.phone || "",
        line1: initialAddress.line1 || "",
        line2: initialAddress.line2 || "",
        city: initialAddress.city || "",
        state: initialAddress.state || "",
        pincode: initialAddress.pincode || "",
        instructions: initialAddress.instructions || "",
        is_default: initialAddress.is_default || false,
      });
    } else {
      setFormData({
        full_name: profile?.name || "",
        phone: profile?.phone || "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        instructions: "",
        is_default: false,
      });
    }
    setErrors({});
    setLocationMessage(null);
  }, [initialAddress, isOpen, profile]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.full_name.trim()) errs.full_name = "Full name is required";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    if (!formData.line1.trim()) errs.line1 = "Address line 1 is required";
    if (!formData.city.trim()) errs.city = "City is required";
    if (!formData.state.trim()) errs.state = "State is required";
    if (!formData.pincode.trim()) errs.pincode = "PIN code is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage({
        type: "error",
        text: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setIsLocating(true);
    setLocationMessage(null);

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            );
            const data = await res.json();

            if (data && data.address) {
              const addr = data.address;
              const road =
                addr.road ||
                addr.street ||
                addr.neighbourhood ||
                addr.suburb ||
                "";
              const houseNumber = addr.house_number || addr.building || "";
              const line1Val =
                [houseNumber, road].filter(Boolean).join(", ") ||
                addr.display_name?.split(",")[0] ||
                "";
              const line2Val =
                addr.suburb || addr.neighbourhood || addr.residential || "";
              const cityVal =
                addr.city || addr.town || addr.village || addr.county || "";
              const stateVal = addr.state || "";
              const pincodeVal = addr.postcode || "";

              setFormData((prev) => ({
                ...prev,
                line1: line1Val || prev.line1,
                line2: line2Val || prev.line2,
                city: cityVal || prev.city,
                state: stateVal || prev.state,
                pincode: pincodeVal || prev.pincode,
              }));

              setLocationMessage({
                type: "success",
                text: "Location detected and address fields filled!",
              });
            } else {
              setLocationMessage({
                type: "error",
                text: "Unable to resolve street address for your coordinates.",
              });
            }
          } catch {
            setLocationMessage({
              type: "error",
              text: "Failed to reverse geocode device location.",
            });
          } finally {
            setIsLocating(false);
          }
        },
        (err) => {
          setIsLocating(false);
          if (err.code === err.PERMISSION_DENIED) {
            setLocationMessage({
              type: "error",
              text: "Location permission denied. Please enable GPS or enter manually.",
            });
          } else {
            setLocationMessage({
              type: "error",
              text: "Could not detect location. Please check device settings.",
            });
          }
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } catch {
      setIsLocating(false);
      setLocationMessage({
        type: "error",
        text: "Geolocation is blocked by your browser's permissions policy.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: initialAddress ? initialAddress.id : `addr_${Date.now()}`,
      ...formData,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
    >
      <div className="bg-floria-linen rounded-2xl shadow-xl max-w-lg w-full p-6 border border-floria-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-floria-border mb-4">
          <h2
            id="address-modal-title"
            className="font-serif text-lg font-bold text-ink-900"
          >
            {initialAddress
              ? "Edit Delivery Address"
              : "Add New Delivery Address"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-ink-400 hover:text-ink-900 p-1 rounded transition-colors"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Automatic Location Fetcher Button with SVG Icon */}
        <button
          type="button"
          disabled={isLocating}
          onClick={handleDetectLocation}
          className="w-full py-2.5 px-4 bg-floria-soft-sand hover:bg-floria-sand text-forest-800 border border-floria-border font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 mb-4 disabled:opacity-50 min-h-[44px]"
        >
          {isLocating ? (
            <>
              <div className="w-4 h-4 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
              <span>Fetching Current Location...</span>
            </>
          ) : (
            <>
              <MapPinIcon size={16} className="text-forest-700" />
              <span>Use My Current Device Location</span>
            </>
          )}
        </button>

        {locationMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              locationMessage.type === "success"
                ? "bg-success-50 text-success-800 border border-success-200"
                : "bg-error-50 text-error-800 border border-error-200"
            }`}
          >
            {locationMessage.type === "success" ? (
              <CheckIcon size={16} className="flex-shrink-0 text-success-700" />
            ) : (
              <AlertIcon size={16} className="flex-shrink-0 text-error-700" />
            )}
            <span>{locationMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name & Phone (Auto-filled from user profile & editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="full_name"
                className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1"
              >
                Full Name *
              </label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Enter full name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
              />
              {errors.full_name && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.full_name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1"
              >
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone number"
                className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
              />
              {errors.phone && (
                <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label
              htmlFor="line1"
              className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1"
            >
              Flat / House No. / Building / Street *
            </label>
            <input
              id="line1"
              type="text"
              value={formData.line1}
              onChange={(e) =>
                setFormData({ ...formData, line1: e.target.value })
              }
              placeholder="e.g. House 42, Green Avenue"
              className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
            />
            {errors.line1 && (
              <p className="text-[11px] text-red-600 mt-1">{errors.line1}</p>
            )}
          </div>

          {/* Address Line 2 / Locality */}
          <div>
            <label
              htmlFor="line2"
              className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1"
            >
              Locality / Landmark (Optional)
            </label>
            <input
              id="line2"
              type="text"
              value={formData.line2}
              onChange={(e) =>
                setFormData({ ...formData, line2: e.target.value })
              }
              placeholder="e.g. Near Reshma Park"
              className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
            />
          </div>

          {/* City, State, PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="city"
                className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1"
              >
                City *
              </label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
              />
              {errors.city && (
                <p className="text-[11px] text-red-600 mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1"
              >
                State *
              </label>
              <input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
              />
              {errors.state && (
                <p className="text-[11px] text-red-600 mt-1">{errors.state}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="pincode"
                className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1"
              >
                PIN Code *
              </label>
              <input
                id="pincode"
                type="text"
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
                placeholder="492001"
                className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
              />
              {errors.pincode && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.pincode}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div>
            <label
              htmlFor="instructions"
              className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1"
            >
              Delivery Instructions (Optional)
            </label>
            <input
              id="instructions"
              type="text"
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              placeholder="e.g. Leave with security guard"
              className="w-full px-3 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
            />
          </div>

          {/* Set default checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              id="is_default"
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) =>
                setFormData({ ...formData, is_default: e.target.checked })
              }
              className="w-4 h-4 text-forest-800 rounded border-floria-border focus:ring-forest-800 accent-forest-800"
            />
            <label
              htmlFor="is_default"
              className="text-xs font-semibold text-ink-700 select-none"
            >
              Make this my default delivery address
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-floria-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-floria-border hover:bg-floria-soft-sand text-ink-700 font-bold text-xs uppercase rounded-xl transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-800 min-h-[44px]"
              style={{ color: "#ffffff" }}
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
