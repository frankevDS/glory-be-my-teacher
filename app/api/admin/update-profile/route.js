import { getCallerProfile, getServiceClient } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req) {
  const caller = await getCallerProfile(req);
  if (!caller || caller.role !== "admin") {
    return Response.json({ error: "Not authorized." }, { status: 403 });
  }

  const { targetUserId, status, role } = await req.json();
  if (!targetUserId) {
    return Response.json({ error: "Missing targetUserId." }, { status: 400 });
  }

  const service = getServiceClient();

  // Protect the designated super-admin account: it cannot be modified through
  // this endpoint by anyone, full stop (including by itself — promoting or
  // demoting it happens only via direct SQL, on purpose, so no admin,
  // however trusted, can ever override that one account through the app).
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
  if (superAdminEmail) {
    const { data: target } = await service.from("profiles").select("email").eq("id", targetUserId).single();
    if (target?.email && target.email.toLowerCase() === superAdminEmail) {
      return Response.json(
        { error: "This is the protected super-admin account and cannot be changed through the app." },
        { status: 403 }
      );
    }
  }

  const updates = {};
  if (status) updates.status = status;
  if (role) updates.role = role;
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await service.from("profiles").update(updates).eq("id", targetUserId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
