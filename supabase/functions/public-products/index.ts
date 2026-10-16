import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const origins = new Set([
  "https://plotao.cz",
  "https://www.plotao.cz",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);
const headersFor = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && origins.has(origin) ? origin : "https://plotao.cz",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey",
  "Cache-Control": "public, max-age=60, s-maxage=60",
  "Vary": "Origin",
});

Deno.serve(async (req) => {
  const headers = headersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "GET") return Response.json({ error: "method_not_allowed" }, { status: 405, headers });

  const incoming = new URL(req.url);
  const page = Math.max(1, Math.min(10000, Number.parseInt(incoming.searchParams.get("page") || "1", 10) || 1));
  const pageSize = 24;
  const category = incoming.searchParams.get("category") || "";
  const allowed = new Set(["panel", "mesh", "concrete", "gabion", "aluminium", "metal", "masonry", "gate", "accessory", "transport", "other"]);
  if (category && !allowed.has(category)) return Response.json({ error: "invalid_category" }, { status: 400, headers });
  const q = (incoming.searchParams.get("q") || "").replace(/[^\p{L}\p{N} .,_/-]/gu, "").trim().slice(0, 80);
  const query = new URLSearchParams({
    select: "id,sku,name,category,dimensions,color,unit,sale_price,vat_percent,availability,photo_url",
    active: "eq.true",
    order: "name.asc",
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (category) query.set("category", `eq.${category}`);
  if (q) query.set("name", `ilike.*${q}*`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/plotao_products?${query}`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "count=exact",
        Range: `${(page - 1) * pageSize}-${page * pageSize - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!response.ok) throw new Error(`catalog_${response.status}`);
    const products = await response.json();
    const range = response.headers.get("content-range") || "*/0";
    const total = Number(range.split("/").at(-1)) || 0;
    return Response.json({ products, total, page, pageSize }, { headers });
  } catch (error) {
    console.error("public-products", error);
    return Response.json({ error: "catalog_unavailable" }, { status: 503, headers });
  }
});
