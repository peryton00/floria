// Floria Media Infrastructure — Media API Express Controller
import { Request, Response, NextFunction } from "express";
import { MediaService } from "./media.service.js";
import { Errors } from "../utils/errors.js";

export async function createUploadSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(Errors.authRequired());
    }

    // Support single session object OR batch array (up to 10)
    if (Array.isArray(req.body)) {
      const sessions = await MediaService.createBatchUploadSessions(req.user, req.body);
      res.status(201).json({
        success: true,
        data: sessions,
      });
      return;
    }

    const session = await MediaService.createUploadSession(req.user, req.body);
    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

export async function completeUploadSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(Errors.authRequired());
    }

    const sessionIdParam = req.params.sessionId;
    const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
    if (!sessionId) {
      return next(Errors.validation("Parameter 'sessionId' is required."));
    }

    const result = await MediaService.completeUploadSession(req.user, sessionId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUploadSessionStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(Errors.authRequired());
    }

    const sessionIdParam = req.params.sessionId;
    const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
    if (!sessionId) {
      return next(Errors.validation("Parameter 'sessionId' is required."));
    }

    const result = await MediaService.getUploadSessionStatus(req.user, sessionId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
