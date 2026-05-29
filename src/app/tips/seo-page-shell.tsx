import Link from "next/link";

export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type SeoPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  answer: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  related: { href: string; label: string }[];
};

export function buildArticleJsonLd({
  title,
  description,
  slug,
  faqs,
}: {
  title: string;
  description: string;
  slug: string;
  faqs: SeoFaq[];
}) {
  const url = `https://shipazti.com/tips/${slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        author: { "@type": "Organization", name: "ShiputzAI" },
        publisher: {
          "@type": "Organization",
          name: "ShiputzAI",
          url: "https://shipazti.com",
          logo: {
            "@type": "ImageObject",
            url: "https://shipazti.com/icon-512.png",
          },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        datePublished: "2026-05-29",
        dateModified: "2026-05-29",
        inLanguage: "he-IL",
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ShiputzAI",
            item: "https://shipazti.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "מאמרים וטיפים",
            item: "https://shipazti.com/tips",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: url,
          },
        ],
      },
    ],
  };
}

export default function SeoPageShell({
  eyebrow,
  title,
  intro,
  answer,
  primaryHref = "/studio",
  primaryLabel = "התחילו בסטודיו",
  secondaryHref = "/visualize",
  secondaryLabel = "הדמיית חדר",
  sections,
  faqs,
  related,
}: SeoPageShellProps) {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-stone-950">
      <nav className="sticky top-0 z-40 border-b border-stone-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="text-base font-bold">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/tips" className="hidden text-sm font-semibold text-stone-500 sm:inline">
              מאמרים
            </Link>
            <Link
              href={primaryHref}
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <p className="mb-4 text-sm font-bold text-stone-500">{eyebrow}</p>
        <h1 className="text-4xl font-black leading-tight tracking-normal md:text-5xl">
          {title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-700">{intro}</p>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <h2 className="text-xl font-black">התשובה הקצרה</h2>
          <p className="mt-3 leading-7 text-stone-700">{answer}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold text-stone-800"
            >
              {secondaryLabel}
            </Link>
          </div>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="text-2xl font-black">{section.title}</h2>
            <p className="mt-4 leading-7 text-stone-700">{section.body}</p>
            {section.bullets ? (
              <ul className="mt-4 space-y-3 leading-7 text-stone-700">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-xl border border-stone-100 bg-white p-4">
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section className="mt-10 rounded-2xl border border-stone-200 p-5">
          <h2 className="text-xl font-black">שאלות נפוצות</h2>
          <div className="mt-4 space-y-5">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-black">{faq.question}</h3>
                <p className="mt-2 leading-7 text-stone-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black">מדריכים קשורים</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 hover:border-stone-400"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
