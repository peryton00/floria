// Floria API — Immutable Seller Earnings Ledger Service
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";

export interface SellerBalanceSummary {
  sellerId: string;
  pendingEarningsPaise: number;
  availableEarningsPaise: number;
  paidEarningsPaise: number;
  refundedEarningsPaise: number;
}

export class LedgerService {
  async getSellerBalance(sellerId: string): Promise<SellerBalanceSummary> {
    const db = getAdminDb();
    const { data: entries, error } = await db
      .from("seller_ledger_entries")
      .select("balance_state, amount_paise, entry_type")
      .eq("seller_id", sellerId);

    if (error) throw Errors.database("Failed to fetch seller ledger entries.");

    let pendingEarningsPaise = 0;
    let availableEarningsPaise = 0;
    let paidEarningsPaise = 0;
    let refundedEarningsPaise = 0;

    for (const e of entries || []) {
      const amt = Number(e.amount_paise || 0);
      if (e.balance_state === "pending" && e.entry_type === "earning_credit") {
        pendingEarningsPaise += amt;
      } else if (e.balance_state === "available" && e.entry_type === "earning_credit") {
        availableEarningsPaise += amt;
      } else if (e.entry_type === "payout_debit" || e.balance_state === "paid") {
        paidEarningsPaise += Math.abs(amt);
      } else if (e.entry_type === "refund_debit" || e.balance_state === "refunded") {
        refundedEarningsPaise += Math.abs(amt);
      }
    }

    return {
      sellerId,
      pendingEarningsPaise,
      availableEarningsPaise,
      paidEarningsPaise,
      refundedEarningsPaise,
    };
  }

  async markOrderEarningsAvailable(masterOrderId: string): Promise<number> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("seller_ledger_entries")
      .update({ balance_state: "available" })
      .eq("order_id", masterOrderId)
      .eq("balance_state", "pending")
      .select("id");

    if (error) console.error("[LedgerService] Error marking earnings available:", error);
    return data?.length ?? 0;
  }

  async getSellerLedgerEntries(sellerId: string, limit = 50) {
    const db = getAdminDb();
    const { data, error } = await db
      .from("seller_ledger_entries")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw Errors.database("Failed to fetch ledger history.");
    return data ?? [];
  }
}

export const ledgerService = new LedgerService();
