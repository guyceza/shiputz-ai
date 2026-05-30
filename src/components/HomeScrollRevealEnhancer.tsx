"use client";

import { useEffect } from "react";

function toHtmlElement(element: Element | null | undefined) {
  return element instanceof HTMLElement ? element : null;
}

function markElement(
  element: Element | null | undefined,
  kind: string,
  delayIndex = 0
) {
  const target = toHtmlElement(element);
  if (!target || target.dataset.scrollReveal) return;

  target.dataset.scrollReveal = "pending";
  target.dataset.scrollRevealKind = kind;
  target.style.setProperty(
    "--scroll-reveal-delay",
    `${Math.min(delayIndex * 120, 900)}ms`
  );
}

function markAll(root: HTMLElement, selector: string, kind: string) {
  root
    .querySelectorAll(selector)
    .forEach((element, index) => markElement(element, kind, index));
}

function markClosestAll(
  root: HTMLElement,
  selector: string,
  closestSelector: string,
  kind: string
) {
  const targets = new Set<HTMLElement>();

  root.querySelectorAll(selector).forEach((element) => {
    const closest = toHtmlElement(element.closest(closestSelector));
    if (closest) targets.add(closest);
  });

  Array.from(targets).forEach((element, index) =>
    markElement(element, kind, index)
  );
}

function markSectionByLink(
  root: HTMLElement,
  linkSelector: string,
  kind: string,
  markChildrenSelector?: string
) {
  const section = toHtmlElement(root.querySelector(linkSelector)?.closest("section"));
  if (!section) return;

  if (markChildrenSelector) {
    section
      .querySelectorAll(markChildrenSelector)
      .forEach((element, index) => markElement(element, kind, index));
    return;
  }

  markElement(section.querySelector(":scope > div") ?? section, kind);
}

export default function HomeScrollRevealEnhancer() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      "[data-home-scroll-reveal-page]"
    );
    if (!root) return;

    markElement(root.querySelector('section[aria-label="מקורות מידע"]'), "section");
    markAll(
      root,
      '[class*="grid-cols-2"][class*="md:grid-cols-4"] > div',
      "metric-card"
    );
    markElement(root.querySelector("#features > .text-center"), "headline");
    markAll(root, "#features .space-y-24 > div", "feature-block");
    markAll(root, "#features .space-y-24 > a", "deck");
    markAll(root, '[class*="md:grid-cols-5"] > a', "intent-card");

    markSectionByLink(
      root,
      'a[href="/tips/room-visualization-ai"]',
      "pill",
      ".mb-6, a"
    );

    markAll(
      root,
      'section[aria-label="תכונות עיקריות"] span.flex',
      "trust-pill"
    );
    markClosestAll(
      root,
      'a[href^="/checkout"], a[href^="/signup?redirect="]',
      ".relative.rounded-2xl",
      "pricing-card"
    );

    const aboutSection = toHtmlElement(
      root.querySelector('img[alt*="רקע אודות"]')?.closest("section")
    );
    if (aboutSection) {
      markElement(aboutSection.querySelector(".text-center"), "headline");
      markElement(aboutSection.querySelector('[class*="bg-black/60"]'), "panel");
    }

    root
      .querySelectorAll('button[aria-controls^="faq-"]')
      .forEach((button, index) =>
        markElement(button.closest(".border.rounded-2xl"), "faq-item", index)
      );

    markSectionByLink(root, 'a[href="/dashboard#referral"]', "section");

    const finalCta = toHtmlElement(root.querySelector("a.hover-shine"));
    if (finalCta) {
      markElement(finalCta.closest("section")?.querySelector(":scope > div"), "section");
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const targets = Array.from(
      root.querySelectorAll<HTMLElement>('[data-scroll-reveal="pending"]')
    );

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => {
        target.dataset.scrollReveal = "complete";
        target.style.removeProperty("--scroll-reveal-delay");
      });
      return;
    }

    const timers: number[] = [];
    let frame = 0;
    const revealTarget = (target: HTMLElement) => {
      if (target.dataset.scrollReveal !== "pending") return;

      target.dataset.scrollReveal = "visible";
      observer.unobserve(target);

      const delay = parseFloat(
        target.style.getPropertyValue("--scroll-reveal-delay") || "0"
      );
      timers.push(
        window.setTimeout(() => {
          target.dataset.scrollReveal = "complete";
          target.style.removeProperty("--scroll-reveal-delay");
        }, delay + 1180)
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          revealTarget(entry.target as HTMLElement);
        });
      },
      { rootMargin: "0px 0px -28% 0px", threshold: 0.16 }
    );

    targets.forEach((target) => observer.observe(target));

    const revealPassedTargets = () => {
      frame = 0;
      const revealLine = window.innerHeight * 0.72;
      targets.forEach((target) => {
        if (target.dataset.scrollReveal !== "pending") return;
        if (target.getBoundingClientRect().top < revealLine) {
          revealTarget(target);
        }
      });
    };

    const queueRevealCheck = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(revealPassedTargets);
    };

    queueRevealCheck();
    window.addEventListener("scroll", queueRevealCheck, { passive: true });
    window.addEventListener("resize", queueRevealCheck);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueRevealCheck);
      window.removeEventListener("resize", queueRevealCheck);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <style>{`
      [data-home-scroll-reveal-page] [data-scroll-reveal] {
        transition:
          opacity 820ms cubic-bezier(0.16, 1, 0.3, 1) var(--scroll-reveal-delay, 0ms),
          transform 980ms cubic-bezier(0.16, 1, 0.3, 1) var(--scroll-reveal-delay, 0ms),
          filter 980ms cubic-bezier(0.16, 1, 0.3, 1) var(--scroll-reveal-delay, 0ms);
        will-change: opacity, transform, filter;
      }

      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"] {
        opacity: 0;
        transform: translate3d(0, 58px, 0) scale(0.985);
        filter: blur(12px);
      }

      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"][data-scroll-reveal-kind="metric-card"],
      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"][data-scroll-reveal-kind="intent-card"],
      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"][data-scroll-reveal-kind="pricing-card"],
      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"][data-scroll-reveal-kind="faq-item"] {
        transform: translate3d(0, 46px, 0) scale(0.955);
      }

      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"][data-scroll-reveal-kind="feature-block"],
      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"][data-scroll-reveal-kind="panel"] {
        transform: translate3d(0, 74px, 0) scale(0.975);
      }

      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"][data-scroll-reveal-kind="pill"],
      [data-home-scroll-reveal-page] [data-scroll-reveal="pending"][data-scroll-reveal-kind="trust-pill"] {
        transform: translate3d(0, 26px, 0) scale(0.92);
      }

      [data-home-scroll-reveal-page] [data-scroll-reveal="visible"] {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: blur(0);
      }

      [data-home-scroll-reveal-page] [data-scroll-reveal="complete"] {
        opacity: 1;
        filter: none;
      }

      @media (prefers-reduced-motion: reduce) {
        [data-home-scroll-reveal-page] [data-scroll-reveal] {
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}
