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

  const updates = {};
  if (status) updates.status = status;
  if (role) updates.role = role;
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const service = getServiceClient();
  const { error } = await service.from("profiles").update(updates).eq("id", targetUserId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
