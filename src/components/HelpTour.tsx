"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";

export interface HelpTourStep {
  title: string;
  body: string;
  selector?: string;
}

interface HelpTourProps {
  steps: HelpTourStep[];
  storageKey: string;
  className?: string;
}

const DISABLED_KEY = "shiputzai_help_tips_disabled";

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export default function HelpTour({ steps, storageKey, className = "" }: HelpTourProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!steps.length) return;

    const disabled = localStorage.getItem(DISABLED_KEY) === "true";
    const seen = localStorage.getItem(storageKey) === "true";

    if (!disabled && !seen) {
      const timer = window.setTimeout(() => setOpen(true), 650);
      return () => window.clearTimeout(timer);
    }
  }, [steps.length, storageKey]);

  const completeTour = () => {
    localStorage.setItem(storageKey, "true");
    setOpen(false);
    setHighlight(null);
  };

  const disableTips = () => {
    localStorage.setItem(DISABLED_KEY, "true");
    localStorage.setItem(storageKey, "true");
    setOpen(false);
    setHighlight(null);
  };

  useEffect(() => {
    const measureHighlight = () => {
      if (!open || !currentStep?.selector) {
        window.requestAnimationFrame(() => setHighlight(null));
        return;
      }

      const target = document.querySelector(currentStep.selector);
      if (!target) {
        window.requestAnimationFrame(() => setHighlight(null));
        return;
      }

      const rect = target.getBoundingClientRect();
      setHighlight({
        top: Math.max(8, rect.top - 8),
        left: Math.max(8, rect.left - 8),
        width: Math.min(window.innerWidth - 16, rect.width + 16),
        height: rect.height + 16,
      });
    };

    const scrollToCurrentStep = () => {
      if (!open || !currentStep?.selector) return;
      const target = document.querySelector(currentStep.selector);
      target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    };

    window.requestAnimationFrame(scrollToCurrentStep);
    window.requestAnimationFrame(measureHighlight);
      window.setTimeout(() => {
      measureHighlight();
      }, 220);

    window.addEventListener("resize", measureHighlight);
    window.addEventListener("scroll", measureHighlight, true);

    return () => {
      window.removeEventListener("resize", measureHighlight);
      window.removeEventListener("scroll", measureHighlight, true);
    };
  }, [currentStep?.selector, open]);

  if (!open || !steps.length || !currentStep) return null;

  const panelStyle = highlight && window.innerWidth >= 768
    ? {
        top: highlight.top + highlight.height + 260 < window.innerHeight
          ? highlight.top + highlight.height + 14
          : Math.max(16, highlight.top - 246),
      }
    : undefined;

  return (
    <div className={`fixed inset-0 z-[70] print:hidden ${className}`} dir="rtl">
      <div className="absolute inset-0 bg-stone-950/28 backdrop-blur-[1px]" onClick={completeTour} />

      {highlight && (
        <div
          className="fixed rounded-2xl border-2 border-amber-400 bg-amber-100/10 shadow-[0_0_0_9999px_rgba(28,25,23,0.30),0_18px_48px_rgba(120,53,15,0.24)] transition-all duration-300"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        />
      )}

      <div
        className={`fixed right-4 left-4 bottom-4 md:left-auto md:right-8 md:bottom-auto md:w-[420px] rounded-2xl border border-amber-200/80 bg-[#fff9f1] p-5 shadow-2xl shadow-stone-900/20`}
        style={panelStyle}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900">
              <Lightbulb className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-700">
                טיפ {stepIndex + 1} מתוך {steps.length}
              </p>
              <h2 className="mt-1 text-lg font-semibold leading-tight text-stone-900">{currentStep.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={completeTour}
            aria-label="סגור"
            className="rounded-full p-2 text-stone-500 transition-colors hover:bg-amber-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm leading-6 text-stone-700">{currentStep.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={disableTips}
            className="text-xs font-medium text-stone-500 underline-offset-4 transition-colors hover:text-stone-900 hover:underline"
          >
            אני לא רוצה טיפים
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={stepIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-stone-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="הקודם"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => (isLastStep ? completeTour() : setStepIndex((index) => index + 1))}
              className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
            >
              {isLastStep ? "סיימתי" : "הבא"}
              {!isLastStep && <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${index === stepIndex ? "w-6 bg-amber-500" : "w-1.5 bg-amber-200"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
