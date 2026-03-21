"use client";

import Link from "next/link";

export interface WizardStep {
  num: number;
  label: string;
  description: string;
  status: "done" | "current" | "locked";
  href?: string;
  action?: () => void;
}

interface Props {
  steps: WizardStep[];
  projectId: string;
  onDismiss?: () => void;
}

export default function ProjectWizardStepper({ steps, projectId, onDismiss }: Props) {
  const currentStep = steps.find(s => s.status === "current");
  const completedCount = steps.filter(s => s.status === "done").length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 mb-6 print:hidden">
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">מדריך הפרויקט</h3>
            <p className="text-sm text-gray-500 mt-0.5">{completedCount} מתוך {steps.length} שלבים הושלמו</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{progress}%</div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                title="הסתר מדריך"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-5">
          <div
            className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step) => {
            const content = (
              <div
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step.status === "current"
                    ? "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                    : step.status === "done"
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                {/* Step indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                  step.status === "done"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : step.status === "current"
                    ? "border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-2 border-gray-300 dark:border-gray-600 text-gray-400"
                }`}>
                  {step.status === "done" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{step.label}</div>
                  <div className="text-xs text-gray-500 truncate">{step.description}</div>
                </div>

                {/* Action arrow for current step */}
                {step.status === "current" && (
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </div>
            );

            if (step.href && step.status !== "locked") {
              return (
                <Link key={step.num} href={step.href} className="block">
                  {content}
                </Link>
              );
            }

            if (step.action && step.status !== "locked") {
              return (
                <button key={step.num} onClick={step.action} className="block w-full text-right">
                  {content}
                </button>
              );
            }

            return <div key={step.num}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
