import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "../ToastContext";

function TestComponent() {
  const { toast } = useToast();

  return (
    <div>
      <button
        onClick={() => toast.success("Success Title", "Success Description")}
      >
        Trigger Success
      </button>
      <button onClick={() => toast.error("Error Title", "Error Description")}>
        Trigger Error
      </button>
      <button
        onClick={() => toast.warning("Warning Title", "Warning Description")}
      >
        Trigger Warning
      </button>
      <button onClick={() => toast.info("Info Title", "Info Description")}>
        Trigger Info
      </button>
      <button
        onClick={() => {
          const id = toast.loading("Loading Title");
          setTimeout(() => {
            toast.update(id, {
              type: "success",
              title: "Updated Success Title",
            });
          }, 100);
        }}
      >
        Trigger Loading & Update
      </button>
      <button
        onClick={() => {
          toast.success("Dedupe Title", "Same Description");
          toast.success("Dedupe Title", "Same Description");
        }}
      >
        Trigger Duplicate
      </button>
      <button
        onClick={() => {
          toast.info("Toast 1");
          toast.info("Toast 2");
          toast.info("Toast 3");
          toast.info("Toast 4");
        }}
      >
        Trigger Multiple Queue
      </button>
    </div>
  );
}

describe("Toast System (Phase 3.18)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders success toast when triggered", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Success"));

    expect(screen.getByText("Success Title")).toBeInTheDocument();
    expect(screen.getByText("Success Description")).toBeInTheDocument();
  });

  it("renders error, warning, and info toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Error"));
    expect(screen.getByText("Error Title")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Trigger Warning"));
    expect(screen.getByText("Warning Title")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Trigger Info"));
    expect(screen.getByText("Info Title")).toBeInTheDocument();
  });

  it("updates a loading toast to success", async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Loading & Update"));
    expect(screen.getByText("Loading Title")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText("Updated Success Title")).toBeInTheDocument();
  });

  it("deduplicates identical toasts within window", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Duplicate"));
    const items = screen.getAllByText("Dedupe Title");
    expect(items.length).toBe(1);
  });

  it("enforces maximum 3 visible simultaneous toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Multiple Queue"));

    // Toast 4, Toast 3, Toast 2 should be visible (max 3 visible)
    expect(screen.getByText("Toast 4")).toBeInTheDocument();
    expect(screen.getByText("Toast 3")).toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
    expect(screen.queryByText("Toast 1")).toBeNull();
  });

  it("allows manual dismissal via close button", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Success"));
    expect(screen.getByText("Success Title")).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Dismiss notification");
    fireEvent.click(closeButton);

    expect(screen.queryByText("Success Title")).toBeNull();
  });

  it("auto dismisses success toast after default duration (4s)", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Success"));
    expect(screen.getByText("Success Title")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(screen.queryByText("Success Title")).toBeNull();
  });
});
