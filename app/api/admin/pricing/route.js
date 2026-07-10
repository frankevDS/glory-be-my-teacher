import { getCallerProfile, getServiceClient } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

async function requireAdmin(req) {
  const caller = await getCallerProfile(req);
  if (!caller || caller.role !== "admin") return null;
  return caller;
}

export async function GET(req) {
  const caller = await requireAdmin(req);
  if (!caller) return Response.json({ error: "Not authorized." }, { status: 403 });

  const service = getServiceClient();
  const { data, error } = await service.from("pricing_plans").select("*").order("sort_order");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ plans: data });
}

export async function POST(req) {
  const caller = await requireAdmin(req);
  if (!caller) return Response.json({ error: "Not authorized." }, { status: 403 });

  const body = await req.json();
  const { id, label, price_ghs, months, note, highlight, active, sort_order } = body;

  if (!label || price_ghs === undefined || !months) {
    return Response.json({ error: "label, price_ghs, and months are required." }, { status: 400 });
  }

  const service = getServiceClient();
  const row = {
    label,
    price_ghs,
    months,
    note: note || null,
    highlight: !!highlight,
    active: active !== false,
    sort_order: sort_order || 0,
  };

  if (id) {
    const { error } = await service.from("pricing_plans").update(row).eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await service.from("pricing_plans").insert(row);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(req) {
  const caller = await requireAdmin(req);
  if (!caller) return Response.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });

  const service = getServiceClient();
  const { error } = await service.from("pricing_plans").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
