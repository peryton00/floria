import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, CountBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, FieldError } from "@/components/ui/ErrorState";

// Smoke tests for UI primitives — fail if rendering crashes or semantics break.
// One runnable check per non-trivial component.

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders all variants without crashing", () => {
    const variants = [
      "default",
      "forest",
      "success",
      "warning",
      "error",
      "info",
    ] as const;
    for (const variant of variants) {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
      unmount();
    }
  });
});

describe("CountBadge", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<CountBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows count", () => {
    render(<CountBadge count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps at max", () => {
    render(<CountBadge count={150} max={99} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No plants yet"
        description="Browse categories to add plants."
      />,
    );
    expect(screen.getByText("No plants yet")).toBeInTheDocument();
    expect(
      screen.getByText("Browse categories to add plants."),
    ).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("renders with default title", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("has alert role", () => {
    render(<ErrorState />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("FieldError", () => {
  it("renders nothing when message is undefined", () => {
    const { container } = render(<FieldError message={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders message", () => {
    render(<FieldError message="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });
});
