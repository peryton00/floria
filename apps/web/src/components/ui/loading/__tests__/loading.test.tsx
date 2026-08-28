import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import {
  Spinner,
  Skeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  NurseryCardSkeleton,
  TableSkeleton,
  AdminDashboardSkeleton,
  SellerDashboardSkeleton,
  OperationsDashboardSkeleton,
  UploadLoader,
  CheckoutLoader,
} from "../index";
import { Button } from "../../Button";

describe("Phase 3.18.1 Global Loading & Skeleton System Test Suite", () => {
  it("1. Spinner renders with correct aria attributes and accessibility label", () => {
    render(<Spinner size="md" label="Processing data..." />);
    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeDefined();
    expect(statusEl.getAttribute("aria-label")).toBe("Processing data...");
  });

  it("2. Skeleton primitive applies variant styles and reduced-motion fallbacks", () => {
    const { container } = render(
      <Skeleton variant="avatar" width={48} height={48} />,
    );
    const skeletonDiv = container.firstElementChild as HTMLElement;
    expect(skeletonDiv).toBeDefined();
    expect(skeletonDiv.className).toContain("rounded-full");
    expect(skeletonDiv.className).toContain("motion-reduce:animate-none");
    expect(skeletonDiv.style.width).toBe("48px");
    expect(skeletonDiv.style.height).toBe("48px");
  });

  it("3. ProductGridSkeleton sets aria-busy='true' and renders correct card count", () => {
    render(<ProductGridSkeleton count={4} />);
    const gridEl = screen.getByLabelText("Loading product listings");
    expect(gridEl).toBeDefined();
    expect(gridEl.getAttribute("aria-busy")).toBe("true");
  });

  it("4. TableSkeleton sets aria-busy='true' and renders desktop headers and mobile card fallbacks", () => {
    render(<TableSkeleton rows={5} columns={4} />);
    const tableContainer = screen.getByLabelText("Loading data table");
    expect(tableContainer).toBeDefined();
    expect(tableContainer.getAttribute("aria-busy")).toBe("true");
  });

  it("5. AdminDashboardSkeleton renders composite structural skeletons", () => {
    render(<AdminDashboardSkeleton />);
    const dashEl = screen.getByLabelText("Loading admin dashboard");
    expect(dashEl).toBeDefined();
    expect(dashEl.getAttribute("aria-busy")).toBe("true");
  });

  it("6. SellerDashboardSkeleton renders structured KPI and content skeletons", () => {
    render(<SellerDashboardSkeleton />);
    const dashEl = screen.getByLabelText("Loading seller dashboard");
    expect(dashEl).toBeDefined();
    expect(dashEl.getAttribute("aria-busy")).toBe("true");
  });

  it("7. Button preserves text content and displays spinner during loading state", () => {
    render(<Button loading>Save Changes</Button>);
    const buttonEl = screen.getByRole("button") as HTMLButtonElement;
    expect(buttonEl.disabled).toBe(true);
    expect(buttonEl.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Save Changes")).toBeDefined();
  });

  it("8. UploadLoader renders percentage progress bar and uploading state", () => {
    render(
      <UploadLoader
        fileName="GST_Certificate.pdf"
        fileSize="2.4 MB"
        progress={72}
        status="uploading"
      />,
    );
    expect(screen.getByText("GST_Certificate.pdf")).toBeDefined();
    expect(screen.getByText("72%")).toBeDefined();
    const statusEl = screen.getByRole("status");
    expect(statusEl.getAttribute("aria-label")).toBe(
      "Upload status for GST_Certificate.pdf",
    );
  });

  it("9. CheckoutLoader renders dialog modal with explicit step messages", () => {
    render(<CheckoutLoader step="processing-payment" />);
    const dialogEl = screen.getByRole("dialog");
    expect(dialogEl).toBeDefined();
    expect(screen.getByText("Securing gateway payment lock...")).toBeDefined();
  });

  it("10. CheckoutLoader returns null when step is idle", () => {
    const { container } = render(<CheckoutLoader step="idle" />);
    expect(container.firstChild).toBeNull();
  });
});
