'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Copy, MessageCircle } from 'lucide-react';

interface ReferralData {
  code: string;
  link: string;
  completedReferrals: number;
  creditsPerReferral: number;
}

export default function ReferralWidget({ userEmail }: { userEmail: string }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    authFetch(`/api/referral?email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => {
        if (d.code) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userEmail]);

  const copyLink = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!data) return;
    const text = `הכירו את ShiputzAI - כלי AI לעיצוב הבית 🏠\nהירשמו דרך הלינק שלי ושנינו מקבלים 20 קרדיטים חינם!\n${data.link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <section id="referral" className="scroll-mt-20 rounded-2xl border border-stone-200 bg-white p-5 mt-6">
        <div className="h-4 w-40 rounded bg-stone-100 animate-pulse" />
        <div className="mt-3 h-10 rounded-xl bg-stone-100 animate-pulse" />
      </section>
    );
  }
  if (!data) {
    return (
      <section id="referral" className="scroll-mt-20 rounded-2xl border border-amber-200 bg-amber-50 p-5 mt-6">
        <h3 className="font-bold text-amber-950 text-sm">לא הצלחנו לפתוח כרגע את לינק החברים</h3>
        <p className="mt-1 text-xs leading-5 text-amber-800">רעננו את הדף או התחברו מחדש כדי לקבל לינק אישי.</p>
      </section>
    );
  }

  return (
    <section id="referral" className="scroll-mt-20 bg-[#eef8f4] border border-emerald-100 rounded-2xl p-5 mt-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
          <Copy className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">הזמן חבר - שניכם מרוויחים!</h3>
          <p className="text-xs text-gray-600">כל חבר שנרשם = <strong>20 קרדיטים לך + 20 לחבר</strong></p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 flex items-center gap-2 mb-3">
        <input
          type="text"
          readOnly
          value={data.link}
          className="flex-1 text-xs text-gray-700 bg-transparent outline-none font-mono"
          dir="ltr"
        />
        <button
          onClick={copyLink}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {copied ? '✓ הועתק' : 'העתק'}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={shareWhatsApp}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
        >
          <MessageCircle className="h-4 w-4" />
          שלח בוואטסאפ
        </button>
        {data.completedReferrals > 0 && (
          <span className="text-xs text-gray-500">
            {data.completedReferrals} חברים הצטרפו • {data.completedReferrals * data.creditsPerReferral} קרדיטים הורווחו
          </span>
        )}
      </div>
    </section>
  );
}
