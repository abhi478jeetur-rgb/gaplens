// GitHub star count for the repo, cached for an hour so the landing never hits GitHub's rate limit.
export const revalidate = 3600;

export async function GET() {
  try {
    const r = await fetch("https://api.github.com/repos/abhi478jeetur-rgb/gaplens", {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "gaplens-site" },
      next: { revalidate: 3600 },
    });
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { stargazers_count?: number };
    return Response.json({ stars: j.stargazers_count ?? null }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return Response.json({ stars: null }, { headers: { "Cache-Control": "public, s-maxage=300" } });
  }
}
