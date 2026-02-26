'use client';

import Link from 'next/link';

const footerLinks = {
  products: {
    title: 'מוצרים',
    links: [
      { label: 'AI Vision - הדמיות', href: '/visualize' },
      { label: 'Shop the Look', href: '/shop-look' },
      { label: 'כתב כמויות', href: '/dashboard/bill-of-quantities' },
      { label: 'מאמרים וטיפים', href: '/tips' },
    ],
  },
  account: {
    title: 'חשבון',
    links: [
      { label: 'לאזור האישי', href: '/dashboard' },
      { label: 'התחברות', href: '/login' },
      { label: 'הרשמה', href: '/signup' },
      { label: 'איפוס סיסמה', href: '/forgot-password' },
    ],
  },
  support: {
    title: 'תמיכה',
    links: [
      { label: 'צור קשר', href: '/contact' },
      { label: 'מאמרים וטיפים', href: '/tips' },
    ],
  },
  legal: {
    title: 'משפטי',
    links: [
      { label: 'תנאי שימוש', href: '/terms' },
      { label: 'מדיניות פרטיות', href: '/privacy' },
      { label: 'ביטול הרשמה', href: '/unsubscribe' },
    ],
  },
  pricing: {
    title: 'תמחור',
    links: [
      { label: 'Premium', href: '/checkout' },
      { label: 'Vision מנוי', href: '/checkout-vision' },
    ],
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* Main Footer Links */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-900 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © {currentYear} ShiputzAI. כל הזכויות שמורות.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-900">
                פרטיות
              </Link>
              <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-900">
                תנאי שימוש
              </Link>
              <Link href="/contact" className="text-xs text-gray-500 hover:text-gray-900">
                צור קשר
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
