"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsController = exports.OperationsController = void 0;
const operations_service_js_1 = require("./operations.service.js");
class OperationsController {
    async getHealth(req, res) {
        res.json({ success: true, data: { status: "healthy", role: req.user.role } });
    }
    async getDashboard(_req, res, next) {
        try {
            const stats = await operations_service_js_1.operationsService.getDashboard();
            res.json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrders(req, res, next) {
        try {
            const status = req.query.status;
            const search = req.query.search;
            const orders = await operations_service_js_1.operationsService.getOrders(status, search);
            res.json({ success: true, data: orders });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrderById(req, res, next) {
        try {
            const order = await operations_service_js_1.operationsService.getOrderById(req.params.id);
            res.json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
    async updateOrderStatus(req, res, next) {
        try {
            const orderId = req.params.id;
            const status = req.body.status || req.body.newStatus;
            const updated = await operations_service_js_1.operationsService.updateOrderStatus(req.user.id, orderId, status);
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    async getPickups(req, res, next) {
        try {
            const status = req.query.status;
            const pickups = await operations_service_js_1.operationsService.getPickups(status);
            res.json({ success: true, data: pickups });
        }
        catch (err) {
            next(err);
        }
    }
    async updatePickupStatus(req, res, next) {
        try {
            const orderId = req.params.id;
            const { status, notes } = req.body;
            const updated = await operations_service_js_1.operationsService.updatePickupStatus(req.user.id, orderId, status, notes);
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    async getPackingTasks(req, res, next) {
        try {
            const status = req.query.status;
            const tasks = await operations_service_js_1.operationsService.getPackingTasks(status);
            res.json({ success: true, data: tasks });
        }
        catch (err) {
            next(err);
        }
    }
    async updatePackingTask(req, res, next) {
        try {
            const orderId = req.params.id;
            const { status, verifiedItemsCount } = req.body;
            const updated = await operations_service_js_1.operationsService.updatePackingTask(req.user.id, orderId, status, verifiedItemsCount);
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    async getDeliveries(req, res, next) {
        try {
            const status = req.query.status;
            const deliveries = await operations_service_js_1.operationsService.getDeliveries(status);
            res.json({ success: true, data: deliveries });
        }
        catch (err) {
            next(err);
        }
    }
    async getDeliveryById(req, res, next) {
        try {
            const delivery = await operations_service_js_1.operationsService.getDeliveryById(req.params.id);
            res.json({ success: true, data: delivery });
        }
        catch (err) {
            next(err);
        }
    }
    async assignDelivery(req, res, next) {
        try {
            const orderId = req.body.orderId || req.params.id;
            const assignedTo = req.body.assignedTo || req.body.assigned_to;
            const delivery = await operations_service_js_1.operationsService.assignDelivery(req.user.id, orderId, assignedTo);
            res.status(201).json({ success: true, data: delivery });
        }
        catch (err) {
            next(err);
        }
    }
    async reassignDelivery(req, res, next) {
        try {
            const deliveryId = req.params.id;
            const assignedTo = req.body.assignedTo || req.body.assigned_to;
            const updated = await operations_service_js_1.operationsService.reassignDelivery(req.user.id, deliveryId, assignedTo);
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    async updateDeliveryStatus(req, res, next) {
        try {
            const deliveryId = req.params.id;
            const status = req.body.status;
            const updated = await operations_service_js_1.operationsService.updateDeliveryStatus(req.user.id, deliveryId, status);
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OperationsController = OperationsController;
exports.operationsController = new OperationsController();
