// Floria — Next.js Server-Side Route Protection & Proxy (auth session refresh)
// Next.js 16 uses src/proxy.ts as the server middleware entry point.
// Architecture: Request → Proxy → Auth check → Role & Status Authorization → Route / API / RLS

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

type CookieEntry = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

// Protected Route Patterns
const CUSTOMER_ROUTES = ["/account", "/orders", "/checkout"];
const SELLER_OPERATIONAL_ROUTES = [
  "/seller/dashboard",
  "/seller/products",
  "/seller/orders",
  "/seller/payouts",
];
const SELLER_PROFILE_ROUTE = "/seller/profile";
const OPERATIONS_ROUTES = ["/operations"];
const ADMIN_ROUTES = ["/admin"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieEntry[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(
            name,
            value,
            options as Parameters<typeof supabaseResponse.cookies.set>[2],
          ),
        );
      },
    },
  });

  // 1. Authenticate identity with Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "customer";
  if (user) {
    const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (serviceKey && url) {
      const serviceClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: profile } = await serviceClient
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = profile?.role || "customer";
    } else {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = profile?.role || "customer";
    }
  }

  // Helper for JSON API error response
  const jsonError = (code: string, message: string, status: number) => {
    return NextResponse.json(
      { success: false, error: { code, message } },
      { status },
    );
  };

  // Helper for web redirect
  const redirectToLogin = (targetPath: string) => {
    let loginPath = "/login";
    if (targetPath.startsWith("/admin")) {
      loginPath = "/admin/login";
    } else if (targetPath.startsWith("/seller")) {
      loginPath = "/seller/login";
    } else if (targetPath.startsWith("/operations")) {
      loginPath = "/operations/login";
    }
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  };

  const redirectToHome = () => NextResponse.redirect(new URL("/", request.url));

  // Public Auth Routes (login/signup/callback) bypass proxy protection
  const PUBLIC_AUTH_ROUTES = [
    "/admin/login",
    "/seller/login",
    "/seller/register",
    "/operations/login",
    "/login",
    "/signup",
    "/auth/callback",
  ];

  if (PUBLIC_AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // 2. Check Customer Protected Routes
  const isCustomerRoute = CUSTOMER_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isCustomerRoute && !user) {
    if (pathname.startsWith("/api/")) {
      return jsonError("AUTH_REQUIRED", "Authentication required.", 401);
    }
    return redirectToLogin(pathname);
  }

  // 3. Check Seller Routes
  const isSellerOperational = SELLER_OPERATIONAL_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isSellerProfile = pathname.startsWith(SELLER_PROFILE_ROUTE);
  const isSellerApi = pathname.startsWith("/api/seller/");

  if (isSellerOperational || isSellerProfile || isSellerApi) {
    if (!user) {
      if (isSellerApi)
        return jsonError("AUTH_REQUIRED", "Authentication required.", 401);
      return redirectToLogin(pathname);
    }

    if (role !== "seller" && role !== "admin" && role !== "super_admin") {
      if (isSellerApi)
        return jsonError("FORBIDDEN", "Seller role required.", 403);
      return redirectToHome();
    }

    // Check seller status for operational routes
    if (
      isSellerOperational ||
      (isSellerApi && !pathname.includes("/seller/profile"))
    ) {
      const { data: sp } = await supabase
        .from("seller_profiles")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      const sellerStatus = sp?.status || "pending";

      if (
        sellerStatus !== "approved" &&
        role !== "admin" &&
        role !== "super_admin"
      ) {
        if (isSellerApi) {
          return jsonError(
            "FORBIDDEN",
            sellerStatus === "suspended"
              ? "Seller account is suspended."
              : "Seller account pending approval.",
            403,
          );
        }
        // Redirect pending/suspended sellers to their profile / onboarding page
        return NextResponse.redirect(new URL("/seller/profile", request.url));
      }
    }
  }

  // 4. Check Operations Routes
  const isOperationsRoute = OPERATIONS_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isOperationsApi = pathname.startsWith("/api/operations/");

  if (isOperationsRoute || isOperationsApi) {
    if (!user) {
      if (isOperationsApi)
        return jsonError("AUTH_REQUIRED", "Authentication required.", 401);
      return redirectToLogin(pathname);
    }

    if (role !== "operations" && role !== "admin" && role !== "super_admin") {
      if (isOperationsApi)
        return jsonError(
          "FORBIDDEN",
          "Operations or Admin role required.",
          403,
        );
      return redirectToHome();
    }
  }

  // 5. Check Admin Routes
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (isAdminRoute || isAdminApi) {
    if (!user) {
      if (isAdminApi)
        return jsonError("AUTH_REQUIRED", "Authentication required.", 401);
      return redirectToLogin(pathname);
    }

    if (role !== "admin" && role !== "super_admin") {
      if (isAdminApi)
        return jsonError("FORBIDDEN", "Admin role required.", 403);
      return redirectToHome();
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
