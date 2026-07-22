// Endpoint robots.txt (Sprint 5 Phase 2). Dùng endpoint (không file tĩnh
// public/) để URL sitemap là TUYỆT ĐỐI theo `site` (= PUBLIC_SITE_URL) — cùng
// nguồn sự thật với canonical/OG/sitemap. Sprint 6 đổi domain → chỉ sửa 1 biến.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = (site?.href ?? 'http://localhost:4321/').replace(/\/$/, '');
  const body = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
