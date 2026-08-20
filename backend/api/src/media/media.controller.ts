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

export async function updateSellerLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(Errors.authRequired());
    const { DomainMediaService } = await import("./domain-media.service.js");
    const result = await DomainMediaService.updateSellerLogo(req.user, req.body.assetId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateUserAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(Errors.authRequired());
    const { DomainMediaService } = await import("./domain-media.service.js");
    const result = await DomainMediaService.updateUserAvatar(req.user, req.body.assetId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(Errors.authRequired());
    const { DomainMediaService } = await import("./domain-media.service.js");
    const categoryId = req.params.categoryId as string;
    const result = await DomainMediaService.updateCategoryBanner(req.user, categoryId, req.body.assetId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function attachReviewImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(Errors.authRequired());
    const { DomainMediaService } = await import("./domain-media.service.js");
    const reviewId = req.params.reviewId as string;
    const result = await DomainMediaService.attachReviewImage(req.user, reviewId, req.body.assetId, req.body.displayOrder);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function attachSellerDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(Errors.authRequired());
    const { DomainMediaService } = await import("./domain-media.service.js");
    const result = await DomainMediaService.attachSellerDocument(req.user, req.body.documentType, req.body.fileAssetId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getSignedDocumentUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(Errors.authRequired());
    const { DomainMediaService } = await import("./domain-media.service.js");
    const documentId = req.params.documentId as string;
    const result = await DomainMediaService.getSignedDocumentUrl(req.user, documentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateNurseryBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(Errors.authRequired());
    const { DomainMediaService } = await import("./domain-media.service.js");
    const result = await DomainMediaService.updateNurseryBanner(req.user, req.body.assetId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
