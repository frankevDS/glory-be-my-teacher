import { getCallerProfile, getServiceClient } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req) {
  const caller = await getCallerProfile(req);
  if (!caller || caller.role !== "admin") {
    return Response.json({ error: "Not authorized." }, { status: 403 });
  }

  const service = getServiceClient();
  const { data, error } = await service.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
  const withFlag = (data || []).map((p) => ({
    ...p,
    isSuperAdmin: !!(superAdminEmail && p.email && p.email.toLowerCase() === superAdminEmail),
  }));

  return Response.json({ profiles: withFlag });
}
