/**
 * Friendly error messages for API responses
 * All messages are in Hebrew for user-facing errors
 */

export const API_ERRORS = {
  // Rate limiting
  RATE_LIMIT: {
    message: "המערכת עמוסה כרגע. נסה שוב בעוד דקה.",
    code: "RATE_LIMIT",
    status: 429
  },
  
  // Monthly limit
  MONTHLY_LIMIT: {
    message: "הגעת למכסה החודשית. המכסה מתאפסת בתחילת החודש הבא.",
    code: "MONTHLY_LIMIT",
    status: 429
  },
  
  // Auth errors
  AUTH_REQUIRED: {
    message: "נדרשת התחברות לשימוש בשירות זה.",
    code: "AUTH_REQUIRED",
    status: 401
  },
  
  SUBSCRIPTION_REQUIRED: {
    message: "שירות זה דורש מנוי פעיל.",
    code: "SUBSCRIPTION_REQUIRED",
    status: 403
  },
  
  // Server errors
  SERVER_ERROR: {
    message: "אירעה שגיאה. נסה שוב מאוחר יותר.",
    code: "SERVER_ERROR",
    status: 500
  },
  
  API_UNAVAILABLE: {
    message: "השירות אינו זמין כרגע. נסה שוב בעוד מספר דקות.",
    code: "API_UNAVAILABLE",
    status: 503
  },
  
  // Input errors
  INVALID_INPUT: {
    message: "הנתונים שהוזנו אינם תקינים.",
    code: "INVALID_INPUT",
    status: 400
  },
  
  IMAGE_NOT_SUPPORTED: {
    message: "לא ניתן לעבד את התמונה הזו. נסה להעלות תמונה אחרת.",
    code: "IMAGE_NOT_SUPPORTED",
    status: 400
  }
} as const;

export type ApiErrorCode = keyof typeof API_ERRORS;

// Helper to create error response
export function createErrorResponse(errorType: ApiErrorCode, details?: string) {
  const error = API_ERRORS[errorType];
  return {
    error: details ? `${error.message} (${details})` : error.message,
    code: error.code,
    status: error.status
  };
}
