# ShiputzAI — API Map

> נוצר 2026-02-28 | 46 routes | מסמך ייחוס לפני שינויי auth
> אומת מול הקוד בפועל — כל שורה נבדקה

---

## סיכום Auth

| רמה | כמות | הסבר |
|------|-------|-------|
| 🔴 NONE | 8 | בלי שום בדיקה, פתוח לכולם |
| 🟡 userId-scoped | 16 | הקליינט שולח userId — שולף רק את הדאטה שלו |
| 🟠 email-scoped | 10 | הקליינט שולח email — שולף/מעדכן רק שלו |
| 🔵 premium-check | 5 | בודק שהמשתמש קיים + premium ב-DB |
| 🔵 user-exists | 1 | בודק שהמשתמש קיים ב-DB (בלי premium) |
| 🟣 admin | 8 | בודק adminEmail מול ADMIN_EMAILS |
| 🔒 CRON_SECRET | 2 | מוגן ע"י Vercel CRON_SECRET header |
| 🟤 visualize | 1 | auth cookie/header + subscription + trial + usage limit |

---

## 🔴 פתוח לגמרי (אין auth, אין userId/email)

| Route | Method | מה עושה | Rate Limit | סיכון |
|-------|--------|---------|------------|-------|
| `/chat-support` | POST | צ'אט תמיכה AI (Gemini) | 10/min | נמוך — שורף Gemini credits |
| `/bill-of-quantities` | POST | כתב כמויות AI | 20/min | נמוך — שורף credits |
| `/analyze-quote-text` | POST | ניתוח הצעת מחיר (טקסט בלבד) | 20/min | נמוך |
| `/calculate-materials` | POST/GET | מחשבון חומרים (לא AI, חישוב מקומי) | ❌ | אפסי |
| `/contact` | POST | טופס יצירת קשר → מייל Resend | ❌ | נמוך (XSS fixed) |
| `/newsletter` | POST | הרשמה לניוזלטר (Supabase + Resend audience) | 5/min | נמוך |
| `/lab/analyze-blueprint` | POST | ניתוח שרטוט AI (Gemini) | 15/min | נמוך — שורף credits |
| `/lab/render-3d` | POST | רינדור 3D מנתוני חדרים | ❌ | אפסי |
| `/lab/render-gltf` | POST | רינדור GLTF מנתוני חדרים | ❌ | אפסי |

---

## 🟡 userId-scoped (הקליינט שולח userId, שולף רק שלו)

| Route | Method | מה עושה | בדיקת בעלות | סיכון |
|-------|--------|---------|-------------|-------|
| `/get-visualizations` | GET | שליפת הדמיות | `verifyAuth()` (always true!) + `eq('user_id', userId)` | ⚠️ ניחוש UUID = צפייה בתמונות |
| `/get-shop-look-history` | GET | היסטוריית Shop the Look | `eq('user_id', userId)` בלבד | ⚠️ כנ"ל |
| `/projects` | GET | שליפת פרויקטים | `eq('user_id', userId)` בלבד | ⚠️ ניחוש UUID |
| `/projects` | POST | יצירת פרויקט | שומר עם userId שנשלח | נמוך — יוצר בלבד |
| `/projects` | PATCH | עדכון פרויקט | ✅ `project.user_id !== userId` | תקין |
| `/projects` | DELETE | מחיקת פרויקט | ✅ `project.user_id !== userId` | תקין |
| `/projects/[id]` | GET | פרויקט בודד by ID | ❌ **אין בדיקת userId!** | 🔴 כל ID = גישה |
| `/projects/[id]` | PATCH | עדכון פרויקט | ✅ `project.user_id !== userId` | תקין |
| `/projects/[id]` | DELETE | מחיקת פרויקט | ✅ `project.user_id !== userId` | תקין |
| `/save-visualization` | POST | שמירת הדמיה (תמונות ל-storage) | שומר עם userId שנשלח | נמוך |
| `/save-vision-history` | POST | שמירת היסטוריית vision | שומר עם userId | נמוך |
| `/save-shop-look-image` | POST | שמירת תמונת shop look + יצירת פרויקט | שומר עם userId | נמוך |
| `/delete-visualization` | POST | מחיקת הדמיה + תמונות מ-storage | ✅ `viz.user_id !== userId` | תקין |
| `/update-visualization-products` | POST | עדכון מוצרים בהדמיה | ⚠️ `userId && viz.user_id !== userId` — אם לא שולחים userId, הבדיקה נדלגת! | ⚠️ bypass אפשרי |
| `/update-vision-history-products` | POST | עדכון מוצרים בהיסטוריה | ⚠️ `userId && item.user_id !== userId` — כנ"ל | ⚠️ bypass אפשרי |
| `/upload-image` | POST | העלאת תמונה ל-Supabase storage | path כולל userId | נמוך |
| `/user-settings` | GET/POST | הגדרות משתמש (upsert) | `eq('user_id', userId)` בלבד | ⚠️ ניחוש UUID |
| `/share` | POST | יצירת share token לפרויקט | ✅ `project.user_id !== userId` | תקין |
| `/share` | GET | צפייה בשיתוף by token | token-based (random UUID) | תקין |

---

## 🟠 email-scoped (הקליינט שולח email)

| Route | Method | מה עושה | סיכון |
|-------|--------|---------|-------|
| `/users` | GET | שליפת פרטי משתמש (id, email, name, purchased, created_at) | נמוך — חושף סטטוס premium |
| `/users` | POST | יצירת משתמש חדש + welcome email | נמוך |
| `/users` | PATCH | סימון user כ-purchased (admin only) | admin string match בלבד (❌ בלי DB check) | ⚠️ |
| `/check-vision` | GET | בדיקת מנוי vision by email | נמוך |
| `/vision-trial` | GET | בדיקת trial status by email | נמוך |
| `/vision-trial` | POST | סימון trial כמנוצל | ⚠️ כל אחד יכול לסמן trial של אחרים |
| `/cancel-vision` | POST | ביטול מנוי vision — מעדכן DB | 🔴 **כל אחד יכול לבטל מנוי של כל email!** |
| `/unsubscribe` | GET/POST | הסרה מניוזלטר + newsletter table | ⚠️ אין token verification (backward compat) |
| `/send-welcome` | POST | שליחת welcome email | 1/hour | נמוך |
| `/auth/check-provider` | GET | בדיקה אם email רשום ואיזה provider (email/google) | נמוך — user enumeration |
| `/discount` | POST/PATCH | בדיקת/שימוש קוד הנחה | ✅ code+email match | תקין |
| `/discount-vision` | POST | קוד הנחה vision | ✅ code+email match | 10/min | תקין |

---

## 🔵 premium-check (בודק email קיים + purchased=true ב-DB)

| Route | Method | מה עושה | Rate Limit | בדיקה |
|-------|--------|---------|------------|-------|
| `/analyze-quote` | POST | ניתוח הצעת מחיר (תמונה, Gemini) | 15/min | `verifyUserPremium(email)` |
| `/scan-receipt` | POST | סריקת קבלה (תמונה, Gemini) | 30/min | `verifyUserPremium(email)` |
| `/detect-items` | POST | זיהוי פריטים בתמונה (Gemini) | 20/min | `verifyUserPremium(email)` |
| `/ai-assistant` | POST | AI צ'אט premium (Gemini) | 20/min | `verifyUserPremium(email)` |

> בודק ב-DB ש-`purchased === true`. אם המשתמש לא premium → 403.

---

## 🔵 user-exists (בודק email קיים ב-DB, בלי premium)

| Route | Method | מה עושה | Rate Limit | בדיקה |
|-------|--------|---------|------------|-------|
| `/detect-products` | POST | Shop the Look (Gemini) | 30/min | `verifyUserExists(email)` — **לא בודק premium!** |

> הערה: Shop the Look זמין גם ב-trial. בודק רק שהמשתמש קיים.

---

## 🟤 visualize (Auth מורכב — הכי מאובטח)

| Route | Method | מה עושה | Auth |
|-------|--------|---------|------|
| `/visualize` | POST | הדמיית AI (Gemini image generation) | cookie/header + subscription logic |

**שכבות Auth:**
1. `verifyAuth()` — בודק Supabase cookie (`sb-*`) או Bearer token
2. `verifyUserExists(email)` — בודק שהמשתמש קיים ב-DB
3. `verifySubscription(email)` — בודק premium + vision + trial + usage
4. Trial logic — `markTrialUsed()` atomic (מונע race condition)
5. Monthly limit — 10 הדמיות/חודש למנויי Vision
6. Admin bypass — `guyceza@gmail.com` unlimited (hardcoded)

---

## 🟣 admin (בדיקת adminEmail)

| Route | Method | מה עושה | Auth Method | סיכון |
|-------|--------|---------|-------------|-------|
| `/admin/check` | GET/POST | בדיקה אם email הוא admin | string match + rate limit (20/min) | נמוך |
| `/admin/stats` | GET | סטטיסטיקות (users, premium, vision, alerts) | `verifyAdmin()` — string match + DB check | תקין |
| `/admin/users` | GET | רשימת כל המשתמשים + חיפוש/פילטר | Supabase session (fallback: adminEmail + DB) | ⚠️ fallback חלש |
| `/admin/users` | PATCH | עדכון משתמש (name, purchased, vision, trial) | Supabase session (fallback: adminEmail + DB) | ⚠️ fallback חלש |
| `/admin/premium` | GET/POST/DELETE | ניהול premium (הוספה/הסרה) | `verifyAdmin()` — string match + DB check | תקין |
| `/admin/banned` | GET/POST/DELETE | ניהול חסומים | `verifyAdmin()` — string match + DB check | תקין |
| `/admin/trial-reset` | GET/POST/DELETE | איפוס trial | `verifyAdmin()` — string match + DB check | תקין |
| `/admin/email-preview` | GET | תצוגת תבנית מייל (HTML) | `verifyAdmin()` — string match + DB check | תקין ✅ |
| `/admin/send-test-email` | POST | שליחת מייל test | string match בלבד (❌ בלי DB check) | ⚠️ |

> `verifyAdmin()` = בודק ש-email ברשימת ADMIN_EMAILS **וגם** שהמייל קיים ב-DB.  
> `admin/send-test-email` ו-`admin/check` עושים string match בלבד — **בלי** DB verification.

---

## 🔒 CRON_SECRET (Vercel Cron)

| Route | Method | מה עושה | Auth |
|-------|--------|---------|------|
| `/cron/emails` | GET | שליחת email flows אוטומטיים | `Authorization: Bearer $CRON_SECRET` |
| `/weekly-report` | GET | שליחת דוחות שבועיים למשתמשים | `Authorization: Bearer $CRON_SECRET` |

> ✅ מוגנים כראוי — דורשים header עם CRON_SECRET. בלי זה → 401.

---

## 🟣 תשלומים (PayPlus)

| Route | Method | מה עושה | Auth | סיכון |
|-------|--------|---------|------|-------|
| `/payplus/generate-link` | POST | יצירת לינק תשלום | email required | נמוך |
| `/payplus/webhook` | POST/GET | קבלת webhook מ-PayPlus → עדכון user ל-premium | 🔴 **signature always returns true!** | **גבוה** |

> **שים לב:** יש גם GET handler שממיר את ה-query params ל-POST — PayPlus לפעמים שולח GET.

> **הבעיה:** `verifyPayPlusSignature()` קיימת בקוד עם HMAC-SHA256 תקין, אבל מחזירה `true` תמיד כי:
> 1. אם אין `PAYPLUS_SECRET_KEY` → `return true`
> 2. אם אין signature header → `return true`
> כלומר כל POST לנתיב הזה עם הפורמט הנכון = premium בחינם.

---

## סיכונים מסודרים לפי חומרה

### 🔴 קריטי (משפיע על revenue/אבטחה)
1. **`/cancel-vision`** — כל אחד שולח `{email: "x@y.com"}` → ביטול מנוי
2. **`/payplus/webhook`** — חתימה מושבתת, אפשר לזייף תשלום ולהפוך premium

### 🟠 בינוני (דליפת מידע / bypass)
3. **`/projects/[id]` GET** — כל project ID = גישה מלאה (אין בדיקת userId)
4. **`/update-visualization-products`** — אם לא שולחים userId, ownership check נדלגת לגמרי
5. **`/update-vision-history-products`** — כנ"ל (אותה בעיה)
6. **`/get-visualizations`** — ניחוש UUID = צפייה בתמונות לפני/אחרי
7. **`/get-shop-look-history`** — כנ"ל
8. **`/user-settings`** — ניחוש UUID = צפייה/שינוי הגדרות
9. **`/vision-trial` POST** — סימון trial של אחרים כמנוצל (DoS)
10. **`/unsubscribe`** — הסרה בלי token (כל email)
11. **`/users` PATCH** — admin check בלי DB verification (string match בלבד)

### 🟡 נמוך
12. **`/auth/check-provider`** — user enumeration (חושף אם email רשום)
13. **`/admin/send-test-email`** — admin check בלי DB verification
14. **`/admin/users`** — fallback ל-adminEmail query param (חלש)
15. **APIs ציבוריים בלי rate limit** — `calculate-materials`, `contact`, `lab/render-*`

### ⚪ קוסמטי
13. **Admin email hardcoded** — `guyceza@gmail.com` ב-10 קבצים במקום env var
14. **Supabase client לא עקבי** — `createServiceClient()` vs `createClient()` ישיר
15. **Supabase URL hardcoded** — `save-shop-look-image` ו-`save-vision-history` עם fallback ל-URL מלא של הפרויקט

---

## ADMIN_EMAILS hardcoded ב:

```
src/app/api/admin/banned/route.ts          — ['guyceza@gmail.com']
src/app/api/admin/check/route.ts           — env || 'guyceza@gmail.com'
src/app/api/admin/email-preview/route.ts   — ['guyceza@gmail.com']
src/app/api/admin/premium/route.ts         — ['guyceza@gmail.com']
src/app/api/admin/send-test-email/route.ts — env || 'guyceza@gmail.com'
src/app/api/admin/stats/route.ts           — ['guyceza@gmail.com']
src/app/api/admin/trial-reset/route.ts     — ['guyceza@gmail.com']
src/app/api/admin/users/route.ts           — ['guyceza@gmail.com']
src/app/api/users/route.ts                 — ['guyceza@gmail.com']
src/app/api/visualize/route.ts             — hardcoded in isAdmin check
```

> חלקם כבר קוראים מ-`process.env.ADMIN_EMAILS` עם fallback, חלקם hardcoded לגמרי.

---

## Supabase Clients — שני סוגים (לא עקבי)

| סוג | import | משמש ב- |
|-----|--------|---------|
| `createServiceClient()` | `@/lib/supabase` | רוב ה-APIs (מומלץ) |
| `createClient()` ישיר | `@supabase/supabase-js` | `share`, `weekly-report`, `payplus/*` |

---

## Gemini API Key

משתמשים ב-`process.env.GEMINI_API_KEY` ב:
- `visualize`, `analyze-quote`, `analyze-quote-text`, `bill-of-quantities`
- `scan-receipt`, `detect-items`, `detect-products`
- `chat-support`, `ai-assistant`
- `lab/analyze-blueprint`

**מודלים** (מוגדרים ב-`/src/lib/ai-config.ts`):
- `IMAGE_GEN` — `gemini-3.1-flash-image-preview` (הדמיות, סריקות, זיהוי)
- `TEXT_FAST` — `gemini-3-flash-preview` (צ'אט תמיכה)

---

*אומת לאחרונה: 2026-02-28 — כל route נבדק מול הקוד בפועל*
