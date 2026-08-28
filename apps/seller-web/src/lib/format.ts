// Floria — Standard Currency & Date Formatting Utilities

/** Formats paise integer as INR currency string, e.g. 149900 -> ₹1,499 */
export function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/** Formats paise as integer rupees string */
export function paiseToRupees(paise: number): number {
  return Math.round(paise / 100);
}

/** Converts rupees to paise integer */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Formats ISO date string */
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
