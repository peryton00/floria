"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadSession = createUploadSession;
exports.completeUploadSession = completeUploadSession;
exports.getUploadSessionStatus = getUploadSessionStatus;
const media_service_js_1 = require("./media.service.js");
const errors_js_1 = require("../utils/errors.js");
async function createUploadSession(req, res, next) {
    try {
        if (!req.user) {
            return next(errors_js_1.Errors.authRequired());
        }
        // Support single session object OR batch array (up to 10)
        if (Array.isArray(req.body)) {
            const sessions = await media_service_js_1.MediaService.createBatchUploadSessions(req.user, req.body);
            res.status(201).json({
                success: true,
                data: sessions,
            });
            return;
        }
        const session = await media_service_js_1.MediaService.createUploadSession(req.user, req.body);
        res.status(201).json({
            success: true,
            data: session,
        });
    }
    catch (err) {
        next(err);
    }
}
async function completeUploadSession(req, res, next) {
    try {
        if (!req.user) {
            return next(errors_js_1.Errors.authRequired());
        }
        const sessionIdParam = req.params.sessionId;
        const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
        if (!sessionId) {
            return next(errors_js_1.Errors.validation("Parameter 'sessionId' is required."));
        }
        const result = await media_service_js_1.MediaService.completeUploadSession(req.user, sessionId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getUploadSessionStatus(req, res, next) {
    try {
        if (!req.user) {
            return next(errors_js_1.Errors.authRequired());
        }
        const sessionIdParam = req.params.sessionId;
        const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
        if (!sessionId) {
            return next(errors_js_1.Errors.validation("Parameter 'sessionId' is required."));
        }
        const result = await media_service_js_1.MediaService.getUploadSessionStatus(req.user, sessionId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}
