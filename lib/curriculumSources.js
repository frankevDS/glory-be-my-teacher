// Authoritative curriculum-source registry.
// A source is considered verified only when its indexed document was obtained
// from an approved authority domain and the ingestion metadata records that URL.

export const CURRICULUM_AUTHORITIES = {
  ghana: {
    name: "National Council for Curriculum and Assessment (NaCCA)",
    domains: ["nacca.gov.gh", "www.nacca.gov.gh", "curriculumresources.edu.gh"],
    curriculumFamily: "Ghana Secondary Education Curriculum",
    ministryResourceDomain: "curriculumresources.edu.gh",
    officialPage: "https://nacca.gov.gh/secondary-education-curriculum/",
  },
};

export function isApprovedOfficialSource(country, sourceUrl = "") {
  const authority = CURRICULUM_AUTHORITIES[String(country || "").toLowerCase()];
  if (!authority || !sourceUrl) return false;
  try {
    const host = new URL(sourceUrl).hostname.toLowerCase();
    return authority.domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function getAuthority(country) {
  return CURRICULUM_AUTHORITIES[String(country || "").toLowerCase()] || null;
}
