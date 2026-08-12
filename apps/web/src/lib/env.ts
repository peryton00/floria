// Floria — environment variable validation
// Called at module load — throws clearly if required vars are missing.
// Server-only vars are validated here; never send service_role key to client.

const requiredServer = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

function validateEnv(): {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string | undefined;
  NEXT_PUBLIC_APP_URL: string;
} {
  const missing: string[] = [];

  for (const key of requiredServer) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(
      `[Floria] Missing required environment variables:\n${missing.join("\n")}\n\nCopy .env.example to .env.local and fill in the values.`
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    // Optional until Razorpay webhooks are wired — undefined in dev without Supabase
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
