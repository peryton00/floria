import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
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
          {isSuccess && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
          {isFailure && <AlertCircle className="w-8 h-8 text-red-600" />}
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">
            {isSuccess ? "Order Confirmed!" : isFailure ? "Checkout Error" : "Processing Your Order"}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">{currentMessage}</p>
        </div>

        {!isSuccess && !isFailure && (
          <div className="p-3 bg-cream-50 rounded-xl border border-stone-200/60 text-[11px] text-stone-500">
            Please do not refresh or close this window while we secure your plants.
          </div>
        )}
      </div>
    </div>
  );
}
