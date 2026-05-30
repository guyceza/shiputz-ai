"use client";

type Gtag = (...args: unknown[]) => void;

type GtagWindow = Window & {
  gtag?: Gtag;
};

const GOOGLE_ADS_ID = "AW-17986657494";

export const GOOGLE_ADS_CONVERSIONS = {
  signup: `${GOOGLE_ADS_ID}/d13QCJrKn4IcENa52oBD`,
  purchase: `${GOOGLE_ADS_ID}/kwLzCLKnzLAcENa52oBD`,
} as const;

function getGtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  const gtag = (window as GtagWindow).gtag;
  return typeof gtag === "function" ? gtag : null;
}

export function trackAnalyticsEvent(
  name: string,
  params: Record<string, unknown> = {}
) {
  const gtag = getGtag();
  if (!gtag) return false;
  gtag("event", name, params);
  return true;
}

export function trackGoogleAdsConversion(
  sendTo: string,
  params: Record<string, unknown> = {}
) {
  return trackAnalyticsEvent("conversion", {
    send_to: sendTo,
    ...params,
  });
}

export function trackSignupConversion(method: string) {
  const key = "shiputzai_signup_conversion_tracked";
  if (sessionStorage.getItem(key)) return;

  let attempts = 0;
  const fire = () => {
    if (sessionStorage.getItem(key)) return;
    attempts += 1;

    if (
      trackGoogleAdsConversion(GOOGLE_ADS_CONVERSIONS.signup, {
        method,
      })
    ) {
      trackAnalyticsEvent("sign_up", {
        method,
      });
      sessionStorage.setItem(key, "1");
      return;
    }

    if (attempts < 20) {
      window.setTimeout(fire, 500);
    }
  };

  fire();
}
