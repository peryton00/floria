// Floria — API response convention
// All API routes return { success: true, data } or { success: false, error: { code, message } }
// Never expose stack traces or raw DB errors to the browser.

import "server-only";

import { NextResponse } from "next/server";
import { FloriaError } from "./errors";

export interface ApiOk<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiOk<T> | ApiError;

/** Successful JSON response */
export function ok<T>(data: T, status = 200): NextResponse<ApiOk<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/** Error JSON response from a FloriaError */
export function fail(err: FloriaError): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code: err.code, message: err.message } },
    { status: err.status },
  );
}

/**
 * Wraps a route handler. Catches FloriaError and unknown errors uniformly.
 * Use in every API route handler to avoid ad-hoc try/catch repetition.
 */
export async function handleRoute<T>(
  fn: () => Promise<NextResponse<ApiOk<T>>>,
): Promise<NextResponse<ApiOk<T> | ApiError>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof FloriaError) return fail(e);
    console.error("[Floria] Unhandled route error:", e);
    const { Errors } = await import("./errors");
    return fail(Errors.internal());
  }
}
