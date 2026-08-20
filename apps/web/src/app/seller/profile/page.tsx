"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSeller } from "@/lib/contexts/SellerContext";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { MediaUploader, MediaUploadResult } from "@/components/media/MediaUploader";
import { api } from "@/lib/api";
import {
  Building2,
  Phone,
  MapPin,
  Sprout,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Upload,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Store,
  Layers,
  ArrowRight,
} from "lucide-react";

// ── Validation Helpers ────────────────────────────────────────────

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function validatePhone(v: string) {
  const clean = v.replace(/[\s\-+()\u00a0]/g, "").replace(/^91/, "");
  return /^[6-9]\d{9}$/.test(clean);
}

function validatePin(v: string) {
  return /^\d{6}$/.test(v.trim());
}

// ── Constants ─────────────────────────────────────────────────────

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const BUSINESS_TYPES = [
  { value: "nursery", label: "Plant Nursery & Greenhouse" },
  { value: "plant_shop", label: "Boutique Plant Shop & Studio" },
  { value: "garden_centre", label: "Garden Centre & Nursery" },
  { value: "landscaping", label: "Landscaping & Horticultural Firm" },
  { value: "gardening_supplier", label: "Gardening Supplies & Seeds Distributor" },
  { value: "other", label: "Other Botanical Business" },
];

const PLANT_CATEGORIES = [
  "Indoor Plants",
  "Outdoor Plants",
  "Flowering Plants",
  "Succulents & Cactus",
  "Fruit Plants",
  "Vegetable & Herb Plants",
  "Medicinal & Ayurvedic",
  "Ornamental Trees & Shrubs",
  "Seeds & Bulbs",
  "Pots & Planters",
  "Gardening Tools & Supplies",
  "Soil, Cocopeat & Fertilizers",
  "Bonsai & Rare Exotics",
  "Aquatic & Water Plants",
];

const NURSERY_CATEGORIES = [
  "Retail Plant Nursery",
  "Wholesale Commercial Nursery",
  "Specialty Exotic & Rare Flora",
  "Urban Terrace & Balcony Garden Specialist",
  "Farm & Agro-Forestry Nursery",
  "Hydroponic & Controlled Environment Nursery",
];

// ── Nursery Storefront / Showcase Image Upload Component ────────────

function NurseryImageUpload({
  currentUrl,
  onUploadSuccess,
}: {
  currentUrl: string | null;
  onUploadSuccess: (url: string) => void;
}) {
  const [logoAssetUrl, setLogoAssetUrl] = useState<string | null>(currentUrl);

  return (
    <div className="bg-emerald-50/60 p-4.5 rounded border border-emerald-200 space-y-3 shadow-xs">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
            <Store size={14} className="text-[#1B4D3E]" /> Nursery Logo & Storefront Showcase (Visible to Customers) *
          </p>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-mono">
            Public Customer View
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          This image will be displayed directly to customers on the public Nursery Directory (<span className="font-mono text-emerald-800 font-bold">/nurseries</span>), marketplace storefront cards, and plant catalog.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
        <MediaUploader
          profile="SELLER_LOGO"
          currentUrl={logoAssetUrl || undefined}
          label="Upload Nursery Logo / Showcase"
          onUploadSuccess={async (res: MediaUploadResult) => {
            setLogoAssetUrl(res.url);
            onUploadSuccess(res.url);
            try {
              await api.updateSellerLogo(res.assetId);
            } catch (err) {
              console.warn("Seller logo sync warning:", err);
            }
          }}
        />
      </div>
    </div>
  );
}

// ── Onboarding Steps Navigation Bar ───────────────────────────────

const STEPS = [
  { id: 1, name: "Business Identity", icon: Building2 },
  { id: 2, name: "Contact Information", icon: Phone },
  { id: 3, name: "Business Address", icon: MapPin },
  { id: 4, name: "Nursery Details", icon: Sprout },
  { id: 5, name: "Review & Complete", icon: CheckCircle2 },
];

function StepProgressBar({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="bg-white p-4 rounded border border-[#E2E8F0] shadow-xs">
      <div className="flex items-center justify-between overflow-x-auto gap-2 py-1 scrollbar-none">
        {STEPS.map((s, idx) => {
          const isCurrent = s.id === currentStep;
          const isPassed = s.id < currentStep;
          const Icon = s.icon;

          return (
            <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (s.id < currentStep) onStepClick(s.id);
                }}
                disabled={s.id > currentStep}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all text-xs font-mono font-bold uppercase tracking-wider ${
                  isCurrent
                    ? "bg-[#1B4D3E] text-white shadow-xs"
                    : isPassed
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/70 cursor-pointer"
                    : "bg-[#F8FAFC] text-slate-400 border border-[#E2E8F0] cursor-not-allowed opacity-75"
                }`}
              >
                <div className="flex items-center justify-center">
                  {isPassed ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                  ) : (
                    <Icon size={14} className={isCurrent ? "text-emerald-300" : "text-slate-400"} />
                  )}
                </div>
                <span className="hidden sm:inline">{s.name}</span>
                <span className="sm:hidden">Step {s.id}</span>
              </button>

              {idx < STEPS.length - 1 && (
                <span className={`text-xs font-mono ${s.id < currentStep ? "text-emerald-500" : "text-slate-300"}`}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Nursery Profile Page ─────────────────────────────────────

export default function SellerProfilePage() {
  const { sellerProfile, updateProfile, refreshProfile, isLoading } = useSeller();

  // Onboarding Form State
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("nursery");
  const [ownerName, setOwnerName] = useState("");
  const [yearEstablished, setYearEstablished] = useState<string>("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [primaryContactPerson, setPrimaryContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [whatsappAvailable, setWhatsappAvailable] = useState(true);
  const [contactEmail, setContactEmail] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("phone");

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("Chhattisgarh");
  const [pincode, setPincode] = useState("");
  const [country] = useState("India");

  const [nurseryCategory, setNurseryCategory] = useState("Retail Plant Nursery");
  const [plantCategories, setPlantCategories] = useState<string[]>(["Indoor Plants", "Flowering Plants"]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  useEffect(() => {
    api.getCategories().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setDbCategories(res.data.map((c: any) => c.name));
      }
    }).catch(() => {});
  }, []);
  const [specializations, setSpecializations] = useState("");
  const [nurserySize, setNurserySize] = useState("2,500 sq ft");
  const [yearsExperience, setYearsExperience] = useState<string>("5");
  const [shortDescription, setShortDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [seasonalAvailability, setSeasonalAvailability] = useState("All-Season Available");
  const [bulkOrdersSupported, setBulkOrdersSupported] = useState(false);
  const [customRequirementsSupported, setCustomRequirementsSupported] = useState(false);
  const [landscapingServices, setLandscapingServices] = useState(false);
  const [gardeningServices, setGardeningServices] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Determine initial completion and load profile values
  useEffect(() => {
    if (!sellerProfile) return;

    setBusinessName(sellerProfile.business_name || "");
    setBusinessType(sellerProfile.business_type || "nursery");
    setOwnerName(sellerProfile.owner_name || sellerProfile.business_name || "");
    setYearEstablished(sellerProfile.year_established ? String(sellerProfile.year_established) : "");
    setBusinessDescription(sellerProfile.business_description || "");
    setLogoUrl(sellerProfile.logo_url || null);

    setPrimaryContactPerson(sellerProfile.primary_contact_person || sellerProfile.owner_name || sellerProfile.business_name || "");
    setContactPhone(sellerProfile.contact_phone || "");
    setWhatsappNumber(sellerProfile.whatsapp_number || sellerProfile.contact_phone || "");
    setSameAsMobile(sellerProfile.whatsapp_number === sellerProfile.contact_phone || !sellerProfile.whatsapp_number);
    setWhatsappAvailable(sellerProfile.whatsapp_available ?? true);
    setContactEmail(sellerProfile.contact_email || "");
    setAlternatePhone(sellerProfile.alternate_phone || "");
    setPreferredContactMethod(sellerProfile.preferred_contact_method || "phone");

    // Address Parsing
    if (sellerProfile.address_line1 || sellerProfile.city) {
      setAddressLine1(sellerProfile.address_line1 || "");
      setAddressLine2(sellerProfile.address_line2 || "");
      setLandmark(sellerProfile.landmark || "");
      setLocality(sellerProfile.locality || "");
      setCity(sellerProfile.city || "");
      setDistrict(sellerProfile.district || "");
      setState(sellerProfile.state || "Chhattisgarh");
      setPincode(sellerProfile.pincode || "");
    } else if (sellerProfile.address) {
      const parts = sellerProfile.address.split(",").map((s) => s.trim());
      setAddressLine1(parts[0] || "");
      setLocality(parts[1] || "");
      setCity(parts[2] || "");
      setState(parts[3] || "Chhattisgarh");
      setPincode(parts[4] || "");
    }

    setNurseryCategory(sellerProfile.nursery_category || "Retail Plant Nursery");
    if (sellerProfile.plant_categories && Array.isArray(sellerProfile.plant_categories)) {
      setPlantCategories(sellerProfile.plant_categories);
    }
    setSpecializations(
      Array.isArray(sellerProfile.specializations)
        ? sellerProfile.specializations.join(", ")
        : sellerProfile.specializations || ""
    );
    setNurserySize(sellerProfile.nursery_size || "2,500 sq ft");
    setYearsExperience(sellerProfile.years_experience ? String(sellerProfile.years_experience) : "5");
    setShortDescription(sellerProfile.short_description || sellerProfile.business_description || "");
    setDetailedDescription(sellerProfile.detailed_description || "");
    setSeasonalAvailability(sellerProfile.seasonal_availability || "All-Season Available");
    setBulkOrdersSupported(Boolean(sellerProfile.bulk_orders_supported));
    setCustomRequirementsSupported(Boolean(sellerProfile.custom_requirements_supported));
    setLandscapingServices(Boolean(sellerProfile.landscaping_services));
    setGardeningServices(Boolean(sellerProfile.gardening_services));

    // Determine initial resume step if profile is incomplete
    const isStep1Done = Boolean(
      sellerProfile.business_name &&
      sellerProfile.business_name !== "New Nursery" &&
      sellerProfile.business_name !== "Nursery Partner" &&
      sellerProfile.owner_name
    );
    const isStep2Done = Boolean(
      sellerProfile.contact_phone &&
      validatePhone(sellerProfile.contact_phone) &&
      sellerProfile.contact_email &&
      validateEmail(sellerProfile.contact_email)
    );
    const isStep3Done = Boolean(
      (sellerProfile.address_line1 || sellerProfile.address) &&
      (sellerProfile.city || sellerProfile.state) &&
      (sellerProfile.pincode ? validatePin(sellerProfile.pincode) : true)
    );

    if (!sellerProfile.is_profile_completed) {
      if (!isStep1Done) setCurrentStep(1);
      else if (!isStep2Done) setCurrentStep(2);
      else if (!isStep3Done) setCurrentStep(3);
      else setCurrentStep(4);
    }
  }, [sellerProfile]);

  // Sync WhatsApp when sameAsMobile is checked
  useEffect(() => {
    if (sameAsMobile) {
      setWhatsappNumber(contactPhone);
    }
  }, [sameAsMobile, contactPhone]);

  // Is the profile complete?
  const isProfileComplete = Boolean(
    sellerProfile?.is_profile_completed ||
    (sellerProfile &&
      sellerProfile.business_name &&
      sellerProfile.business_name !== "New Nursery" &&
      sellerProfile.business_name !== "Nursery Partner" &&
      sellerProfile.contact_phone &&
      sellerProfile.contact_email &&
      (sellerProfile.address_line1 || sellerProfile.address) &&
      sellerProfile.owner_name)
  );

  // Validation functions
  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!businessName.trim() || businessName.trim() === "New Nursery" || businessName.trim() === "Nursery Partner") {
      errs.businessName = "Please provide your official nursery or business name.";
    }
    if (!businessType) {
      errs.businessType = "Please select your business type.";
    }
    if (!ownerName.trim()) {
      errs.ownerName = "Owner / Proprietor name is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!primaryContactPerson.trim()) {
      errs.primaryContactPerson = "Primary contact person name is required.";
    }
    if (!contactPhone.trim()) {
      errs.contactPhone = "Primary mobile number is required.";
    } else if (!validatePhone(contactPhone)) {
      errs.contactPhone = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
    }
    if (whatsappNumber.trim() && !validatePhone(whatsappNumber)) {
      errs.whatsappNumber = "Enter a valid 10-digit WhatsApp number.";
    }
    if (alternatePhone.trim() && !validatePhone(alternatePhone)) {
      errs.alternatePhone = "Enter a valid 10-digit alternate phone number.";
    }
    if (!contactEmail.trim()) {
      errs.contactEmail = "Official contact email is required.";
    } else if (!validateEmail(contactEmail)) {
      errs.contactEmail = "Enter a valid email address.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    const errs: Record<string, string> = {};
    if (!addressLine1.trim()) {
      errs.addressLine1 = "Street address / nursery premises is required.";
    }
    if (!city.trim()) {
      errs.city = "City / Town is required.";
    }
    if (!district.trim()) {
      errs.district = "District is required.";
    }
    if (!state.trim()) {
      errs.state = "State is required.";
    }
    if (!pincode.trim()) {
      errs.pincode = "Postal PIN code is required.";
    } else if (!validatePin(pincode)) {
      errs.pincode = "Enter a valid 6-digit Indian PIN code.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep4(): boolean {
    const errs: Record<string, string> = {};
    if (plantCategories.length === 0) {
      errs.plantCategories = "Select at least one plant category your nursery cultivates or sells.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Save Step Handler
  async function handleNext(targetStep: number) {
    setApiError(null);
    let isValid = false;

    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();
    else if (currentStep === 3) isValid = validateStep3();
    else if (currentStep === 4) isValid = validateStep4();
    else isValid = true;

    if (!isValid) return;

    try {
      setSaving(true);
      const fullAddress = [
        addressLine1.trim(),
        addressLine2.trim(),
        locality.trim(),
        landmark.trim(),
        city.trim(),
        district.trim(),
        state.trim(),
        pincode.trim(),
        country,
      ]
        .filter(Boolean)
        .join(", ");

      const payload: any = {
        onboarding_step: targetStep,
        business_name: businessName.trim(),
        business_type: businessType,
        owner_name: ownerName.trim(),
        year_established: yearEstablished ? parseInt(yearEstablished, 10) : null,
        business_description: businessDescription.trim() || null,
        logo_url: logoUrl,

        primary_contact_person: primaryContactPerson.trim(),
        contact_phone: contactPhone.trim(),
        whatsapp_number: whatsappNumber.trim() || null,
        whatsapp_available: whatsappAvailable,
        contact_email: contactEmail.trim(),
        alternate_phone: alternatePhone.trim() || null,
        preferred_contact_method: preferredContactMethod,

        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || null,
        landmark: landmark.trim() || null,
        locality: locality.trim() || null,
        city: city.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country,
        address: fullAddress,

        nursery_category: nurseryCategory,
        plant_categories: plantCategories,
        specializations: specializations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        nursery_size: nurserySize.trim() || null,
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
        short_description: shortDescription.trim() || null,
        detailed_description: detailedDescription.trim() || null,
        seasonal_availability: seasonalAvailability,
        bulk_orders_supported: bulkOrdersSupported,
        custom_requirements_supported: customRequirementsSupported,
        landscaping_services: landscapingServices,
        gardening_services: gardeningServices,
      };

      await updateProfile(payload);
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setApiError(err.message || "Failed to save progress. Please verify your connection.");
    } finally {
      setSaving(false);
    }
  }

  // Final Complete Profile Submission
  async function handleFinalComplete() {
    setApiError(null);
    try {
      setSaving(true);
      await updateProfile({
        is_profile_completed: true,
        onboarding_step: 5,
        profile_completed_at: new Date().toISOString(),
      });
      await refreshProfile();
      setIsEditingExisting(false);
      setSaveMessage("Your nursery profile has been successfully completed and activated!");
      setTimeout(() => setSaveMessage(null), 4000);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setApiError(err.message || "Failed to finalize profile completion. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  // Toggle category chips
  function toggleCategory(cat: string) {
    if (plantCategories.includes(cat)) {
      setPlantCategories(plantCategories.filter((c) => c !== cat));
    } else {
      setPlantCategories([...plantCategories, cat]);
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#1B4D3E] space-y-3 font-sans">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Loading Nursery Profile...</p>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // MODE 1: COMPLETED PROFILE VIEW (Standard Management Mode)
  // ═════════════════════════════════════════════════════════════════
  if (isProfileComplete && !isEditingExisting) {
    return (
      <div className="space-y-6 font-sans antialiased text-[#212529]">
        {/* Title Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">{businessName || "Nursery Profile"}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Verified partner storefront details, dispatch coordinates, and botanical specializations.</p>
          </div>

          <div className="flex items-center gap-3">
            <SellerStatusBadge status={sellerProfile?.status || "pending"} />
            <button
              type="button"
              onClick={() => setIsEditingExisting(true)}
              style={{ color: "#ffffff" }}
              className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#153e31] !text-white rounded font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Edit3 size={13} /> Edit Profile Details
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
            <CheckCircle2 size={16} /> {saveMessage}
          </div>
        )}

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Business Identity */}
          <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
              <h2 className="font-sans font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <Building2 size={16} className="text-[#1B4D3E]" /> Business Identity
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setIsEditingExisting(true);
                }}
                className="text-[11px] font-mono font-bold text-[#1B4D3E] hover:underline uppercase tracking-wider"
              >
                Edit
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="text-slate-400" size={20} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#0F172A]">{businessName}</p>
                  <p className="text-[11px] font-mono text-emerald-800 font-bold uppercase">{businessType.replace(/_/g, " ")}</p>
                  {yearEstablished && <p className="text-[11px] text-slate-400">Est. {yearEstablished}</p>}
                </div>
              </div>
              <div className="border-t border-[#E2E8F0] pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-mono text-slate-500 uppercase text-[10px]">Owner / Proprietor:</span>
                  <span className="font-bold text-[#0F172A]">{ownerName || "—"}</span>
                </div>
                {businessDescription && (
                  <p className="text-slate-600 leading-relaxed pt-1 italic">&ldquo;{businessDescription}&rdquo;</p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Contact Information */}
          <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
              <h2 className="font-sans font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <Phone size={16} className="text-[#1B4D3E]" /> Contact Information
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(2);
                  setIsEditingExisting(true);
                }}
                className="text-[11px] font-mono font-bold text-[#1B4D3E] hover:underline uppercase tracking-wider"
              >
                Edit
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono text-slate-500 uppercase text-[10px]">Contact Person:</span>
                <span className="font-bold text-[#0F172A]">{primaryContactPerson || ownerName || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-slate-500 uppercase text-[10px]">Primary Mobile:</span>
                <span className="font-mono font-bold text-[#0F172A]">+91 {contactPhone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-slate-500 uppercase text-[10px]">WhatsApp Support:</span>
                <span className="font-mono text-[#0F172A]">
                  {whatsappNumber ? `+91 ${whatsappNumber}` : "+91 " + contactPhone}
                  {whatsappAvailable && <span className="ml-1.5 text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">Active</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-slate-500 uppercase text-[10px]">Contact Email:</span>
                <span className="font-mono text-[#0F172A]">{contactEmail}</span>
              </div>
              {alternatePhone && (
                <div className="flex justify-between items-center">
                  <span className="font-mono text-slate-500 uppercase text-[10px]">Alternate Phone:</span>
                  <span className="font-mono text-[#0F172A]">+91 {alternatePhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Business Address & Dispatch */}
          <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
              <h2 className="font-sans font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <MapPin size={16} className="text-[#1B4D3E]" /> Business Address &amp; Coordinates
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(3);
                  setIsEditingExisting(true);
                }}
                className="text-[11px] font-mono font-bold text-[#1B4D3E] hover:underline uppercase tracking-wider"
              >
                Edit
              </button>
            </div>
            <div className="p-5 space-y-2.5 text-xs">
              <p className="font-bold text-[#0F172A]">{addressLine1}</p>
              {addressLine2 && <p className="text-slate-600">{addressLine2}</p>}
              <p className="text-slate-600">
                {[locality, landmark].filter(Boolean).join(", ")}
              </p>
              <p className="font-mono text-slate-800">
                {city}, {district}, {state} — <span className="font-bold text-[#1B4D3E]">{pincode}</span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Country: {country}</p>
            </div>
          </div>

          {/* Card 4: Nursery Operations & Specializations */}
          <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
              <h2 className="font-sans font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <Sprout size={16} className="text-[#1B4D3E]" /> Botanical Specializations &amp; Services
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(4);
                  setIsEditingExisting(true);
                }}
                className="text-[11px] font-mono font-bold text-[#1B4D3E] hover:underline uppercase tracking-wider"
              >
                Edit
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <span className="font-mono text-slate-500 uppercase text-[10px] block mb-1.5">Cultivated Plant Categories:</span>
                <div className="flex flex-wrap gap-1.5">
                  {plantCategories.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-3 flex flex-wrap gap-4">
                <div>
                  <span className="font-mono text-slate-500 uppercase text-[10px] block">Nursery Footprint:</span>
                  <span className="font-bold text-[#0F172A]">{nurserySize}</span>
                </div>
                <div>
                  <span className="font-mono text-slate-500 uppercase text-[10px] block">Experience:</span>
                  <span className="font-bold text-[#0F172A]">{yearsExperience} Years</span>
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-3 flex flex-wrap gap-2">
                {bulkOrdersSupported && <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono">✓ Bulk Orders</span>}
                {customRequirementsSupported && <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono">✓ Custom Sourcing</span>}
                {landscapingServices && <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono">✓ Landscaping</span>}
                {gardeningServices && <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono">✓ Garden Care</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // MODE 2: STEP-BASED PROGRESSIVE ONBOARDING WIZARD
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans antialiased text-[#212529]">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Complete Your Nursery Profile</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Establish your business identity, verified coordinates, and plant specialties on the Floria marketplace.
          </p>
        </div>

        {isProfileComplete && (
          <button
            type="button"
            onClick={() => setIsEditingExisting(false)}
            className="px-3.5 py-1.5 rounded border border-[#E2E8F0] text-xs font-mono font-bold text-slate-600 hover:bg-[#F8FAFC]"
          >
            ← Exit to Profile View
          </button>
        )}
      </div>

      {/* Step Progress Tracker */}
      <StepProgressBar currentStep={currentStep} onStepClick={(s) => setCurrentStep(s)} />

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-xs font-semibold text-red-700 flex items-center gap-2 shadow-xs">
          <AlertCircle size={16} /> {apiError}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded border border-[#E2E8F0] p-6 sm:p-7 shadow-xs space-y-6">
        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 1: BUSINESS IDENTITY                                  */}
        {/* ────────────────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="font-sans text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Building2 size={18} className="text-[#1B4D3E]" /> Step 1: Business Identity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Tell us about your business name, structure, and brand representation.</p>
            </div>

            <NurseryImageUpload currentUrl={logoUrl} onUploadSuccess={(url) => setLogoUrl(url)} />


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nursery / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Green Valley Botanics"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
                {errors.businessName && <p className="text-xs text-red-600 font-semibold mt-1">{errors.businessName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Business Type *
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>{bt.label}</option>
                  ))}
                </select>
                {errors.businessType && <p className="text-xs text-red-600 font-semibold mt-1">{errors.businessType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Owner / Proprietor Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rajeshwar Sharma"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
                {errors.ownerName && <p className="text-xs text-red-600 font-semibold mt-1">{errors.ownerName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Year Established (Optional)
                </label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={yearEstablished}
                  onChange={(e) => setYearEstablished(e.target.value)}
                  placeholder="e.g. 2016"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                Business Description / Storefront Tagline
              </label>
              <textarea
                rows={3}
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Briefly describe your nursery heritage, primary cultivars, and horticultural philosophy..."
                className="w-full p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] resize-none"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleNext(2)}
                style={{ color: "#ffffff" }}
                className="px-6 py-2.5 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-2"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : "Next: Contact Information →"}
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 2: CONTACT INFORMATION                                */}
        {/* ────────────────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="font-sans text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Phone size={18} className="text-[#1B4D3E]" /> Step 2: Contact Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Direct contact points for order dispatch and customer support coordination.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Primary Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={primaryContactPerson}
                  onChange={(e) => setPrimaryContactPerson(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
                {errors.primaryContactPerson && <p className="text-xs text-red-600 font-semibold mt-1">{errors.primaryContactPerson}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. support@greenvalleynursery.in"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
                {errors.contactEmail && <p className="text-xs text-red-600 font-semibold mt-1">{errors.contactEmail}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Primary Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-11 pr-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                  />
                </div>
                {errors.contactPhone && <p className="text-xs text-red-600 font-semibold mt-1">{errors.contactPhone}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                    WhatsApp Number
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameAsMobile}
                      onChange={(e) => setSameAsMobile(e.target.checked)}
                      className="rounded border-[#E2E8F0] text-[#1B4D3E] focus:ring-[#1B4D3E]"
                    />
                    Same as Mobile
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    disabled={sameAsMobile}
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="9876543210"
                    className={`w-full pl-11 pr-3.5 py-2 rounded border border-[#E2E8F0] text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] ${
                      sameAsMobile ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-[#F8FAFC] focus:bg-white"
                    }`}
                  />
                </div>
                {errors.whatsappNumber && <p className="text-xs text-red-600 font-semibold mt-1">{errors.whatsappNumber}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Alternate Phone (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-11 pr-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                  />
                </div>
                {errors.alternatePhone && <p className="text-xs text-red-600 font-semibold mt-1">{errors.alternatePhone}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Preferred Contact Method
                </label>
                <select
                  value={preferredContactMethod}
                  onChange={(e) => setPreferredContactMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
                >
                  <option value="phone">Direct Phone Call</option>
                  <option value="whatsapp">WhatsApp Messaging</option>
                  <option value="email">Email Notification</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2 rounded border border-[#E2E8F0] text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-[#F8FAFC]"
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleNext(3)}
                style={{ color: "#ffffff" }}
                className="px-6 py-2.5 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-2"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : "Next: Business Address →"}
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 3: BUSINESS ADDRESS                                   */}
        {/* ────────────────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="font-sans text-base font-bold text-[#0F172A] flex items-center gap-2">
                <MapPin size={18} className="text-[#1B4D3E]" /> Step 3: Business Address &amp; Dispatch Location
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Physical nursery location for Floria delivery partner pickups.</p>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                Address Line 1 (Street / Nursery Plot / Greenhouse) *
              </label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="e.g. Plot No. 42, Anand Nagar Nursery Road"
                className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
              />
              {errors.addressLine1 && <p className="text-xs text-red-600 font-semibold mt-1">{errors.addressLine1}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Address Line 2 (Unit / Floor / Sector)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. Near Botanical Lake Area"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Landmark / Locality
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite State Forest Depot"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Raipur"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
                {errors.city && <p className="text-xs text-red-600 font-semibold mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  District *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Raipur"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
                {errors.district && <p className="text-xs text-red-600 font-semibold mt-1">{errors.district}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="492001"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
                {errors.pincode && <p className="text-xs text-red-600 font-semibold mt-1">{errors.pincode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  State *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {errors.state && <p className="text-xs text-red-600 font-semibold mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  disabled
                  value={country}
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-slate-100 text-slate-500 text-xs font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2 rounded border border-[#E2E8F0] text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-[#F8FAFC]"
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleNext(4)}
                style={{ color: "#ffffff" }}
                className="px-6 py-2.5 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-2"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : "Next: Nursery Details →"}
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 4: NURSERY / BUSINESS DETAILS                         */}
        {/* ────────────────────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="font-sans text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Sprout size={18} className="text-[#1B4D3E]" /> Step 4: Nursery Specializations &amp; Capabilities
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Specify your nursery scale, botanical varieties, and service capabilities.</p>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                Primary Nursery Category
              </label>
              <select
                value={nurseryCategory}
                onChange={(e) => setNurseryCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
              >
                {NURSERY_CATEGORIES.map((nc) => (
                  <option key={nc} value={nc}>{nc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Plant &amp; Supply Categories Cultivated *
              </label>
              <p className="text-[11px] text-slate-400 mb-2">Click to select all plant varieties and supplies your nursery provides:</p>
              <div className="flex flex-wrap gap-2">
                {(dbCategories.length > 0 ? dbCategories : PLANT_CATEGORIES).map((cat) => {
                  const selected = plantCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded text-xs transition-all font-medium flex items-center gap-1.5 ${
                        selected
                          ? "bg-[#1B4D3E] text-white shadow-xs font-bold"
                          : "bg-[#F8FAFC] text-slate-700 border border-[#E2E8F0] hover:bg-slate-100"
                      }`}
                    >
                      {selected && <span>✓</span>} {cat}
                    </button>
                  );
                })}
              </div>
              {errors.plantCategories && <p className="text-xs text-red-600 font-semibold mt-1">{errors.plantCategories}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Botanical Specializations (Comma-separated)
                </label>
                <input
                  type="text"
                  value={specializations}
                  onChange={(e) => setSpecializations(e.target.value)}
                  placeholder="e.g. Exotic Aroids, Hydroponics, Native Palms"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Approximate Nursery Footprint
                </label>
                <input
                  type="text"
                  value={nurserySize}
                  onChange={(e) => setNurserySize(e.target.value)}
                  placeholder="e.g. 5,000 sq ft or 1.5 Acres"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Seasonal Availability
                </label>
                <select
                  value={seasonalAvailability}
                  onChange={(e) => setSeasonalAvailability(e.target.value)}
                  className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
                >
                  <option value="All-Season Available">All-Season / Year-Round Supply</option>
                  <option value="Monsoon & Winter Peak">Monsoon &amp; Winter Peak</option>
                  <option value="Spring / Summer Specialized">Spring / Summer Specialized</option>
                </select>
              </div>
            </div>

            {/* Marketplace Capabilities */}
            <div className="bg-[#F8FAFC] p-4 rounded border border-[#E2E8F0] space-y-2.5">
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700">Marketplace Operational Options</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkOrdersSupported}
                    onChange={(e) => setBulkOrdersSupported(e.target.checked)}
                    className="rounded border-[#E2E8F0] text-[#1B4D3E] focus:ring-[#1B4D3E]"
                  />
                  <span>Bulk &amp; Wholesale Nursery Orders Supported</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customRequirementsSupported}
                    onChange={(e) => setCustomRequirementsSupported(e.target.checked)}
                    className="rounded border-[#E2E8F0] text-[#1B4D3E] focus:ring-[#1B4D3E]"
                  />
                  <span>Custom Plant Sourcing &amp; Procurement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={landscapingServices}
                    onChange={(e) => setLandscapingServices(e.target.checked)}
                    className="rounded border-[#E2E8F0] text-[#1B4D3E] focus:ring-[#1B4D3E]"
                  />
                  <span>Landscaping Design &amp; Installation Services</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gardeningServices}
                    onChange={(e) => setGardeningServices(e.target.checked)}
                    className="rounded border-[#E2E8F0] text-[#1B4D3E] focus:ring-[#1B4D3E]"
                  />
                  <span>Garden Maintenance &amp; Plant Care Advisory</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2 rounded border border-[#E2E8F0] text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-[#F8FAFC]"
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleNext(5)}
                style={{ color: "#ffffff" }}
                className="px-6 py-2.5 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-2"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : "Review Profile & Complete →"}
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 5: REVIEW & COMPLETE                                  */}
        {/* ────────────────────────────────────────────────────────── */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="font-sans text-base font-bold text-[#0F172A] flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#1B4D3E]" /> Step 5: Review &amp; Activate Profile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Please review your nursery onboarding information before final submission.</p>
            </div>

            {/* Review Cards */}
            <div className="space-y-4 text-xs">
              {/* Review Card 1 */}
              <div className="p-4 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-sans font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                    <Building2 size={15} className="text-[#1B4D3E]" /> 1. Business Identity
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] font-mono font-bold text-[#1B4D3E] hover:underline uppercase"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div><span className="font-mono text-[10px] text-slate-500 uppercase">Name:</span> <strong className="text-[#0F172A]">{businessName}</strong></div>
                  <div><span className="font-mono text-[10px] text-slate-500 uppercase">Type:</span> {businessType.replace(/_/g, " ")}</div>
                  <div><span className="font-mono text-[10px] text-slate-500 uppercase">Owner:</span> {ownerName}</div>
                  {yearEstablished && <div><span className="font-mono text-[10px] text-slate-500 uppercase">Est:</span> {yearEstablished}</div>}
                </div>
              </div>

              {/* Review Card 2 */}
              <div className="p-4 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-sans font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                    <Phone size={15} className="text-[#1B4D3E]" /> 2. Contact Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] font-mono font-bold text-[#1B4D3E] hover:underline uppercase"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div><span className="font-mono text-[10px] text-slate-500 uppercase">Contact:</span> {primaryContactPerson || ownerName}</div>
                  <div><span className="font-mono text-[10px] text-slate-500 uppercase">Mobile:</span> <span className="font-mono font-bold">+91 {contactPhone}</span></div>
                  <div><span className="font-mono text-[10px] text-slate-500 uppercase">WhatsApp:</span> <span className="font-mono">+91 {whatsappNumber || contactPhone}</span></div>
                  <div><span className="font-mono text-[10px] text-slate-500 uppercase">Email:</span> <span className="font-mono">{contactEmail}</span></div>
                </div>
              </div>

              {/* Review Card 3 */}
              <div className="p-4 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-sans font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#1B4D3E]" /> 3. Business Address
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-[11px] font-mono font-bold text-[#1B4D3E] hover:underline uppercase"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}, {locality ? `${locality}, ` : ""}{landmark ? `${landmark}, ` : ""}
                  {city}, {district}, {state} — <strong className="text-[#1B4D3E] font-mono">{pincode}</strong> ({country})
                </p>
              </div>

              {/* Review Card 4 */}
              <div className="p-4 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-sans font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                    <Sprout size={15} className="text-[#1B4D3E]" /> 4. Nursery Details &amp; Capabilities
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-[11px] font-mono font-bold text-[#1B4D3E] hover:underline uppercase"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {plantCategories.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Footprint: {nurserySize} • Experience: {yearsExperience} Years • {seasonalAvailability}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 rounded border border-[#E2E8F0] text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-[#F8FAFC]"
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleFinalComplete}
                style={{ color: "#ffffff" }}
                className="px-8 py-3 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Complete Profile & Activate Dashboard ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
