import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import {
  motionTokens,
  FadeUp,
  AnimatedSection,
  WishlistHeartButton,
  CartBadgeAnimation,
} from "../index";

describe("Phase 3.18.2 Global Motion & Interaction System Test Suite", () => {
  it("1. Motion tokens conform to 4 motion hierarchy levels", () => {
    expect(motionTokens.duration.instant).toBe(100);
    expect(motionTokens.duration.normal).toBe(200);
    expect(motionTokens.duration.content).toBe(350);
    expect(motionTokens.duration.ambient).toBe(10000);
  });

  it("2. FadeUp primitive applies animation class and custom delays", () => {
    const { container } = render(<FadeUp delay={120}>Hero Headline</FadeUp>);
    const fadeDiv = container.firstElementChild as HTMLElement;
    expect(fadeDiv.className).toContain("animate-fade-up");
    expect(fadeDiv.style.animationDelay).toBe("120ms");
    expect(screen.getByText("Hero Headline")).toBeDefined();
  });

  it("3. WishlistHeartButton triggers micro-interaction scale animation on click", () => {
    const onToggle = vi.fn();
    render(<WishlistHeartButton active={false} onToggle={onToggle} />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("Add to wishlist");

    fireEvent.click(btn);
    expect(btn.className).toContain("animate-heart-pop");
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("4. CartBadgeAnimation triggers badge pulse when count increases", () => {
    const { rerender } = render(<CartBadgeAnimation count={2} />);
    const badge1 = screen.getByText("2");
    expect(badge1.className).toContain("animate-badge-pulse");

    rerender(<CartBadgeAnimation count={3} />);
    const badge2 = screen.getByText("3");
    expect(badge2.className).toContain("animate-badge-pulse");
  });

  it("5. AnimatedSection handles IntersectionObserver visibility reveal", () => {
    const { container } = render(
      <AnimatedSection delay={60}>
        <p>Section Content</p>
      </AnimatedSection>,
    );
    expect(screen.getByText("Section Content")).toBeDefined();
    const sectionDiv = container.firstElementChild as HTMLElement;
    expect(sectionDiv.style.transitionDelay).toBe("60ms");
  });
});
