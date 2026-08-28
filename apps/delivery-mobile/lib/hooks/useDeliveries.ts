// Floria Delivery Mobile — Deliveries Data Access Hook (Step 5B.1)
// Architecture: Screen → Hook → @floria/api-client → Express REST API → Supabase
import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type {
  DeliveryAssignment,
  DeliveryAssignmentStatus,
} from "@floria/types";

export function useDeliveries(filterStatus?: string) {
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDeliveries(
        filterStatus ? { status: filterStatus } : undefined,
      );
      if (res.success && res.data) {
        setDeliveries(res.data);
      } else {
        setError(res.error?.message || "Failed to load assigned deliveries");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to Floria operations service");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return {
    deliveries,
    loading,
    error,
    refresh: fetchDeliveries,
  };
}

export function useDeliveryDetail(deliveryId: string | undefined) {
  const [delivery, setDelivery] = useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchDelivery = useCallback(async () => {
    if (!deliveryId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDeliveryById(deliveryId);
      if (res.success && res.data) {
        setDelivery(res.data);
      } else {
        setError(res.error?.message || "Failed to load delivery details");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to Floria operations service");
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  const updateStatus = useCallback(
    async (newStatus: DeliveryAssignmentStatus | string) => {
      if (!deliveryId) return { success: false, error: "No delivery ID" };
      try {
        setUpdating(true);
        const res = await api.updateDeliveryStatus(deliveryId, newStatus);
        if (res.success && res.data) {
          setDelivery(res.data);
          return { success: true, data: res.data };
        } else {
          return {
            success: false,
            error: res.error?.message || "Status transition rejected",
          };
        }
      } catch (e: any) {
        return {
          success: false,
          error: e.message || "Network error updating status",
        };
      } finally {
        setUpdating(false);
      }
    },
    [deliveryId],
  );

  const completeWithPod = useCallback(
    async (payload: {
      podAssetId: string;
      recipientName?: string;
      notes?: string;
    }) => {
      if (!deliveryId) return { success: false, error: "No delivery ID" };
      try {
        setUpdating(true);
        const res = await api.completeDeliveryWithPod(deliveryId, payload);
        if (res.success && res.data) {
          setDelivery(res.data);
          return { success: true, data: res.data };
        } else {
          return {
            success: false,
            error: res.error?.message || "Delivery completion rejected",
          };
        }
      } catch (e: any) {
        return {
          success: false,
          error: e.message || "Network error completing delivery",
        };
      } finally {
        setUpdating(false);
      }
    },
    [deliveryId],
  );

  const getPod = useCallback(async () => {
    if (!deliveryId) return { success: false, error: "No delivery ID" };
    try {
      const res = await api.getDeliveryPod(deliveryId);
      if (res.success && res.data) {
        return { success: true, data: res.data };
      } else {
        return {
          success: false,
          error: res.error?.message || "Failed to load proof of delivery",
        };
      }
    } catch (e: any) {
      return {
        success: false,
        error: e.message || "Network error loading proof of delivery",
      };
    }
  }, [deliveryId]);

  return {
    delivery,
    loading,
    updating,
    error,
    refresh: fetchDelivery,
    updateStatus,
    completeWithPod,
    getPod,
  };
}
