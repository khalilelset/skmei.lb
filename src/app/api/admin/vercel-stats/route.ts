import { NextResponse } from 'next/server';

export async function GET() {
  const token     = process.env.VERCEL_ACCESS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return NextResponse.json({ active: false });
  }

  // Fetch project details to build the dashboard URL
  const r = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });

  if (!r.ok) return NextResponse.json({ active: true, dashboardUrl: null });

  const project = await r.json() as {
    name?: string;
    accountId?: string;
    link?: { org?: string };
    targets?: { production?: { url?: string } };
  };

  // Construct dashboard URL — for personal accounts it's /[username]/[project-name]/analytics
  // The team slug is in link.org or we can use the accountId approach
  const teamSlug = (project.link as Record<string,string> | undefined)?.org ?? null;
  const name     = project.name ?? '';
  const url      = teamSlug
    ? `https://vercel.com/${teamSlug}/${name}/analytics`
    : `https://vercel.com/${name}/analytics`;

  const speedUrl = teamSlug
    ? `https://vercel.com/${teamSlug}/${name}/speed-insights`
    : `https://vercel.com/${name}/speed-insights`;

  return NextResponse.json({
    active:       true,
    projectName:  name,
    dashboardUrl: url,
    speedUrl,
  });
}
