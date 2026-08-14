// Floria — Live Supabase DB Seed
const { createClient } = require("@supabase/supabase-js");

const url = "https://flymwzdtsrkiiriqaswc.supabase.co";
const key = "sb_publishable_RrZ1XlBXOQFW-A1Iwr1XeQ_ZxOK23gJ";

const supabase = createClient(url, key);

async function seedLiveDatabase() {
  console.log("🌱 Creating Seller Accounts & Products in Supabase...");

  const sellers = [
    {
      email: "greenleaf.nursery@floria.in",
      password: "Password123!",
      business_name: "Green Leaf Nursery",
      business_description: "Premium indoor and outdoor plants curated for urban homes. We specialize in low-maintenance tropicals and succulents.",
      phone: "+91 98765 43210",
      address: "12, Nursery Road, Sector 5, Raipur, Chhattisgarh, 492001",
      logo_url: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=300&auto=format&fit=crop&q=80",
    },
    {
      email: "nisarga.gardens@floria.in",
      password: "Password123!",
      business_name: "Nisarga Gardens",
      business_description: "Organic potted plants, flowering shrubs, and heritage garden care essentials.",
      phone: "+91 98765 43211",
      address: "88, Garden Street, VIP Road, Raipur, Chhattisgarh, 492006",
      logo_url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=300&auto=format&fit=crop&q=80",
    },
    {
      email: "clayco.pots@floria.in",
      password: "Password123!",
      business_name: "Clay & Co.",
      business_description: "Artisanal handcrafted terracotta planters, ceramic pots, and drainage solutions.",
      phone: "+91 98765 43212",
      address: "45, Potter Lane, Pottery Market, Raipur, Chhattisgarh, 492002",
      logo_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&auto=format&fit=crop&q=80",
    },
    {
      email: "saigarden.center@floria.in",
      password: "Password123!",
      business_name: "Sai Garden Center",
      business_description: "Exotic indoor foliage, flowering perennials, and heavy-duty gardening tools.",
      phone: "+91 98765 43213",
      address: "101, Green Highway, Shankar Nagar, Raipur, Chhattisgarh, 492007",
      logo_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&auto=format&fit=crop&q=80",
    },
  ];

  const sellerMap = {};

  for (const s of sellers) {
    let userId = null;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: s.email,
      password: s.password,
    });

    if (signUpData?.user) {
      userId = signUpData.user.id;
    } else {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: s.email,
        password: s.password,
      });
      if (signInData?.user) userId = signInData.user.id;
    }

    console.log(`Auth user for ${s.business_name}:`, userId || signUpError?.message);

    if (userId) {
      // Upsert user_profile
      await supabase.from("user_profiles").upsert({
        id: userId,
        role: "seller",
        full_name: s.business_name,
        phone: s.phone,
        avatar_url: s.logo_url,
      }, { onConflict: "id" });

      // Upsert seller_profile
      const { data: spData, error: spErr } = await supabase.from("seller_profiles").upsert({
        user_id: userId,
        business_name: s.business_name,
        business_description: s.business_description,
        contact_phone: s.phone,
        contact_email: s.email,
        address: s.address,
        logo_url: s.logo_url,
        status: "approved",
        is_active: true,
      }, { onConflict: "user_id" }).select().maybeSingle();

      if (spData) {
        sellerMap[s.business_name] = spData.id;
      } else {
        const { data: existingSp } = await supabase.from("seller_profiles").select("id").eq("user_id", userId).maybeSingle();
        if (existingSp) sellerMap[s.business_name] = existingSp.id;
      }
    }
  }

  console.log("Seller Profile Map:", sellerMap);

  const greenLeafId = sellerMap["Green Leaf Nursery"];
  const nisargaId = sellerMap["Nisarga Gardens"];
  const clayCoId = sellerMap["Clay & Co."];
  const saiGardenId = sellerMap["Sai Garden Center"];

  if (!greenLeafId) {
    console.log("Could not obtain seller profiles. Check auth response.");
    return;
  }

  // Seed Products
  const products = [
    {
      seller_id: greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000001",
      name: "Snake Plant (Sansevieria)",
      slug: "snake-plant",
      description: "Air-purifying indoor plant that thrives on low light and infrequent watering. Ideal for bedrooms and offices.",
      care_instructions: "Water every 2-3 weeks. Keep in indirect sunlight.",
      status: "active",
      price_paise: 29900,
      stock_quantity: 24,
      image_url: "https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000001",
      name: "Monstera Deliciosa",
      slug: "monstera-deliciosa",
      description: "Iconic Swiss cheese plant with large glossy split leaves. Brings a tropical jungle vibe to living rooms.",
      care_instructions: "Bright indirect light. Water when top 2 inches of soil feel dry.",
      status: "active",
      price_paise: 49900,
      stock_quantity: 15,
      image_url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000003",
      name: "Aloe Vera",
      slug: "aloe-vera",
      description: "Healing medicinal succulent known for its soothing gel leaves. Requires minimal maintenance.",
      care_instructions: "Full sun or bright light. Water sparingly.",
      status: "active",
      price_paise: 19900,
      stock_quantity: 30,
      image_url: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: nisargaId || greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000001",
      name: "Peace Lily (Spathiphyllum)",
      slug: "peace-lily",
      description: "Elegant white flowering indoor plant that filters air pollutants and indicates when it needs water.",
      care_instructions: "Low to medium indirect light. Keep soil moist.",
      status: "active",
      price_paise: 34900,
      stock_quantity: 18,
      image_url: "https://images.unsplash.com/photo-1593691509543-c55fb32e7355?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: nisargaId || greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000005",
      name: "Sweet Basil Organic Seeds",
      slug: "sweet-basil-seeds",
      description: "Non-GMO organic culinary basil seeds. Grows aromatic, lush leaves perfect for fresh pesto and Italian dishes.",
      care_instructions: "Sow 1/4 inch deep in well-drained fertile soil. Full sun.",
      status: "active",
      price_paise: 9900,
      stock_quantity: 50,
      image_url: "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: clayCoId || greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000006",
      name: "Terracotta Pot (Medium - 8 inch)",
      slug: "terracotta-pot-medium",
      description: "Handcrafted breathable clay pot with matching saucer. Ensures optimal root aeration for healthy plant growth.",
      care_instructions: "Wipe with damp cloth. Suitable for indoor and outdoor plants.",
      status: "active",
      price_paise: 14900,
      stock_quantity: 40,
      image_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: nisargaId || greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000004",
      name: "Vibrant Pink Bougainvillea",
      slug: "pink-bougainvillea",
      description: "Sun-loving tropical climber bursting with magenta blossoms. Drought resistant once established.",
      care_instructions: "Direct full sunlight. Water when soil dries out.",
      status: "active",
      price_paise: 27900,
      stock_quantity: 12,
      image_url: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: saiGardenId || greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000007",
      name: "Organic Vermicompost (5 kg)",
      slug: "organic-vermicompost-5kg",
      description: "100% pure organic bio-fertilizer enriched with soil microbes for vibrant plant growth.",
      care_instructions: "Mix 1-2 cups into topsoil every 30 days.",
      status: "active",
      price_paise: 24900,
      stock_quantity: 35,
      image_url: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: saiGardenId || greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000008",
      name: "Ergonomic Pruning Shears",
      slug: "ergonomic-pruning-shears",
      description: "Precision Japanese steel bypass pruner with non-slip handles for clean stem cuts.",
      care_instructions: "Clean blades after use and apply light mineral oil.",
      status: "active",
      price_paise: 39900,
      stock_quantity: 20,
      image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
    },
    {
      seller_id: greenLeafId,
      category_id: "00000000-0000-0000-0000-000000000001",
      name: "Golden Money Plant (Pothos)",
      slug: "golden-money-plant",
      description: "Classic trailing vine with heart-shaped variegated leaves. Brings prosperity and positive energy.",
      care_instructions: "Low to bright light. Water weekly.",
      status: "active",
      price_paise: 17900,
      stock_quantity: 45,
      image_url: "https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=600&auto=format&fit=crop&q=80",
    },
  ];

  for (const p of products) {
    const { data: prodData, error: prodErr } = await supabase.from("products").upsert({
      seller_id: p.seller_id,
      category_id: p.category_id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      care_instructions: p.care_instructions,
      status: p.status,
    }, { onConflict: "slug" }).select().maybeSingle();

    if (prodData) {
      await supabase.from("inventory").upsert({
        product_id: prodData.id,
        seller_id: p.seller_id,
        price_paise: p.price_paise,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: 5,
        sku: `SKU-${p.slug.toUpperCase().replace(/-/g, "")}`,
      }, { onConflict: "product_id" });

      await supabase.from("product_images").upsert({
        product_id: prodData.id,
        url: p.image_url,
        alt_text: p.name,
        display_order: 1,
        is_primary: true,
      });
    } else {
      console.error("Product insert error:", p.name, prodErr?.message);
    }
  }

  console.log("🎉 Complete Supabase Seed Finished!");
}

seedLiveDatabase();
