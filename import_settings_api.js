// import_settings_api.js
// Run: node import_settings_api.js
// Requires: CLOUDFLARE_API_TOKEN in environment or hardcoded below

const ACCOUNT_ID = 'c93dd2d793cd69c14d608f28abf2938c';
const DATABASE_ID = 'd77abb13-2f34-4b57-b8d4-6893338dce68';
// Get your API token from: https://dash.cloudflare.com/profile/api-tokens
// Create token with D1:Edit permission
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'YOUR_API_TOKEN_HERE';

const settings = [
  {
    "key": "size_tables",
    "value": "[{\"id\":\"table_1775540374264_59s1u4rmb8g\",\"name\":\"Compression Top Size\",\"unit\":\"cm\",\"columns\":[{\"id\":\"chest\",\"name\":\"Length\",\"description\":\"Measure from the highest point of the shoulder (near the collar) straight down to the bottom hem.\"},{\"id\":\"waist\",\"name\":\"Width\",\"description\":\"Lay the top flat. Measure straight across from one armpit to the other.\"}],\"rows\":[{\"id\":\"m\",\"label\":\"M\",\"values\":{\"chest\":\"63\",\"waist\":\"33\"}},{\"id\":\"l\",\"label\":\"L\",\"values\":{\"chest\":\"65\",\"waist\":\"35\"}},{\"id\":\"xl\",\"label\":\"XL\",\"values\":{\"chest\":\"68\",\"waist\":\"38\"}}]}]"
  },
  {
    "key": "finance_data",
    "value": "{\"batches\":[{\"id\":\"id_1775498835645_jolc2\",\"name\":\"FLEX 01 (Half-sleeve & Sleeveless)\",\"units\":102,\"production_cost\":61200,\"intl_shipping\":0,\"customs\":0,\"other\":0,\"date\":\"2026-04-06\",\"notes\":\"\"}],\"expenses\":[{\"id\":\"id_1775499075989_px1la\",\"label\":\"Facebook page boosting\",\"category\":\"Marketing / Ads\",\"amount\":326.91,\"date\":\"2026-04-06\",\"notes\":\"\"},{\"id\":\"id_1775886875087_8scog\",\"label\":\"AI subscription\",\"category\":\"Website / Tech\",\"amount\":6698.25,\"date\":\"2026-04-11\",\"notes\":\"\"}]}"
  },
  {
    "key": "hero_tagline_lineheight",
    "value": "1.5"
  },
  {
    "key": "free_delivery",
    "value": "true"
  },
  {
    "key": "banner_bg",
    "value": "#ffffff"
  },
  {
    "key": "delivery_rajshahi",
    "value": "100"
  },
  {
    "key": "delivery_rangpur",
    "value": "150"
  },
  {
    "key": "review_3_location",
    "value": "Sylhet"
  },
  {
    "key": "size_l_waist",
    "value": "35"
  },
  {
    "key": "size_m_hips",
    "value": "40-42"
  },
  {
    "key": "size_m_chest",
    "value": "63"
  },
  {
    "key": "delivery_other",
    "value": "150"
  },
  {
    "key": "about_story_body3",
    "value": "But Flextreme is more than gym wear. It represents a mindset.\n**A mindset of discipline.**\n**A mindset of relentless improvement.**\n**A mindset that refuses to settle.**\nWhen you wear Flextreme, you are not just wearing training apparel.\nYou are wearing a symbol of hard work, ambition, and the extreme pursuit of becoming stronger every day.\nWork Hard. Flex Extreme."
  },
  {
    "key": "banner_speed",
    "value": "60"
  },
  {
    "key": "size_rows",
    "value": "[{\"id\":\"m\",\"label\":\"M\",\"values\":{\"chest\":\"63\",\"waist\":\"33\"}},{\"id\":\"l\",\"label\":\"L\",\"values\":{\"chest\":\"65\",\"waist\":\"35\"}},{\"id\":\"xl\",\"label\":\"XL\",\"values\":{\"chest\":\"66\",\"waist\":\"38\"}}]"
  },
  {
    "key": "review_1_text",
    "value": "Finally gym wear that actually fits right. The compression tee is unreal — stays dry the whole session and looks clean."
  },
  {
    "key": "about_values_title",
    "value": "Our Values"
  },
  {
    "key": "hero_badge_opacity",
    "value": "0.5"
  },
  {
    "key": "delivery_bogra",
    "value": "150"
  },
  {
    "key": "delivery_narayanganj",
    "value": "150"
  },
  {
    "key": "hero_bg_video",
    "value": "https://rngqnqqvnnzscwevwbpj.supabase.co/storage/v1/object/public/products/hero-video-1776145106997.mp4"
  },
  {
    "key": "hero_tagline_opacity",
    "value": "0.8"
  },
  {
    "key": "stats_products",
    "value": "4"
  },
  {
    "key": "size_xs_hips",
    "value": "34-36"
  },
  {
    "key": "about_story_body1",
    "value": "Every great brand starts with a belief.\n\n**Flextreme** was created for people who refuse to stay average — people who push harder, train longer, and go beyond their limits."
  },
  {
    "key": "review_3_name",
    "value": "Usman R."
  },
  {
    "key": "business_hours",
    "value": " [{\"day\":\"Saturday – Thursday\",\"hours\":\"9:00 AM – 9:00 PM\"},{\"day\":\"Friday\",\"hours\":\"3:00 PM – 9:00 PM\"}]"
  },
  {
    "key": "about_story_title",
    "value": "The Flextreme Story"
  },
  {
    "key": "banner_text",
    "value": " “FLEX100 Membership — First 100 Only ⚡” Limited spots available  ✓ Cash on Delivery  ·  ✓ Pay when it arrives  ·  ✓ Zero advance payment"
  },
  {
    "key": "delivery_sylhet",
    "value": "150"
  },
  {
    "key": "size_unit",
    "value": "cm"
  },
  {
    "key": "size_xl_hips",
    "value": "46-48"
  },
  {
    "key": "delivery_groups",
    "value": "[{\"id\":\"dhaka\",\"name\":\"Dhaka Division\",\"zones\":[{\"id\":\"dhaka_city\",\"name\":\"Dhaka City\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"dhaka_district\",\"name\":\"Dhaka District\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"narayanganj\",\"name\":\"Narayanganj\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"gazipur\",\"name\":\"Gazipur\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"mymensingh\",\"name\":\"Mymensingh\",\"charge\":\"150\",\"days\":\"2-3\"}]},{\"id\":\"chittagong\",\"name\":\"Chittagong Division\",\"zones\":[{\"id\":\"chittagong\",\"name\":\"Chittagong\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"comilla\",\"name\":\"Comilla\",\"charge\":\"150\",\"days\":\"2-3\"}]},{\"id\":\"others\",\"name\":\"Other Divisions or Cities\",\"zones\":[{\"id\":\"sylhet\",\"name\":\"Sylhet\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"rajshahi\",\"name\":\"Rajshahi\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"khulna\",\"name\":\"Khulna\",\"charge\":\"70-100\",\"days\":\"1-2\"},{\"id\":\"jessore\",\"name\":\"Jessore\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"bogra\",\"name\":\"Bogra\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"barisal\",\"name\":\"Barisal\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"rangpur\",\"name\":\"Rangpur\",\"charge\":\"150\",\"days\":\"2-3\"},{\"id\":\"other\",\"name\":\"All Other Districts\",\"charge\":\"150\",\"days\":\"2-3\"}]}]"
  },
  {
    "key": "hero_bg_position",
    "value": "center"
  },
  {
    "key": "review_2_text",
    "value": "Ordered the Pro Shorts and joggers together. Delivery was fast, quality is premium. Will definitely order again."
  },
  {
    "key": "faqs",
    "value": "[{\"id\":\"faq1\",\"question\":\"How do I place an order?\",\"answer\":\"Simply visit our Products page, choose your item, select size and color, fill in your details and click Order Now. We confirm via WhatsApp or direct call and deliver Cash on Delivery.\"},{\"id\":\"faq2\",\"question\":\"What payment methods do you accept?\",\"answer\":\"We accept Cash on Delivery (COD) only. Pay when your order arrives at your door — no advance payment needed.\"},{\"id\":\"faq3\",\"question\":\"How long does delivery take?\",\"answer\":\"KhulnaCity: 1-2 days. Other cities: 2-5 days depending on location.\"},{\"id\":\"faq4\",\"question\":\"Can I return or exchange my order?\",\"answer\":\"Yes! If there is any issue with your order, contact us on WhatsApp within 48 hours of receiving it and we will arrange an exchange or refund.\"}]"
  },
  {
    "key": "color_theme",
    "value": "{\"primary\":\"#000000\",\"accent\":\"#ffffff\",\"bg\":\"#ffffff\",\"text\":\"#000000\",\"btnBg\":\"#000000\",\"btnText\":\"#ffffff\"}"
  },
  {
    "key": "hero_headline_spacing",
    "value": "-0.05"
  },
  {
    "key": "about_team_title",
    "value": "Behind Flextreme"
  },
  {
    "key": "cta_headline",
    "value": "START YOUR JOURNEY."
  },
  {
    "key": "hero_show_watermark",
    "value": "true"
  },
  {
    "key": "whatsapp_number",
    "value": "8801935962421"
  },
  {
    "key": "stats_rating",
    "value": "5 Star"
  },
  {
    "key": "hero_bg_pos_y",
    "value": "62.776446931691396"
  },
  {
    "key": "about_hero_headline",
    "value": null
  },
  {
    "key": "about_values",
    "value": "[{\"number\":\"01\",\"title\":\"Performance First\",\"description\":\"Every design decision starts with one question: Does this help athletes perform better?\"},{\"number\":\"02\",\"title\":\"Athletes Designing for Athletes\",\"description\":\"We are athletes ourselves, creating performance gear built from real training experience.\"},{\"number\":\"03\",\"title\":\"No-Compromise Quality\",\"description\":\"Premium fabrics, precision stitching, and rigorous testing to ensure durability and performance.\"},{\"number\":\"04\",\"title\":\"Accessible Excellence\",\"description\":\"Elite performance gear without unnecessary markups.\"}]"
  },
  {
    "key": "youtube_url",
    "value": null
  },
  {
    "key": "product_categories",
    "value": "[{\"id\":\"cat_tops\",\"name\":\"tops\",\"subcategories\":[\"compression top\"]},{\"id\":\"cat_bottoms\",\"name\":\"bottoms\",\"subcategories\":[]},{\"id\":\"cat_accessories\",\"name\":\"accessories\",\"subcategories\":[]}]"
  },
  {
    "key": "review_3_rating",
    "value": "5"
  },
  {
    "key": "hero_headline",
    "value": "LOOK|BIGGER|INSTANTLY"
  },
  {
    "key": "size_xxl_hips",
    "value": "49-51"
  },
  {
    "key": "cta_subtext",
    "value": "Join our growing community of athletes who train in Flextreme. Cash on Delivery. Nationwide shipping across Bangladesh."
  },
  {
    "key": "size_xs_waist",
    "value": "26-28"
  },
  {
    "key": "hero_overlay_opacity",
    "value": "0.5"
  },
  {
    "key": "hero_bg_image",
    "value": "https://res.cloudinary.com/dorki2ipl/image/upload/v1776876625/flextreme/hero/uxjhvjx96uk6j0qwmdob.jpg"
  },
  {
    "key": "review_1_rating",
    "value": "5"
  },
  {
    "key": "delivery_dhaka_city",
    "value": "150"
  },
  {
    "key": "hero_bg_type",
    "value": "image"
  },
  {
    "key": "delivery_mymensingh",
    "value": "150"
  },
  {
    "key": "size_s_hips",
    "value": "37-39"
  },
  {
    "key": "hero_bg_pos_x",
    "value": "11.948429333623697"
  },
  {
    "key": "review_1_location",
    "value": "Dhaka"
  },
  {
    "key": "hero_tagline_maxwidth",
    "value": "460"
  },
  {
    "key": "review_1_name",
    "value": "Ahmed K."
  },
  {
    "key": "size_s_waist",
    "value": "29-31"
  },
  {
    "key": "size_xl_chest",
    "value": "66"
  },
  {
    "key": "hero_cta_primary",
    "value": "Buy Now"
  },
  {
    "key": "stats_customers",
    "value": "7"
  },
  {
    "key": "banner_color",
    "value": "#030303"
  },
  {
    "key": "brand_story",
    "value": "The name **Flextreme** comes from two powerful ideas: **Flex** and **Extreme**.\nIn fitness culture, flexing is more than showing muscles. It represents the result of discipline, sacrifice, and relentless effort. It is the moment when hard work becomes visible.\nExtreme represents the mindset of pushing past comfort zones — going one more rep, one more set, one more mile when others stop.\nBy combining these two ideas, Flextreme was born.\nOur slogan, “**Work Hard, Flex Extreme**,” reflects the philosophy behind the brand. Success is not given; it is earned through effort, dedication, and consistency.\nThe logo itself carries meaning. Designed with a triangular shape, it represents strength, balance, and growth. Within the triangle, the letters **F**, **L**, **E**, and **X** are embedded, forming the foundation of the brand."
  },
  {
    "key": "delivery_comilla",
    "value": "150"
  },
  {
    "key": "size_xxl_waist",
    "value": "41-43"
  },
  {
    "key": "delivery_dhaka_district",
    "value": "150"
  },
  {
    "key": "hero_tagline_size",
    "value": "1.1"
  },
  {
    "key": "hero_watermark_opacity",
    "value": "0.075"
  },
  {
    "key": "instagram_url",
    "value": "https://instagram.com/flextreme.fit"
  },
  {
    "key": "delivery_khulna",
    "value": "70"
  },
  {
    "key": "about_team",
    "value": "[{\"name\":\"The Founder\",\"role\":\"Athlete and Visionary\",\"description\":\"I worked hard to build my physique, but regular gym wear didn’t reflect the effort I put into training. When I discovered compression wear, it completely changed how my physique looked. That experience inspired me to create Flextreme.\"},{\"name\":\"The Design Team\",\"role\":\"Performance Designers\",\"description\":\"Our design philosophy is simple: athletes designing for athletes, creating gym wear that enhances performance and showcases the physique.\"},{\"name\":\"The Community\",\"role\":\"Our Growing Community\",\"description\":\"The Flextreme community is built for people who train hard, push their limits, and support each other to become stronger every day.\"}]"
  },
  {
    "key": "store_phone",
    "value": "+8801935962421"
  },
  {
    "key": "delivery_gazipur",
    "value": "150"
  },
  {
    "key": "hero_bg_opacity",
    "value": "0.8"
  },
  {
    "key": "store_email",
    "value": "flextremefit@gmail.com"
  },
  {
    "key": "banner_enabled",
    "value": "false"
  },
  {
    "key": "size_m_waist",
    "value": "33"
  },
  {
    "key": "about_story",
    "value": "Flextreme was built by athletes, for athletes. We got tired of choosing between gear that looks good and gear that performs. So we built both."
  },
  {
    "key": "review_2_rating",
    "value": "5"
  },
  {
    "key": "size_xl_waist",
    "value": "38"
  },
  {
    "key": "cursor_type",
    "value": "normal"
  },
  {
    "key": "hero_watermark_size",
    "value": "120"
  },
  {
    "key": "size_xs_chest",
    "value": "32-34"
  },
  {
    "key": "size_l_hips",
    "value": "43-45"
  },
  {
    "key": "review_2_name",
    "value": "Bilal M."
  },
  {
    "key": "hero_space_button",
    "value": "2"
  },
  {
    "key": "hero_badge",
    "value": "Premium Gym Wear"
  },
  {
    "key": "hero_tagline",
    "value": "Only 100 will ever exist — claim yours before it’s gone.\n🔥 Limited stock available\n🚚 Cash on Delivery —No advance payment required"
  },
  {
    "key": "hero_cta_secondary",
    "value": "hidden"
  },
  {
    "key": "facebook_url",
    "value": "https://facebook.com/flextremefit"
  },
  {
    "key": "delivery_barisal",
    "value": "150"
  },
  {
    "key": "hero_bg_scale",
    "value": "1"
  },
  {
    "key": "size_columns",
    "value": "[{\"id\":\"chest\",\"name\":\"Length\"},{\"id\":\"waist\",\"name\":\"Width\"}]"
  },
  {
    "key": "review_2_location",
    "value": "Chittagong"
  },
  {
    "key": "hero_padding_top",
    "value": "80"
  },
  {
    "key": "hero_headline_weight",
    "value": "790"
  },
  {
    "key": "stats_cod",
    "value": "100%"
  },
  {
    "key": "delivery_jessore",
    "value": "150"
  },
  {
    "key": "review_3_text",
    "value": "The muscle tank is everything. Fits perfectly, highlights the physique, and the fabric is super comfortable."
  },
  {
    "key": "size_xxl_chest",
    "value": "47-49"
  },
  {
    "key": "tiktok_url",
    "value": null
  },
  {
    "key": "size_s_chest",
    "value": "35-37"
  },
  {
    "key": "delivery_chittagong",
    "value": "150"
  },
  {
    "key": "size_l_chest",
    "value": "65"
  }
];

async function importSettings() {
  let ok = 0, fail = 0;
  
  for (const s of settings) {
    const sql = `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`;
    
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql,
            params: [s.key, s.value],
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        ok++;
        process.stdout.write('.');
      } else {
        console.error('\nFailed:', s.key, data.errors);
        fail++;
      }
    } catch(e) {
      console.error('\nError:', s.key, e.message);
      fail++;
    }
  }
  
  console.log(`\nDone! ${ok} succeeded, ${fail} failed`);
}

importSettings();
