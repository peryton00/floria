"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { AlertIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>("orders");
  const [loading, setLoading] = useState(false);

  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded", `Downloaded ${filename}`);
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      if (reportType === "orders") {
        const res = await api.getAdminOrders();
        if (res.success && res.data) {
          const headers = ["Order ID", "Customer Name", "Status", "Subtotal (INR)", "Created At"];
          const rows = res.data.map((o) => [
            o.id,
            o.delivery_address_snapshot?.full_name || "Customer",
            o.status,
            ((o.subtotal_paise || 0) / 100).toFixed(2),
            new Date(o.created_at).toISOString(),
          ]);
          const csvContent = [headers.join(","), ...rows.map((r) => r.map(val => `"${val}"`).join(","))].join("\n");
          downloadCSV("orders_report.csv", csvContent);
        } else {
          toast.error("Export failed", "Failed to load orders for report generation.");
        }
      } else if (reportType === "users") {
        const res = await api.getAdminUsers();
        if (res.success && res.data) {
          const headers = ["User ID", "Full Name", "Email", "Phone", "Role", "Created At"];
          const rows = res.data.map((u) => [
            u.id,
            u.full_name || "N/A",
            u.email || "N/A",
            u.phone || "N/A",
            u.role,
            new Date(u.created_at).toISOString(),
          ]);
          const csvContent = [headers.join(","), ...rows.map((r) => r.map(val => `"${val}"`).join(","))].join("\n");
          downloadCSV("users_report.csv", csvContent);
        } else {
          toast.error("Export failed", "Failed to load users for report generation.");
        }
      } else if (reportType === "products") {
        const res = await api.getAdminProducts();
        if (res.success && res.data) {
          const headers = ["Product ID", "Product Name", "Category", "Price (INR)", "Stock Quantity", "Status"];
          const rows = res.data.map((p) => {
            const price = ((p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0) / 100).toFixed(2);
            const stock = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
            return [
              p.id,
              p.name,
              p.category?.name || "Uncategorized",
              price,
              stock,
              p.status,
            ];
          });
          const csvContent = [headers.join(","), ...rows.map((r) => r.map(val => `"${val}"`).join(","))].join("\n");
          downloadCSV("products_report.csv", csvContent);
        } else {
          toast.error("Export failed", "Failed to load products for report generation.");
        }
      } else {
        toast.error("Report unsupported", "Report type not supported for instant generation.");
      }
    } catch (e: any) {
      toast.error("Generation error", "Error generating report: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Platform Reports Generator</h1>
          <p className="text-xs text-ink-400 mt-0.5">Generate and download comprehensive spreadsheets of platform activities and marketplace listings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">Configure Report Exporter</h2>
              <p className="text-[10px] text-ink-400 mt-0.5">Select parameter fields to bundle into a spreadsheet.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Select Dataset
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                >
                  <option value="orders">Orders &amp; GMV Listings</option>
                  <option value="users">User Profiles &amp; Roles</option>
                  <option value="products">Catalog Products &amp; Stock Levels</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Compiling spreadsheet..." : "Generate and Export CSV"}
              </button>
            </div>
          </div>

          {/* Guidelines */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">Reporting Guidelines &amp; Compliance</h2>
              <p className="text-xs text-ink-500 leading-relaxed">
                Floria platform exports contain operational records, financial transaction metadata, and catalog inventories. Under compliance protocols, make sure:
              </p>
              <ul className="space-y-2 text-xs text-ink-600 list-disc pl-4">
                <li>Spreadsheets with personal identifiers (names, emails, phones) must never be shared publicly or stored in unencrypted drives.</li>
                <li>Financial metrics are computed server-side to maintain a consistent transaction ledger alignment.</li>
                <li>All administrative data downloads are logged in the immutable audit trail for security compliance.</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 p-3 bg-cream-50 rounded-xl text-[10px] text-ink-400">
              <AlertIcon size={14} className="flex-shrink-0" />
              <span>Large datasets with thousands of records are streamed directly from the server to minimize server-side memory foot-print.</span>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
