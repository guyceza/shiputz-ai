# PageSpeed Audit - shipazti.com
**Date:** 2026-02-28
**Analyzed by:** Automated audit (header analysis, resource sizes, HTML inspection)

## Summary

The site is deployed on Vercel with Next.js, using SSR/SSG (`x-nextjs-prerender: 1`). Overall architecture is solid, but there are several quick wins for performance improvement.

## ✅ What's Working Well

- **Vercel Edge Cache:** `x-vercel-cache: HIT` — pages are cached at the edge
- **Pre-rendering:** `x-nextjs-prerender: 1` — static pre-rendering is active
- **HTTP/2:** Active (confirmed via headers)
- **Font preloading:** 2 WOFF2 fonts preloaded correctly
- **SEO metadata:** Complete OG tags, Twitter cards, canonical URL, hreflang, structured data (schema.org)
- **Viewport meta:** Correctly set
- **Language/RTL:** `lang="he" dir="rtl"` properly set
- **Canonical URL:** Set to https://shipazti.com
- **Structured data:** WebSite, SoftwareApplication, Organization schemas present

## 🚨 Critical Issues (Quick Wins)

### 1. **Oversized Images — BIGGEST win (~750KB savings)**

| Image | Size | Issue |
|-------|------|-------|
| `/robot-support.png` | **456 KB** | Chat widget icon — WAY too large for a 48x48 display |
| `/icons/cart.png` | **247 KB** | Cart icon displayed at 16-24px — absurdly large |
| `/og-image.jpg` | **522 KB** | OG image, should be optimized |

**Fix:** Convert these PNGs to WebP, resize to actual display size:
- `robot-support.png` → resize to 96x96 WebP (~5KB)
- `cart.png` → resize to 48x48 WebP (~2KB)
- `og-image.jpg` → compress to WebP (~50KB)

**Estimated savings: ~700KB on first load**

### 2. **Too Many Preloaded Images (10 logo preloads)**

The homepage preloads ALL brand logos upfront:
```
<link rel="preload" as="image" href="/logos/ace.png"/>
<link rel="preload" as="image" href="/logos/homecenter.png"/>
... (10 total logo preloads)
```

These logos are in a carousel that's below the fold. Preloading them delays critical resources.

**Fix:** Remove `preload` for logos. Use `loading="lazy"` on logo images instead.

### 3. **Large JS Bundles (no compression header)**

Key bundles:
| Bundle | Size (uncompressed) |
|--------|-------------------|
| Main chunk | 202 KB |
| App chunk | 193 KB |
| Vendor chunk | 113 KB |
| Page chunk | 39 KB |
| **Total** | **~547 KB** |

No `content-encoding` header was returned — verify Brotli/gzip compression is enabled on Vercel (it should be by default, but wasn't reflected in headers).

### 4. **CSS is 106KB (single bundle)**

Single CSS file of 109KB. Consider:
- Purging unused Tailwind classes in production build
- Verifying `content` paths in `tailwind.config.js` are correct

## ⚠️ Medium Priority

### 5. **Client-side rendering for tips pages**

Tips article pages use `"use client"` which means:
- Content is rendered client-side (bad for Core Web Vitals LCP)
- Google can index it, but initial HTML shows "טוען..." (loading)
- Consider converting to Server Components for better SEO

**Fix:** Convert `/tips/[slug]/page.tsx` to a Server Component. The article data is all static — no reason for client-side rendering except the auth check, which can be moved to a client sub-component.

### 6. **No `loading="lazy"` on below-fold images**

Brand logos and other images below the fold should use `loading="lazy"` to avoid loading them before they're visible.

### 7. **Google Analytics & Clarity loaded eagerly**

Both GA and Microsoft Clarity are preloaded/loaded with `afterInteractive` strategy. Consider using `lazyOnload` strategy for Clarity (it's analytics, not critical).

## 📋 Quick Win Action Items (Ordered by Impact)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Compress robot-support.png to WebP ~96x96 | 🔥🔥🔥 -450KB | 5 min |
| 2 | Compress cart.png to WebP ~48x48 | 🔥🔥🔥 -245KB | 5 min |
| 3 | Remove logo preloads, add lazy loading | 🔥🔥 faster LCP | 10 min |
| 4 | Convert tips pages to Server Components | 🔥🔥 better LCP/SEO | 30 min |
| 5 | Compress og-image.jpg to WebP | 🔥 -470KB (social shares) | 5 min |
| 6 | Change Clarity to lazyOnload | 🔥 less main thread work | 2 min |
| 7 | Verify Tailwind purge config | 🔥 smaller CSS | 5 min |

## 🔍 SEO Health

- ✅ Schema.org structured data (WebSite, SoftwareApplication, Organization)
- ✅ Open Graph tags complete
- ✅ Twitter Card meta tags
- ✅ Canonical URL
- ✅ Robots: index, follow
- ✅ hreflang set to he-IL
- ✅ All images now have descriptive alt text (fixed in this PR)
- ✅ FAQ Schema JSON-LD added to tips pages (added in this PR)
- ✅ Internal cross-linking between tips articles (added in this PR)
- ⚠️ Tips pages render client-side — initial HTML is just "טוען..."

## Next Steps

The biggest quick win is image optimization — compressing `robot-support.png` and `cart.png` alone would save ~700KB on initial page load. This should be the #1 priority before any code changes.
