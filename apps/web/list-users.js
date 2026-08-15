const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://flymwzdtsrkiiriqaswc.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseW13emR0c3JraWlyaXFhc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcwMTI0MSwiZXhwIjoyMTAyMjc3MjQxfQ.9NJtBhQA1TkOEknoI9-3UV_g8ObkjHdN5zkqlQ_bSWo";

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
