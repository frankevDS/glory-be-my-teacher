export function getPlanLabel(profile) {
  if (!profile) return "";

  if (profile.status === "pending") {
    return "Free preview — awaiting admin approval for full access";
  }
  if (profile.status === "rejected") {
    return "";
  }
  if (profile.status === "approved") {
    if (!profile.expires_at) return "✔ Approved — unlimited access";

    const msLeft = new Date(profile.expires_at) - new Date();
    if (msLeft <= 0) {
      return "⚠ Your access period has ended — contact the admin to renew";
    }
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    if (daysLeft > 45) {
      const monthsLeft = Math.round(daysLeft / 30);
      return `✔ Premium — ${monthsLeft} month${monthsLeft === 1 ? "" : "s"} remaining`;
    }
    return `✔ Premium — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`;
  }
  return "";
}
