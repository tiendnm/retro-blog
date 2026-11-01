import { describe, expect, it } from 'vitest';
import { absolutizeUrls, buildRss, cdata, xmlEscape } from '../src/lib/rss';
import type { PostDetail } from '../src/lib/types';

const SITE = { base: 'https://retro.example.com', name: 'Retro & Co', description: 'Máy tính một thời' };

const post = (over: Partial<PostDetail> = {}): PostDetail => ({
  id: '1',
  title: 'P4 <2.8C> & "Radeon"',
  slug: 'p4',
  excerpt: 'Tóm tắt & hơn',
  body: '<p>Xin chào <a href="/posts/khac">bài khác</a></p>',
  publishedAt: '2026-10-30T07:00:00.000Z',
  author: { name: 'Tiến', slug: 'tien', avatar: null },
  category: { name: 'Build log', slug: 'build-log' },
  cover: null,
  tags: [{ name: 'Pentium 4', slug: 'pentium-4' }],
  ...over,
});

describe('rss helpers', () => {
  it('xmlEscape thoát năm ký tự đặc biệt', () => {
    expect(xmlEscape(`<a href="x">&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    );
  });

  it('cdata tách "]]>" để không đóng CDATA sớm', () => {
    expect(cdata('a]]>b')).toBe('<![CDATA[a]]]]><![CDATA[>b]]>');
  });

  it('absolutizeUrls chỉ đổi đường dẫn gốc "/x"', () => {
    const html =
      '<a href="/posts/a">1</a><img src="/assets/i.png"><a href="//cdn.x/y">2</a><a href="https://z/w">3</a><a href="#top">4</a>';
    expect(absolutizeUrls(html, 'https://s.com')).toBe(
      '<a href="https://s.com/posts/a">1</a><img src="https://s.com/assets/i.png"><a href="//cdn.x/y">2</a><a href="https://z/w">3</a><a href="#top">4</a>',
    );
  });
});

describe('buildRss', () => {
  const xml = buildRss(SITE, [
    post(),
    post({ id: '2', slug: 'cu', publishedAt: '2026-10-01T00:00:00.000Z' }),
  ]);

  it('có khai báo kênh, ngôn ngữ vi và atom:link self', () => {
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>Retro &amp; Co</title>');
    expect(xml).toContain('<language>vi</language>');
    expect(xml).toContain(
      '<atom:link href="https://retro.example.com/rss.xml" rel="self" type="application/rss+xml" />',
    );
  });

  it('item: link/guid tuyệt đối, pubDate RFC 822, escape tiêu đề', () => {
    expect(xml).toContain('<title>P4 &lt;2.8C&gt; &amp; &quot;Radeon&quot;</title>');
    expect(xml).toContain('<guid isPermaLink="true">https://retro.example.com/posts/p4</guid>');
    expect(xml).toContain('<pubDate>Fri, 30 Oct 2026 07:00:00 GMT</pubDate>');
    expect(xml).toContain('<dc:creator>Tiến</dc:creator>');
    expect(xml).toContain('<category>Build log</category>');
    expect(xml).toContain('<category>Pentium 4</category>');
  });

  it('content:encoded chứa body đầy đủ với link nội bộ tuyệt đối', () => {
    expect(xml).toContain(
      '<content:encoded><![CDATA[<p>Xin chào <a href="https://retro.example.com/posts/khac">bài khác</a></p>]]></content:encoded>',
    );
  });

  it('lastBuildDate = bài mới nhất; thứ tự item giữ nguyên đầu vào', () => {
    expect(xml).toContain('<lastBuildDate>Fri, 30 Oct 2026 07:00:00 GMT</lastBuildDate>');
    expect(xml.indexOf('/posts/p4<')).toBeLessThan(xml.indexOf('/posts/cu<'));
  });

  it('bài thiếu excerpt/body/ngày/chuyên mục vẫn là item hợp lệ; feed rỗng không có lastBuildDate', () => {
    const bare = buildRss(SITE, [
      post({ excerpt: null, body: null, publishedAt: null, category: null }),
    ]);
    expect(bare).not.toContain('<pubDate>');
    expect(bare).not.toContain('<content:encoded>');
    expect(bare).not.toContain('<description>Tóm');
    expect(buildRss(SITE, [])).not.toContain('<lastBuildDate>');
  });
});
