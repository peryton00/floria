// Floria Seller Web — Legacy OAuth Callback Safe Redirection
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", req.url));
}
