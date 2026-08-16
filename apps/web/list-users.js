const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://flymwzdtsrkiiriqaswc.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY environment variable is required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAdminUser() {
  const adminId = "76690017-7811-4fa3-9246-c3a7264e1741";
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(adminId);
  
  if (userError) {
    console.error("Error fetching admin user details:", userError.message);
  } else if (user) {
    console.log("=== Admin Account Details ===");
    console.log(`Email: ${user.user.email}`);
    console.log(`ID: ${user.user.id}`);
    console.log(`Created At: ${user.user.created_at}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", adminId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError.message);
  } else if (profile) {
    console.log("=== Admin Profile Details ===");
    console.log(`Full Name: ${profile.full_name}`);
    console.log(`Role: ${profile.role}`);
  }
}

checkAdminUser();
