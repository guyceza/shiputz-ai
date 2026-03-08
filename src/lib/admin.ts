// Single source of truth for admin emails
// Import this instead of hardcoding email checks
export const ADMIN_EMAILS = ['guyceza@gmail.com'];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
