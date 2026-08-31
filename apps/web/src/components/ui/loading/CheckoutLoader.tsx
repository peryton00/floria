import React from "react";
import { FloriaIcon } from "@floria/icons";
import { Spinner } from "./Spinner";

export type CheckoutStep =
  | "idle"
  | "validating"
  | "creating-order"
  | "processing-payment"
  | "success"
  | "failure";

export interface CheckoutLoaderProps {
  step: CheckoutStep;
  message?: string;
}

const STEP_MESSAGES: Record<CheckoutStep, string> = {
  idle: "Preparing checkout...",
  validating: "Validating delivery address & stock eligibility...",
  "creating-order": "Creating server-authoritative master order...",
  "processing-payment": "Securing gateway payment lock...",
  success: "Payment verified & order confirmed!",
  failure: "Checkout payment processing failed.",
};

export function CheckoutLoader({ step, message }: CheckoutLoaderProps) {
  if (step === "idle") return null;

  const currentMessage = message || STEP_MESSAGES[step];
  const isSuccess = step === "success";
  const isFailure = step === "failure";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Checkout processing"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center mx-auto text-forest-700">
          {!isSuccess && !isFailure && <Spinner size="lg" ariaHidden />}
          {isSuccess && <FloriaIcon name="check_circle" size={32} className="text-emerald-600" />}
          {isFailure && <FloriaIcon name="error" size={32} className="text-red-600" />}
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            {isSuccess
              ? "Order Confirmed!"
              : isFailure
                ? "Payment Failed"
                : "Processing Order"}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed font-sans">
            {currentMessage}
          </p>
        </div>

        {/* Step Indicator Progress Pills */}
        <div className="flex justify-center items-center gap-1.5 pt-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === "validating"
                ? "w-6 bg-forest-600"
                : isSuccess ||
                    step === "creating-order" ||
                    step === "processing-payment"
                  ? "w-2 bg-emerald-600"
                  : "w-2 bg-stone-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === "creating-order"
                ? "w-6 bg-forest-600"
                : isSuccess || step === "processing-payment"
                  ? "w-2 bg-emerald-600"
                  : "w-2 bg-stone-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === "processing-payment"
                ? "w-6 bg-forest-600"
                : isSuccess
                  ? "w-2 bg-emerald-600"
                  : isFailure
                    ? "w-2 bg-red-500"
                    : "w-2 bg-stone-200"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
