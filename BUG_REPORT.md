# ShiputzAI Full Code Audit - Bug Report
**Date:** 2026-02-24  
**Auditor:** Clawd AI  
**Scope:** Complete codebase review

---

## 🔴 CRITICAL - Security Issues

### Bug #1: PayPlus Webhook - No Signature Verification
- **File:** `src/app/api/payplus/webhook/route.ts`
- **Line(s):** All
- **Severity:** Critical
- **Description:** The webhook accepts any POST request without verifying PayPlus signature. Anyone who knows the endpoint can fake payment completions.
- **Impact:** Attackers can grant themselves premium access, mark subscriptions as active, or create fake transactions without paying.
- **Suggested fix:** Add PayPlus signature verification using their HMAC-SHA256 signing mechanism:
```typescript
const expectedSignature = crypto.createHmac('sha256', process.env.PAYPLUS_SECRET_KEY)
  .update(rawBody)
  .digest('hex');
const receivedSignature = request.headers.get('x-payplus-signature');
if (expectedSignature !== receivedSignature) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

---

### Bug #2: Admin Check API Returns Email List from Environment Variable
- **File:** `src/app/api/admin/check/route.ts`
- **Line(s):** 4
- **Severity:** High
- **Description:** ADMIN_EMAILS hardcoded with fallback. Environment variable pattern `(process.env.ADMIN_EMAILS || 'guyceza@gmail.com')` is fine, but if someone fuzzes the email parameter, they can test for valid admin emails.
- **Impact:** Information leakage about admin accounts.
- **Suggested fix:** Add rate limiting and don't reveal if an email exists in the admin list; always return `{isAdmin: false}` for invalid/unknown.

---

### Bug #3: Resend API Key Hardcoded in File
- **File:** `src/app/api/admin/send-test-email/route.ts`
- **Line(s):** 4
- **Severity:** Critical
- **Description:** `const RESEND_KEY = process.env.RESEND_API_KEY || 're_DUfgFQ4J_KnMvhKXtaDC9g4Q6ZaiEMjEo';` - The fallback contains an actual API key.
- **Impact:** Anyone with access to the source code can use this API key to send emails from your domain.
- **Suggested fix:** Remove the hardcoded fallback immediately. Use `const RESEND_KEY = process.env.RESEND_API_KEY;` and fail gracefully if not set.

---

### Bug #4: Admin Routes Missing Consistent Authorization
- **File:** Multiple admin routes
- **Line(s):** Various
- **Severity:** High
- **Description:** Admin routes use different authorization methods inconsistently:
  - Some use `verifyAdmin(adminEmail)` from body
  - Some use Bearer token + query param fallback
  - Some only check if email is in ADMIN_EMAILS array
- **Impact:** Potential bypass of admin controls. Inconsistent security is a vulnerability.
- **Suggested fix:** Implement a single `verifyAdminAuth(request)` middleware that:
  1. Checks for valid Bearer token
  2. Verifies user exists in database
  3. Confirms email is in ADMIN_EMAILS

---

### Bug #5: Projects API Has No Ownership Verification
- **File:** `src/app/api/projects/route.ts`, `src/app/api/projects/[id]/route.ts`
- **Line(s):** All PATCH/DELETE operations
- **Severity:** High
- **Description:** The DELETE and PATCH endpoints accept any `projectId` without verifying the requesting user owns it. The service client bypasses RLS.
- **Impact:** Any authenticated user could delete or modify other users' projects.
- **Suggested fix:** Add ownership verification:
```typescript
// Before delete/update
const { data: project } = await supabase
  .from('projects')
  .select('user_id')
  .eq('id', projectId)
  .single();
if (!project || project.user_id !== userId) {
  return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
}
```

---

### Bug #6: Visualization Delete Has Inadequate Ownership Check
- **File:** `src/app/api/delete-visualization/route.ts`
- **Line(s):** 17-21
- **Severity:** Medium
- **Description:** The delete query filters by `id` AND `user_id`, but if no row matches, it silently succeeds. An attacker could enumerate visualization IDs.
- **Impact:** Information disclosure about valid visualization IDs.
- **Suggested fix:** Check if a row was actually deleted and return 404 if not found.

---

## 🟠 HIGH - Logic & Data Integrity Issues

### Bug #7: PayPlus Webhook Type Confusion
- **File:** `src/app/api/payplus/webhook/route.ts`
- **Line(s):** 61-66
- **Severity:** High
- **Description:** Status code comparison uses both string and number: `status_code === '0' || status_code === 0`. PayPlus might send inconsistent types, but this loose comparison could be exploited.
- **Impact:** Payment status could be misinterpreted.
- **Suggested fix:** Convert to string explicitly: `String(status_code) === '0'`

---

### Bug #8: User Upsert Logic Race Condition
- **File:** `src/app/api/payplus/webhook/route.ts`
- **Line(s):** 97-125
- **Severity:** High
- **Description:** The update-then-insert pattern creates a race condition. Two webhooks for the same user could both try to insert, with one failing.
- **Impact:** Premium status might not be saved for some users.
- **Suggested fix:** Use Supabase's `upsert` with conflict handling:
```typescript
await supabase.from('users').upsert({
  email: email.toLowerCase(),
  purchased: true,
  ...
}, { onConflict: 'email' });
```

---

### Bug #9: Vision Usage Counter Race Condition
- **File:** `src/app/api/visualize/route.ts`
- **Line(s):** 88-110
- **Severity:** Medium
- **Description:** `incrementUsage` reads current count, then updates. Two concurrent requests could both read the same count and both write count+1.
- **Impact:** Users could get more than 10 visualizations per month.
- **Suggested fix:** Use atomic increment with SQL:
```typescript
await supabase.rpc('increment_vision_usage', { user_email: userEmail.toLowerCase() });
```

---

### Bug #10: Email Sequence Cron - No Locking Mechanism
- **File:** `src/app/api/cron/emails/route.ts`
- **Line(s):** All
- **Severity:** Medium
- **Description:** If the cron job takes longer than expected and triggers again (or runs in multiple regions), duplicate emails could be sent. The check for "already sent" is not atomic.
- **Impact:** Users could receive duplicate emails.
- **Suggested fix:** Add a distributed lock (e.g., using Supabase row lock or Redis) at the start of the cron job, or use idempotency keys.

---

### Bug #11: Discount Code Validation Timing Attack
- **File:** `src/app/api/discount/route.ts`
- **Line(s):** 30-60
- **Severity:** Low
- **Description:** Different error messages reveal information: "Code not found" vs "Code belongs to different email" vs "Already used".
- **Impact:** Attackers can enumerate valid codes by checking response messages.
- **Suggested fix:** Use a generic "Invalid code" message for all failure cases.

---

### Bug #12: Vision Trial - No Atomic Flag + Generation
- **File:** `src/app/api/visualize/route.ts`, client code
- **Line(s):** 64-80, frontend
- **Severity:** Medium
- **Description:** Trial check happens before generation, but trial is marked as used AFTER successful generation. User could open multiple tabs, start generation in all, and get multiple free uses.
- **Impact:** Users can abuse free trial.
- **Suggested fix:** Mark trial as used BEFORE starting generation, or use optimistic locking with version check.

---

## 🟡 MEDIUM - Code Quality & Reliability

### Bug #13: Inconsistent Email Normalization
- **File:** Multiple files
- **Line(s):** Various
- **Severity:** Medium
- **Description:** Some places use `email.toLowerCase()`, some don't. For example in `src/app/api/users/route.ts` it's normalized, but in some webhook handlers it might not be.
- **Impact:** User might register as "User@Example.com" but webhook arrives with "user@example.com", causing lookup failures.
- **Suggested fix:** Always normalize to lowercase at entry points (API routes, webhooks).

---

### Bug #14: Missing Error Handling in Rate Limiter
- **File:** `src/lib/rate-limit.ts`
- **Line(s):** 45-52
- **Severity:** Low
- **Description:** `getClientId` returns 'unknown' if no IP headers found. This means all users behind the same proxy or with stripped headers share one rate limit bucket.
- **Impact:** Rate limiting effectiveness reduced; potential DoS vector.
- **Suggested fix:** Add user-based rate limiting (by user ID or session) as fallback.

---

### Bug #15: In-Memory Usage Monitor Resets on Cold Start
- **File:** `src/lib/usage-monitor.ts`
- **Line(s):** All
- **Severity:** Low
- **Description:** Comment says "In production, consider using Redis or database" but it's still using in-memory storage. On serverless, each instance has separate counters.
- **Impact:** Usage stats are inaccurate; alerts won't trigger reliably.
- **Suggested fix:** Store usage stats in Supabase or use Vercel KV/Redis.

---

### Bug #16: Supabase Client Singleton Not Thread-Safe
- **File:** `src/lib/supabase.ts`
- **Line(s):** 7-30
- **Severity:** Low
- **Description:** Lazy initialization of `_supabaseClient` and `_serviceClient` isn't thread-safe. In serverless, this is usually fine, but could cause issues with concurrent initialization.
- **Impact:** Minor: potential extra client creation.
- **Suggested fix:** Use module-level initialization with conditional checks, or accept the rare duplicate creation.

---

### Bug #17: Dashboard State Sync Race Condition
- **File:** `src/app/dashboard/page.tsx`
- **Line(s):** 70-120
- **Severity:** Medium
- **Description:** Multiple parallel API calls (`Promise.all`) update state, but localStorage is also being read/written in parallel. State could be inconsistent.
- **Impact:** User might see stale premium status after refresh.
- **Suggested fix:** Batch localStorage writes, or use a state management library with persistence.

---

### Bug #18: Auth Callback Handled Flag Race
- **File:** `src/app/auth/callback/page.tsx`
- **Line(s):** 9-13
- **Severity:** Medium
- **Description:** `setHandled(true)` is async state update, so if `handleUserSession` is called rapidly, it might execute twice before `handled` becomes `true`.
- **Impact:** User data saved twice; possible duplicate welcome emails.
- **Suggested fix:** Use a ref instead of state for the handled flag:
```typescript
const handledRef = useRef(false);
if (handledRef.current) return;
handledRef.current = true;
```

---

### Bug #19: Missing Type Safety on API Responses
- **File:** Multiple API routes
- **Line(s):** Various
- **Severity:** Low
- **Description:** Many API routes cast to `any` or don't validate response shapes. TypeScript's strict mode helps, but runtime validation is missing.
- **Impact:** Runtime errors if Supabase schema changes.
- **Suggested fix:** Add Zod or similar for runtime validation of API inputs/outputs.

---

### Bug #20: Visualization Before/After Image URL Construction
- **File:** `src/app/api/save-visualization/route.ts`
- **Line(s):** 7
- **Severity:** Medium
- **Description:** `SUPABASE_URL` has hardcoded fallback URL. If environment variable is missing, all image URLs point to wrong bucket.
- **Impact:** Images would be saved to wrong storage location or URL construction would fail.
- **Suggested fix:** Remove fallback; throw error if env var missing:
```typescript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) throw new Error('SUPABASE_URL not configured');
```

---

## 🔵 LOW - Minor Issues & Improvements

### Bug #21: Unused Variable in detect-items Route
- **File:** `src/app/api/detect-items/route.ts`
- **Line(s):** 8
- **Severity:** Low (Code smell)
- **Description:** `import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";` - `GEMINI_BASE_URL` is imported but never used.
- **Impact:** Dead code; minor bundle size increase.
- **Suggested fix:** Remove unused import.

---

### Bug #22: Hardcoded Domain in Multiple Places
- **File:** Multiple files
- **Line(s):** Various (search for "shipazti.com")
- **Severity:** Low
- **Description:** Domain "shipazti.com" is hardcoded in email templates, redirects, etc. instead of using `process.env.NEXT_PUBLIC_BASE_URL`.
- **Impact:** Makes staging/development harder; links might break if domain changes.
- **Suggested fix:** Use environment variable for base URL consistently.

---

### Bug #23: Missing Unsubscribe Link Validation
- **File:** `src/app/api/unsubscribe/route.ts`
- **Line(s):** All
- **Severity:** Low
- **Description:** Anyone can unsubscribe any email by calling the POST endpoint. There's no token/signature verification.
- **Impact:** Attackers could unsubscribe legitimate users from emails.
- **Suggested fix:** Add a signed token to unsubscribe links: `?email=...&token=hmac(email, secret)`

---

### Bug #24: Cron Secret Header Check Is Incomplete
- **File:** `src/app/api/cron/emails/route.ts`
- **Line(s):** 244-247
- **Severity:** Low
- **Description:** Checks `if (process.env.CRON_SECRET && authHeader !== ...)` - if CRON_SECRET is not set, anyone can trigger the cron.
- **Impact:** Anyone could trigger email sends (though they'd need to know the endpoint).
- **Suggested fix:** Always require CRON_SECRET in production; fail if not set.

---

### Bug #25: JSON Parse Without Try-Catch in Multiple Places
- **File:** Multiple client components
- **Line(s):** Various `JSON.parse(localStorage.getItem(...))`
- **Severity:** Low
- **Description:** If localStorage contains invalid JSON, the app crashes.
- **Impact:** User gets stuck on error page.
- **Suggested fix:** Wrap in try-catch:
```typescript
try {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
} catch {
  localStorage.removeItem("user");
  router.push("/login");
}
```

---

### Bug #26: Missing Loading State on Premium Check Buttons
- **File:** `src/app/checkout/page.tsx`
- **Line(s):** Various
- **Severity:** Low (UX)
- **Description:** During discount code validation, the button says "..." but other UI elements don't indicate loading.
- **Impact:** Confusing UX.
- **Suggested fix:** Disable form inputs during validation.

---

### Bug #27: Email Templates Have Inline Styles Repeated
- **File:** `src/app/api/cron/emails/route.ts`
- **Line(s):** 35-400
- **Severity:** Low (Maintainability)
- **Description:** Massive inline HTML templates are hard to maintain. Styles are repeated hundreds of times.
- **Impact:** Hard to update email design; increases bundle size.
- **Suggested fix:** Move email templates to separate files; consider using React Email or similar.

---

### Bug #28: Potential Memory Leak in Rate Limiter Cleanup
- **File:** `src/lib/rate-limit.ts`
- **Line(s):** 10-15
- **Severity:** Low
- **Description:** `setInterval` for cleanup runs forever. In serverless, this is fine (instance dies), but in traditional Node.js it could accumulate.
- **Impact:** Minor memory leak in long-running processes.
- **Suggested fix:** Clear interval on process exit, or use WeakMap with automatic GC.

---

### Bug #29: Chat Support Rate Limiter Conflicts with Main Rate Limiter
- **File:** `src/app/api/chat-support/route.ts`
- **Line(s):** 69-80
- **Severity:** Low
- **Description:** Has its own separate `rateLimitMap` that duplicates the logic in `@/lib/rate-limit.ts`.
- **Impact:** Inconsistent rate limiting; maintenance overhead.
- **Suggested fix:** Use the shared rate limiter.

---

### Bug #30: Projects Migration Logic Runs Every Load
- **File:** `src/lib/projects.ts`
- **Line(s):** 140-200
- **Severity:** Low
- **Description:** `migrateLocalStorageProjects` is called on every dashboard load. It has a skip check, but still does a localStorage read and potentially a Supabase query.
- **Impact:** Unnecessary database calls.
- **Suggested fix:** Move migration flag to session storage to avoid repeat checks within same session.

---

## 📋 Vercel Configuration Issues

### Bug #31: Missing Function Timeout for Some Routes
- **File:** `vercel.json`
- **Line(s):** All
- **Severity:** Low
- **Description:** Only `visualize`, `detect-products`, and `scan-receipt` have `maxDuration: 60`. Other AI routes like `analyze-quote` and `ai-assistant` also do API calls that could take time.
- **Impact:** These routes might timeout on slow connections.
- **Suggested fix:** Add `maxDuration` for all AI-powered routes.

---

### Bug #32: No Edge Runtime for Static Routes
- **File:** Various pages
- **Line(s):** N/A
- **Severity:** Low
- **Description:** Static pages like `/privacy` and `/terms` don't specify runtime. They could benefit from edge deployment for faster TTFB.
- **Impact:** Slightly slower page loads in some regions.
- **Suggested fix:** Add `export const runtime = 'edge'` where appropriate.

---

## 📋 Database / Supabase Issues

### Bug #33: Missing Index on vision_usage_month
- **File:** `supabase-migration.sql`
- **Line(s):** Various
- **Severity:** Low
- **Description:** Queries filter by `vision_usage_month` but there's no index on this column.
- **Impact:** Slower queries as user count grows.
- **Suggested fix:** Add index: `CREATE INDEX idx_users_vision_month ON users(vision_usage_month);`

---

### Bug #34: Visualizations Table Missing user_id Index
- **File:** `supabase-migrations/visualizations.sql`
- **Line(s):** Unknown (not fully visible)
- **Severity:** Low
- **Description:** Queries filter by `user_id` on visualizations table. If no index exists, scans will be slow.
- **Impact:** History loading slows as data grows.
- **Suggested fix:** Add index on `visualizations(user_id)`.

---

### Bug #35: transactions Table Insert Might Fail Silently
- **File:** `src/app/api/payplus/webhook/route.ts`
- **Line(s):** 196-215
- **Severity:** Low
- **Description:** Transaction logging error is caught and logged but continues. If transactions table doesn't exist, you lose transaction history.
- **Impact:** Lost audit trail.
- **Suggested fix:** At minimum, send an alert when transaction logging fails.

---

## 📋 Email / Resend Integration Issues

### Bug #36: No Bounce/Complaint Handling
- **File:** Email routes
- **Line(s):** N/A
- **Severity:** Medium
- **Description:** No webhook configured for Resend bounce/complaint events. Emails to invalid addresses keep being sent.
- **Impact:** Email reputation damage; wasted API calls.
- **Suggested fix:** Set up Resend webhook for bounces; automatically unsubscribe hard bounces.

---

### Bug #37: Email Send Failures Not Retried
- **File:** `src/app/api/cron/emails/route.ts`
- **Line(s):** 236-240
- **Severity:** Medium
- **Description:** If `sendEmail` fails, it's counted in `errors` but the email is never retried.
- **Impact:** Users might miss important emails.
- **Suggested fix:** Implement retry logic with exponential backoff, or use a queue.

---

## 📋 PayPlus Integration Issues

### Bug #38: Recurring Payment Cancellation Multiple Paths
- **File:** `src/app/api/payplus/webhook/route.ts`
- **Line(s):** 44-58
- **Severity:** Medium
- **Description:** Cancellation is detected by `type === 'recurring_cancel' || data.action === 'cancel' || data.status === 'cancelled'`. This is guessing at PayPlus's API; it should be documented/verified.
- **Impact:** Cancellations might be missed if PayPlus uses different fields.
- **Suggested fix:** Verify with PayPlus documentation what exact fields are sent for cancellation.

---

### Bug #39: No Refund Handling
- **File:** `src/app/api/payplus/webhook/route.ts`
- **Line(s):** N/A
- **Severity:** Medium
- **Description:** There's no handler for refund webhooks. If a payment is refunded in PayPlus dashboard, user keeps premium.
- **Impact:** Revenue leakage; users keep access after refund.
- **Suggested fix:** Add refund handling to revoke premium status.

---

## Summary Statistics

| Severity | Count |
|----------|-------|
| 🔴 Critical | 6 |
| 🟠 High | 6 |
| 🟡 Medium | 14 |
| 🔵 Low | 13 |
| **Total** | **39** |

## Recommended Priority

1. **Immediate (Today):**
   - Bug #1: PayPlus signature verification
   - Bug #3: Remove hardcoded API key
   
2. **This Week:**
   - Bug #5: Projects ownership verification
   - Bug #7-8: PayPlus webhook improvements
   - Bug #12: Trial abuse prevention
   
3. **This Sprint:**
   - Bug #2, #4: Admin authorization consistency
   - Bug #9-11: Race conditions and atomic operations
   - Bug #36-37: Email reliability
   
4. **Backlog:**
   - All Low severity bugs
   - Performance optimizations
   - Code cleanup
