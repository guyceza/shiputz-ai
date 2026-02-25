"use client";

import { useState, useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function SettingsModal({ isOpen, onClose, userId }: SettingsModalProps) {
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      loadSettings();
    }
  }, [isOpen, userId]);

  // If no userId, don't show loading forever
  useEffect(() => {
    if (isOpen && !userId) {
      setLoading(false);
    }
  }, [isOpen, userId]);

  const loadSettings = async () => {
    try {
      const res = await fetch(`/api/user-settings?userId=${userId}`);
      const data = await res.json();
      if (data.settings) {
        setWeeklyReport(data.settings.weekly_report_enabled || false);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          updates: { weekly_report_enabled: weeklyReport },
        }),
      });
      onClose();
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // No userId - can't load settings
  if (!userId) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
          <p className="text-gray-500">טוען משתמש...</p>
          <button onClick={onClose} className="mt-4 text-sm text-gray-400">סגור</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">⚙️ הגדרות</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">טוען...</div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Report Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">דוח שבועי במייל</p>
                <p className="text-sm text-gray-500">קבל סיכום שבועי על ההוצאות שלך</p>
              </div>
              <button
                onClick={() => setWeeklyReport(!weeklyReport)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  weeklyReport ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    weeklyReport ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* More settings can be added here */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full bg-gray-900 text-white py-3 rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saving ? "שומר..." : "שמור הגדרות"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
