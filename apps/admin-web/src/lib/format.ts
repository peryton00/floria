// Floria — Standard Currency & Date Formatting Utilities for Admin

export function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise / 100);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}
