// Floria API — Operations Controller
import { Request, Response, NextFunction } from "express";
import { operationsService } from "./operations.service.js";

export class OperationsController {
  async getHealth(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: { status: "healthy", role: req.user!.role },
    });
  }

  async getDashboard(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const stats = await operationsService.getDashboard();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const orders = await operationsService.getOrders(status, search);
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await operationsService.getOrderById(
        req.params.id as string,
      );
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orderId = req.params.id as string;
      const status = req.body.status || req.body.newStatus;
      const updated = await operationsService.updateOrderStatus(
        req.user!.id,
        orderId,
        status,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getPickups(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const pickups = await operationsService.getPickups(status);
      res.json({ success: true, data: pickups });
    } catch (err) {
      next(err);
    }
  }

  async updatePickupStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orderId = req.params.id as string;
      const { status, notes } = req.body;
      const updated = await operationsService.updatePickupStatus(
        req.user!.id,
        orderId,
        status,
        notes,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getPackingTasks(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const tasks = await operationsService.getPackingTasks(status);
      res.json({ success: true, data: tasks });
    } catch (err) {
      next(err);
    }
  }

  async updatePackingTask(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orderId = req.params.id as string;
      const { status, verifiedItemsCount } = req.body;
      const updated = await operationsService.updatePackingTask(
        req.user!.id,
        orderId,
        status,
        verifiedItemsCount,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getDeliveries(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const deliveries = await operationsService.getDeliveries(status, req.user);
      res.json({ success: true, data: deliveries });
    } catch (err) {
      next(err);
    }
  }

  async getDeliveryById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const delivery = await operationsService.getDeliveryById(
        req.params.id as string,
        req.user,
      );
      res.json({ success: true, data: delivery });
    } catch (err) {
      next(err);
    }
  }

  async assignDelivery(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orderId = req.body.orderId || req.params.id;
      const assignedTo = req.body.assignedTo || req.body.assigned_to;
      const partnerId = req.body.partnerId || req.body.partner_id;
      const delivery = await operationsService.assignDelivery(
        req.user!.id,
        orderId,
        assignedTo,
        partnerId,
      );
      res.status(201).json({ success: true, data: delivery });
    } catch (err) {
      next(err);
    }
  }

  async reassignDelivery(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const deliveryId = req.params.id as string;
      const assignedTo = req.body.assignedTo || req.body.assigned_to;
      const partnerId = req.body.partnerId || req.body.partner_id;
      const updated = await operationsService.reassignDelivery(
        req.user!.id,
        deliveryId,
        assignedTo,
        partnerId,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async updateDeliveryStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const deliveryId = req.params.id as string;
      const status = req.body.status;
      const updated = await operationsService.updateDeliveryStatus(
        req.user!.id,
        deliveryId,
        status,
        req.user,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async completeDeliveryWithPod(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const deliveryId = req.params.id as string;
      const { podAssetId, recipientName, notes } = req.body;
      const updated = await operationsService.completeDeliveryWithPod(
        req.user!,
        deliveryId,
        podAssetId,
        recipientName,
        notes,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getDeliveryPod(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const deliveryId = req.params.id as string;
      const podDetails = await operationsService.getDeliveryPod(
        req.user!,
        deliveryId,
      );
      res.json({ success: true, data: podDetails });
    } catch (err) {
      next(err);
    }
  }
}

export const operationsController = new OperationsController();
