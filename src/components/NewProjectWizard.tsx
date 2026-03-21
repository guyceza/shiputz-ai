"use client";

import { useState } from "react";

interface WizardData {
  name: string;
  projectType: string;
  propertyType: string;
  budgetRange: string;
  timeline: string;
}

interface Props {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PROJECT_TYPES = [
  { key: "full-renovation", label: "שיפוץ מלא", icon: "🏗️", desc: "הריסה ובנייה מחדש, שינוי תוכנית" },
  { key: "room-renovation", label: "שיפוץ חדר", icon: "🔨", desc: "מטבח, אמבטיה, או חדר ספציפי" },
  { key: "design-furniture", label: "ריהוט ועיצוב", icon: "🛋️", desc: "בחירת ריהוט, צבעים, סגנון" },
  { key: "new-build", label: "בנייה חדשה", icon: "🏠", desc: "בית חדש מאפס" },
];

const PROPERTY_TYPES = [
  { key: "apartment", label: "דירה", icon: "🏢" },
  { key: "house", label: "בית פרטי", icon: "🏡" },
  { key: "penthouse", label: "פנטהאוז", icon: "🌆" },
  { key: "office", label: "משרד", icon: "💼" },
  { key: "commercial", label: "מסחרי", icon: "🏪" },
];

const BUDGET_RANGES = [
  { key: "under-50k", label: "עד ₪50,000", desc: "שיפוץ קל, ריהוט" },
  { key: "50k-100k", label: "₪50,000 - ₪100,000", desc: "שיפוץ חדר, מטבח" },
  { key: "100k-200k", label: "₪100,000 - ₪200,000", desc: "שיפוץ דירה" },
  { key: "200k-500k", label: "₪200,000 - ₪500,000", desc: "שיפוץ מקיף" },
  { key: "over-500k", label: "מעל ₪500,000", desc: "בנייה / שיפוץ יסודי" },
];

const TIMELINES = [
  { key: "1month", label: "חודש", desc: "פרויקט קטן" },
  { key: "3months", label: "3 חודשים", desc: "שיפוץ רגיל" },
  { key: "6months", label: "חצי שנה", desc: "שיפוץ מקיף" },
  { key: "1year", label: "שנה", desc: "בנייה / שיפוץ גדול" },
  { key: "unsure", label: "עדיין לא בטוח", desc: "" },
];

const STEPS = [
  { num: 1, label: "סוג הפרויקט" },
  { num: 2, label: "סוג הנכס" },
  { num: 3, label: "תקציב" },
  { num: 4, label: "לו״ז" },
  { num: 5, label: "שם" },
];

export default function NewProjectWizard({ onComplete, onCancel, loading }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    name: "",
    projectType: "",
    propertyType: "",
    budgetRange: "",
    timeline: "",
  });

  const canProceed = () => {
    switch (step) {
      case 1: return !!data.projectType;
      case 2: return !!data.propertyType;
      case 3: return !!data.budgetRange;
      case 4: return !!data.timeline;
      case 5: return !!data.name.trim();
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onComplete(data);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const selectOption = (field: keyof WizardData, value: string) => {
    setData({ ...data, [field]: value });
    // Auto-advance after selection (except last step)
    if (step < 5) {
      setTimeout(() => setStep(step + 1), 200);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((s) => (
            <div key={s.num} className="flex-1">
              <div className={`h-1 rounded-full transition-colors ${
                s.num <= step ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-gray-700"
              }`} />
              <p className={`text-[10px] mt-1 text-center transition-colors ${
                s.num === step ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"
              }`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="p-6 min-h-[380px] flex flex-col">
          {/* Step 1: Project Type */}
          {step === 1 && (
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">מה אתה מתכנן?</h2>
              <p className="text-sm text-gray-500 mb-6">זה יעזור לנו להתאים את הכלים עבורך</p>
              <div className="space-y-3">
                {PROJECT_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => selectOption("projectType", t.key)}
                    className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                      data.projectType === t.key
                        ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{t.label}</div>
                        <div className="text-sm text-gray-500">{t.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Property Type */}
          {step === 2 && (
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">מה סוג הנכס?</h2>
              <p className="text-sm text-gray-500 mb-6">בחר את סוג הנכס שלך</p>
              <div className="grid grid-cols-2 gap-3">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => selectOption("propertyType", t.key)}
                    className={`text-center p-4 rounded-xl border-2 transition-all ${
                      data.propertyType === t.key
                        ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="text-3xl mb-2">{t.icon}</div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">מה התקציב המשוער?</h2>
              <p className="text-sm text-gray-500 mb-6">אפשר לשנות אחר כך</p>
              <div className="space-y-3">
                {BUDGET_RANGES.map((b) => (
                  <button
                    key={b.key}
                    onClick={() => selectOption("budgetRange", b.key)}
                    className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                      data.budgetRange === b.key
                        ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{b.label}</div>
                    {b.desc && <div className="text-sm text-gray-500">{b.desc}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Timeline */}
          {step === 4 && (
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">מתי אתה מתכנן להתחיל?</h2>
              <p className="text-sm text-gray-500 mb-6">טווח הזמנים המשוער</p>
              <div className="space-y-3">
                {TIMELINES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => selectOption("timeline", t.key)}
                    className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                      data.timeline === t.key
                        ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-gray-900 dark:text-white">{t.label}</div>
                      {t.desc && <div className="text-sm text-gray-500">{t.desc}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Name */}
          {step === 5 && (
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">תן שם לפרויקט</h2>
              <p className="text-sm text-gray-500 mb-6">שם שיעזור לך לזהות את הפרויקט</p>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder='לדוגמה: "שיפוץ הדירה ברחובות"'
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base focus:outline-none focus:border-gray-900 dark:focus:border-white bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canProceed()) handleNext();
                }}
              />

              {/* Summary */}
              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">סיכום</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">סוג</span>
                  <span className="text-gray-900 dark:text-white">{PROJECT_TYPES.find(t => t.key === data.projectType)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">נכס</span>
                  <span className="text-gray-900 dark:text-white">{PROPERTY_TYPES.find(t => t.key === data.propertyType)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">תקציב</span>
                  <span className="text-gray-900 dark:text-white">{BUDGET_RANGES.find(b => b.key === data.budgetRange)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">לו״ז</span>
                  <span className="text-gray-900 dark:text-white">{TIMELINES.find(t => t.key === data.timeline)?.label}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-full text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                יוצר...
              </span>
            ) : step === 5 ? "צור פרויקט" : "המשך"}
          </button>
          <button
            onClick={handleBack}
            className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white py-3 rounded-full text-base hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {step === 1 ? "ביטול" : "חזרה"}
          </button>
        </div>
      </div>
    </div>
  );
}
