"use client";

import { useState, useRef, useEffect } from "react";
import { useSeller } from "@/lib/contexts/SellerContext";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";

// ── Validation ────────────────────────────────────────────────────

interface FormErrors {
  businessName?: string;
  contactPhone?: string;
  contactEmail?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function validatePhone(v: string) {
  return /^[6-9]\d{9}$/.test(v.replace(/[\s\-+()\u00a0]/g, "").replace(/^91/, ""));
}

function validatePin(v: string) {
  return /^\d{6}$/.test(v.trim());
}

// ── Address fields parsed from/serialised to the flat `address` string ──
// ponytail: when backend ships, address becomes a structured JSONB column.
//   Until then, serialise as "line1, locality, city, state, pincode".

interface AddressFields {
  line1: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

function parseAddress(raw: string | null): AddressFields {
  const parts = (raw ?? "").split(",").map((s) => s.trim());
  return {
    line1:    parts[0] ?? "",
    locality: parts[1] ?? "",
    city:     parts[2] ?? "",
    state:    parts[3] ?? "",
    pincode:  parts[4] ?? "",
  };
}

function serialiseAddress(a: AddressFields): string {
  return [a.line1, a.locality, a.city, a.state, a.pincode]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}
// ── Form field helper ─────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  autoComplete?: string;
  textarea?: boolean;
  rows?: number;
}

function Field({
  id, label, type = "text", value, onChange, error,
  placeholder, required, hint, autoComplete, textarea, rows = 3,
}: FieldProps) {
  const base = [
    "w-full px-4 py-3 text-xs sm:text-sm rounded-xl border transition-all font-medium",
    "focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900 placeholder:text-ink-400",
    error ? "border-rose-600 bg-rose-50/50" : "border-floria-border bg-floria-sand/70 focus:bg-floria-linen",
  ].join(" ");

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
        {label}
        {required && <span className="text-rose-600 ml-0.5" aria-hidden>*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={base}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={base}
        />
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-rose-600 font-semibold mt-1">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-floria-linen rounded-3xl border border-floria-border shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-floria-border bg-floria-soft-sand/50">
        <h2 className="font-serif font-bold text-base text-ink-900">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

// ── Logo Upload UI ────────────────────────────────────────────────

function LogoUpload({
  currentUrl,
  onSelect,
}: {
  currentUrl: string | null;
  onSelect: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState("");

  useEffect(() => { setPreview(currentUrl); }, [currentUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    const MAX_MB = 2;

    if (!ALLOWED.includes(file.type)) {
      setError("Please upload a JPG, PNG, WebP, or SVG file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPreview(url);
      onSelect(url);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-ink-700 mb-2.5">Nursery Brand Logo</p>
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-floria-border flex items-center justify-center bg-floria-natural-sand flex-shrink-0 overflow-hidden shadow-2xs">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Nursery logo preview" className="w-full h-full object-cover" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-400">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 rounded-xl border border-floria-border hover:bg-floria-sand bg-floria-linen text-xs font-bold uppercase tracking-wider text-ink-700 hover:text-forest-800 transition-all focus:outline-none focus:ring-2 focus:ring-forest-800 shadow-2xs"
            aria-label="Upload nursery logo"
          >
            {preview ? "Change Logo" : "Upload Logo"}
          </button>
          <p className="text-[11px] text-ink-400">JPG, PNG, WebP or SVG · Max 2 MB</p>
          {error && <p role="alert" className="text-xs text-rose-600 font-semibold">{error}</p>}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleChange}
            className="sr-only"
            aria-label="Logo file input"
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function SellerProfilePage() {
  const { sellerProfile, updateProfile } = useSeller();

  const addr = parseAddress(sellerProfile?.address ?? null);

  const [businessName, setBusinessName] = useState(sellerProfile?.business_name ?? "");
  const [description, setDescription]   = useState(sellerProfile?.business_description ?? "");
  const [phone, setPhone]               = useState(sellerProfile?.contact_phone ?? "");
  const [email, setEmail]               = useState(sellerProfile?.contact_email ?? "");
  const [logoUrl, setLogoUrl]           = useState<string | null>(sellerProfile?.logo_url ?? null);
  const [line1, setLine1]               = useState(addr.line1);
  const [locality, setLocality]         = useState(addr.locality);
  const [city, setCity]                 = useState(addr.city);
  const [state, setState]               = useState(addr.state);
  const [pincode, setPincode]           = useState(addr.pincode);

  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sellerProfile) return;
    setBusinessName(sellerProfile.business_name ?? "");
    setDescription(sellerProfile.business_description ?? "");
    setPhone(sellerProfile.contact_phone ?? "");
    setEmail(sellerProfile.contact_email ?? "");
    setLogoUrl(sellerProfile.logo_url ?? null);
    const a = parseAddress(sellerProfile.address ?? null);
    setLine1(a.line1); setLocality(a.locality);
    setCity(a.city); setState(a.state); setPincode(a.pincode);
  }, [sellerProfile]);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!businessName.trim()) errs.businessName = "Business name is required.";
    if (!phone.trim()) {
      errs.contactPhone = "Contact phone is required.";
    } else if (!validatePhone(phone.trim())) {
      errs.contactPhone = "Enter a valid 10-digit mobile number.";
    }
    if (!email.trim()) {
      errs.contactEmail = "Contact email is required.";
    } else if (!validateEmail(email.trim())) {
      errs.contactEmail = "Enter a valid email address.";
    }
    if (!line1.trim()) errs.addressLine = "Address line is required.";
    if (!city.trim()) errs.city = "City is required.";
    if (!state.trim()) errs.state = "State is required.";
    if (!pincode.trim()) {
      errs.pincode = "PIN code is required.";
    } else if (!validatePin(pincode.trim())) {
      errs.pincode = "Enter a 6-digit Indian PIN code.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSaved(false);

    const fullAddress = [line1.trim(), locality.trim(), city.trim(), state.trim(), pincode.trim()]
      .filter(Boolean)
      .join(", ");

    try {
      await updateProfile({
        business_name: businessName.trim(),
        business_description: description.trim() || undefined,
        contact_phone: phone.trim(),
        contact_email: email.trim(),
        logo_url: logoUrl || undefined,
        address: fullAddress,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setErrors({ businessName: err.message ?? "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 font-ui">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Nursery Profile & Storefront</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Manage your public nursery identity, customer contact information, and physical dispatch address.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Section title="Business Identity">
          <LogoUpload currentUrl={logoUrl} onSelect={setLogoUrl} />
          <Field
            id="prof-biz-name"
            label="Nursery / Business Name"
            value={businessName}
            onChange={(v) => { setBusinessName(v); setErrors((e) => ({ ...e, businessName: undefined })); }}
            error={errors.businessName}
            placeholder="Green Haven Nursery"
            required
            autoComplete="organization"
          />
          <Field
            id="prof-desc"
            label="Business Description"
            value={description}
            onChange={setDescription}
            placeholder="Tell customers about your botanical specialties, nursery history, and plant care philosophy…"
            textarea
            rows={3}
            hint="Displayed on your public Floria nursery profile."
          />
        </Section>

        <Section title="Contact Information">
          <Field
            id="prof-phone"
            label="Contact Mobile Number"
            type="tel"
            value={phone}
            onChange={(v) => { setPhone(v); setErrors((e) => ({ ...e, contactPhone: undefined })); }}
            error={errors.contactPhone}
            placeholder="9876543210"
            required
            autoComplete="tel"
            hint="Used for logistics coordination and order fulfillment notifications."
          />
          <Field
            id="prof-email"
            label="Contact Email"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); setErrors((e) => ({ ...e, contactEmail: undefined })); }}
            error={errors.contactEmail}
            placeholder="contact@nursery.com"
            required
            autoComplete="email"
          />
        </Section>

        <Section title="Nursery Dispatch Address">
          <Field
            id="prof-line1"
            label="Address Line"
            value={line1}
            onChange={(v) => { setLine1(v); setErrors((e) => ({ ...e, addressLine: undefined })); }}
            error={errors.addressLine}
            placeholder="Street number, road name"
            required
            autoComplete="address-line1"
          />
          <Field
            id="prof-locality"
            label="Locality / Area"
            value={locality}
            onChange={setLocality}
            placeholder="Sector 5, Botanical Enclave…"
            autoComplete="address-line2"
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="prof-city"
              label="City"
              value={city}
              onChange={(v) => { setCity(v); setErrors((e) => ({ ...e, city: undefined })); }}
              error={errors.city}
              placeholder="Raipur"
              required
              autoComplete="address-level2"
            />
            <Field
              id="prof-pin"
              label="PIN Code"
              value={pincode}
              onChange={(v) => { setPincode(v); setErrors((e) => ({ ...e, pincode: undefined })); }}
              error={errors.pincode}
              placeholder="492001"
              required
              autoComplete="postal-code"
            />
          </div>
          <Field
            id="prof-state"
            label="State"
            value={state}
            onChange={(v) => { setState(v); setErrors((e) => ({ ...e, state: undefined })); }}
            error={errors.state}
            placeholder="Chhattisgarh"
            required
            autoComplete="address-level1"
          />
        </Section>

        <div className="flex items-center justify-between gap-4 bg-floria-linen/95 backdrop-blur-md rounded-2xl border border-floria-border px-6 py-4 sticky bottom-4 shadow-lg">
          {saved ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-forest-800 bg-forest-50 border border-forest-200 px-3 py-1 rounded-full shadow-2xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Profile saved successfully
            </span>
          ) : (
            <span className="text-xs text-ink-500 font-medium">
              All required fields must be completed.
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{ color: "#ffffff" }}
            className="px-7 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 !text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs hover:shadow-md active:scale-95 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            {saving ? "Saving Profile…" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
