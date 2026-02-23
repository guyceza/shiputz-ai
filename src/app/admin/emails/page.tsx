"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAILS = ['guyceza@gmail.com'];

// Email template metadata
const EMAIL_TEMPLATES = [
  // Purchased flow
  { id: 'welcome_purchased', name: 'ברוך הבא (Premium)', day: 0, flow: 'purchased', subject: '🎉 ברוך הבא ל-ShiputzAI Premium!' },
  { id: 'getting_started', name: 'התחלה מהירה', day: 1, flow: 'purchased', subject: '💡 3 דברים לעשות עכשיו' },
  { id: 'vision_upsell', name: 'Vision Upsell (50%)', day: 3, flow: 'purchased', subject: '🏠 איך השיפוץ שלך יראה? (50% הנחה)' },
  { id: 'budget_tips', name: 'טיפים לתקציב', day: 5, flow: 'purchased', subject: '💰 איך לא לחרוג מהתקציב' },
  { id: 'checkin', name: 'צ׳ק-אין', day: 7, flow: 'purchased', subject: '❓ איך הולך?' },
  { id: 'quote_analysis', name: 'ניתוח הצעות מחיר', day: 10, flow: 'purchased', subject: '🔥 הכלי שרוב המשפצים לא מכירים' },
  { id: 'feedback_request', name: 'בקשת משוב', day: 14, flow: 'purchased', subject: '⭐ 30 שניות מזמנך?' },
  // Non-purchased flow
  { id: 'reminder', name: 'תזכורת', day: 1, flow: 'non_purchased', subject: '👋 שכחת משהו?' },
  { id: 'discount_offer', name: 'הנחה 20% Premium', day: 3, flow: 'non_purchased', subject: '🎁 מתנה בשבילך — 20% הנחה' },
  { id: 'problem_highlight', name: '70% חורגים', day: 5, flow: 'non_purchased', subject: '😱 70% מהשיפוצים חורגים מהתקציב' },
  { id: 'testimonials', name: 'סיפורי הצלחה', day: 7, flow: 'non_purchased', subject: '💬 "חסכתי ₪15,000" — סיפור אמיתי' },
  { id: 'urgency', name: 'דחיפות 24 שעות', day: 9, flow: 'non_purchased', subject: '⏰ נשארו 24 שעות להנחה!' },
  { id: 'demo', name: 'דמו', day: 11, flow: 'non_purchased', subject: '📊 ראה איך זה עובד (1 דקה)' },
  { id: 'last_chance', name: 'הזדמנות אחרונה', day: 14, flow: 'non_purchased', subject: '🤝 נפרדים כחברים?' },
];

export default function AdminEmails() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [testEmail, setTestEmail] = useState("guyceza@gmail.com");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeFlow, setActiveFlow] = useState<'purchased' | 'non_purchased'>('purchased');

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }
      router.push("/dashboard");
    };
    checkAuth();
  }, [router]);

  // Load preview when template selected
  useEffect(() => {
    if (selectedTemplate) {
      loadPreview(selectedTemplate);
    }
  }, [selectedTemplate]);

  const loadPreview = async (templateId: string) => {
    try {
      const res = await fetch(`/api/admin/email-preview?template=${templateId}`);
      const data = await res.json();
      if (data.html) {
        setPreviewHtml(data.html);
      }
    } catch (e) {
      console.error("Failed to load preview:", e);
    }
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) return;
    
    setSending(true);
    setSendResult(null);
    
    try {
      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          template: selectedTemplate, 
          email: testEmail 
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setSendResult({ success: true, message: `נשלח בהצלחה! (ID: ${data.id})` });
      } else {
        setSendResult({ success: false, message: data.error || 'שגיאה בשליחה' });
      }
    } catch (e) {
      setSendResult({ success: false, message: 'שגיאת רשת' });
    }
    
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const purchasedTemplates = EMAIL_TEMPLATES.filter(t => t.flow === 'purchased');
  const nonPurchasedTemplates = EMAIL_TEMPLATES.filter(t => t.flow === 'non_purchased');
  const currentTemplates = activeFlow === 'purchased' ? purchasedTemplates : nonPurchasedTemplates;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                ← חזרה לאדמין
              </Link>
              <h1 className="text-xl font-bold text-gray-900">ניהול מיילים</h1>
            </div>
            <div className="text-sm text-gray-500">
              14 תבניות · 2 flows
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Sidebar - Template List */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Flow Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveFlow('purchased')}
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeFlow === 'purchased' 
                      ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  רכשו Premium (7)
                </button>
                <button
                  onClick={() => setActiveFlow('non_purchased')}
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeFlow === 'non_purchased' 
                      ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  לא רכשו (7)
                </button>
              </div>

              {/* Template List */}
              <div className="divide-y divide-gray-100">
                {currentTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`w-full px-4 py-3 text-right hover:bg-gray-50 transition ${
                      selectedTemplate === template.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activeFlow === 'purchased' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        יום {template.day}
                      </span>
                      <span className="font-medium text-gray-900">{template.name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">{template.subject}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main - Preview */}
          <div className="col-span-8">
            {selectedTemplate ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Preview Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium text-gray-900">
                      {EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="מייל לבדיקה"
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48"
                      />
                      <button
                        onClick={sendTestEmail}
                        disabled={sending}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sending ? 'שולח...' : 'שלח טסט'}
                      </button>
                    </div>
                  </div>
                  {sendResult && (
                    <div className={`mt-2 text-sm ${sendResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {sendResult.message}
                    </div>
                  )}
                </div>

                {/* Preview iframe */}
                <div className="p-4 bg-gray-100">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '600px' }}>
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full border-0"
                      title="Email Preview"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
                  <p>
                    📁 התבניות נמצאות ב: <code className="bg-gray-200 px-1 rounded">scripts/email-sequences.js</code>
                  </p>
                  <p className="mt-1">
                    לעריכה: פתח את הקובץ, ערוך את ה-HTML, ואז <code className="bg-gray-200 px-1 rounded">git push</code>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">בחר תבנית מהרשימה</h3>
                <p className="text-gray-500">לחץ על תבנית כדי לראות תצוגה מקדימה ולשלוח טסט</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
