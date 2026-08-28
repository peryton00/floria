// Floria API — Reviews Controller
import { Request, Response, NextFunction } from "express";
import { reviewsService } from "./reviews.service.js";
import { reviewRepository } from "../database/repositories/review.repository.js";

export class ReviewsController {
  // GET /api/v1/catalog/products/:id/reviews
  async getProductReviews(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(
        50,
        Math.max(1, Number(req.query.pageSize) || 10),
      );
      const result = await reviewsService.getProductReviews(
        String(req.params.id),
        page,
        pageSize,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/catalog/products/:id/review-eligibility
  async getReviewEligibility(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.json({
          success: true,
          data: { canReview: false, reason: "NOT_LOGGED_IN" },
        });
        return;
      }
      const eligible = await reviewRepository.findEligibleOrderItem(
        customerId,
        String(req.params.id),
      );
      if (eligible) {
        res.json({
          success: true,
          data: { canReview: true, orderItemId: eligible.order_item_id },
        });
      } else {
        const userReview = await reviewRepository.findUserReviewForProduct(
          customerId,
          String(req.params.id),
        );
        if (userReview) {
          res.json({
            success: true,
            data: { canReview: false, reason: "ALREADY_REVIEWED", userReview },
          });
        } else {
          res.json({
            success: true,
            data: { canReview: false, reason: "NOT_ELIGIBLE" },
          });
        }
      }
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/v1/customer/reviews/:id
  async updateMyReview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { rating, title, body } = req.body;
      const updated = await reviewRepository.updateCustomerReview(
        String(req.params.id),
        req.user!.id,
        { rating: rating ? Number(rating) : undefined, title, body },
      );
      if (!updated) {
        res
          .status(404)
          .json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Review not found or not owned by user.",
            },
          });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/catalog/products/:id/reviews
  async submitReview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { rating, title, body } = req.body;
      const review = await reviewsService.submitReview(
        req.user!.id,
        String(req.params.id),
        { rating: Number(rating), title, body },
      );
      res.status(201).json({ success: true, data: review });
    } catch (err: any) {
      if (err.code === "ALREADY_REVIEWED") {
        res
          .status(409)
          .json({
            success: false,
            error: {
              code: "ALREADY_REVIEWED",
              message: "You have already reviewed this item.",
            },
          });
        return;
      }
      if (err.code === "NOT_ELIGIBLE") {
        res
          .status(403)
          .json({
            success: false,
            error: { code: "NOT_ELIGIBLE", message: err.message },
          });
        return;
      }
      next(err);
    }
  }

  // POST /api/v1/catalog/products/:id/reviews/:rid/helpful
  async markHelpful(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const action = await reviewRepository.toggleHelpful(
        String(req.params.rid),
        req.user!.id,
      );
      res.json({ success: true, data: { action } });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/customer/reviews
  async getMyReviews(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const result = await reviewRepository.findByCustomer(req.user!.id, page);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/seller/reviews
  async getSellerReviews(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { sellerId } = req.user!;
      if (!sellerId) {
        res
          .status(403)
          .json({
            success: false,
            error: { code: "NOT_SELLER", message: "Seller profile not found." },
          });
        return;
      }
      const page = Math.max(1, Number(req.query.page) || 1);
      const result = await reviewRepository.findBySeller(sellerId, page);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/v1/seller/reviews/:id/flag
  async flagReview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { sellerId } = req.user!;
      if (!sellerId) {
        res
          .status(403)
          .json({
            success: false,
            error: { code: "NOT_SELLER", message: "Seller profile not found." },
          });
        return;
      }
      const ok = await reviewRepository.flagReview(
        String(req.params.id),
        sellerId,
      );
      if (!ok) {
        res
          .status(404)
          .json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Review not found or not eligible to flag.",
            },
          });
        return;
      }
      res.json({ success: true, data: { flagged: true } });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/admin/reviews
  async adminListReviews(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await reviewRepository.findAll({
        status: req.query.status as string | undefined,
        productId: req.query.productId as string | undefined,
        page: Math.max(1, Number(req.query.page) || 1),
        pageSize: Math.min(50, Number(req.query.pageSize) || 30),
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/v1/admin/reviews/:id
  async adminModerateReview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { action, note } = req.body;
      if (!["approve", "reject", "hide"].includes(action)) {
        res
          .status(422)
          .json({
            success: false,
            error: {
              code: "INVALID_ACTION",
              message: "action must be approve, reject, or hide.",
            },
          });
        return;
      }
      const result = await reviewsService.moderateReview(
        String(req.params.id),
        action,
        note,
      );
      if (!result) {
        res
          .status(404)
          .json({
            success: false,
            error: { code: "NOT_FOUND", message: "Review not found." },
          });
        return;
      }
      res.json({ success: true, data: { moderated: true } });
    } catch (err) {
      next(err);
    }
  }
}

export const reviewsController = new ReviewsController();
