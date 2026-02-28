/**
 * Centralized admin configuration
 * Single source of truth for admin emails across the app
 */

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'guyceza@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
