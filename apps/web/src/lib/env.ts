// Floria — environment variable validation
// Called at module load — throws clearly if required vars are missing.
// Server-only vars are validated here; never send service_role key to client.
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is accepted as an alias for NEXT_PUBLIC_SUPABASE_ANON_KEY.

function validateEnv(): {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string | undefined;
  NEXT_PUBLIC_APP_URL: string;
} {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  // Accept either the standard ANON_KEY or the newer PUBLISHABLE_KEY alias
  const anonKey =
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !anonKey) {
    throw new Error(
      `[Floria] Missing required environment variables:\n${[
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)" : null,
      ]
        .filter(Boolean)
        .join("\n")}\n\nCopy .env.example to .env.local and fill in the values.`
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    // Optional until Razorpay webhooks are wired — undefined in dev without key
    SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"],
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
  };
}

// ponytail: lazy singleton — validates once on first import
let _env: ReturnType<typeof validateEnv> | undefined;

export function getEnv() {
  if (!_env) _env = validateEnv();
  return _env;
}
