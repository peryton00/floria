import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProductPriceBlock } from "../ProductPriceBlock";
import { DeliveryBenefit } from "../DeliveryBenefit";
import { ValueSummary } from "../ValueSummary";

describe("Phase 3.18.3 Customer Value & Pricing Presentation System", () => {
  describe("ProductPriceBlock", () => {
    it("renders final selling price prominently", () => {
      render(<ProductPriceBlock sellingPricePaise={54100} />);
      expect(screen.getByText("₹541")).toBeInTheDocument();
    });

    it("renders strikethrough and discount percentage only when legitimate comparison price exists", () => {
      render(
        <ProductPriceBlock
          sellingPricePaise={54100}
          originalPricePaise={64100}
          discountPercentage={15}
        />,
      );
      expect(screen.getByText("₹541")).toBeInTheDocument();
      expect(screen.getByText("₹641")).toBeInTheDocument();
      expect(screen.getByText("15% OFF")).toBeInTheDocument();
      expect(screen.getByText(/You save ₹100/i)).toBeInTheDocument();
    });

    it("does NOT render discount or savings when no comparison price exists", () => {
      render(<ProductPriceBlock sellingPricePaise={54100} />);
      expect(screen.getByText("₹541")).toBeInTheDocument();
      expect(screen.queryByText(/OFF/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/You save/i)).not.toBeInTheDocument();
    });
  });

  describe("DeliveryBenefit", () => {
    it("renders FREE DELIVERY badge when product qualifies", () => {
      render(<DeliveryBenefit isFreeDelivery={true} />);
      expect(screen.getByText("FREE DELIVERY")).toBeInTheDocument();
    });

    it("renders standard delivery fee when product does not qualify for free delivery", () => {
      render(
        <DeliveryBenefit isFreeDelivery={false} baseDeliveryFeePaise={4000} />,
      );
      expect(
        screen.getByText(/Standard Delivery \(₹40\)/i),
      ).toBeInTheDocument();
    });
  });

  describe("ValueSummary", () => {
    it("renders rating and review count when reviews exist", () => {
      render(
        <ValueSummary
          isFreeDelivery={true}
          isVerifiedSeller={true}
          sellerName="Green Leaf Nursery"
          rating={4.7}
          reviewCount={128}
        />,
      );
      expect(
        screen.getByText(/4.7★ rating from 128 customers/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Verified nursery \(Green Leaf Nursery\)/i),
      ).toBeInTheDocument();
    });

    it("renders fresh quality guarantee when zero reviews exist", () => {
      render(
        <ValueSummary
          isFreeDelivery={false}
          isVerifiedSeller={false}
          rating={0}
          reviewCount={0}
        />,
      );
      expect(
        screen.getByText(/Fresh quality plant guarantee/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/5.0★/i)).not.toBeInTheDocument();
    });
  });
});
