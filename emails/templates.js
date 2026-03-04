/**
 * ShiputzAI Email Templates
 * Apple-style premium white design with proper RTL Hebrew support
 * 2 Flows: Non-purchased (7 emails) + Purchased Premium (7 emails)
 */

const BRAND = {
    primary: '#00C853',
    black: '#1d1d1f',
    text: '#1d1d1f',
    muted: '#86868b',
    light: '#f5f5f7',
    white: '#ffffff',
    purple: '#667eea',
    purpleEnd: '#764ba2'
};

const PRICING = {
    pro: {
        monthly: 29,
        annual: 228,
        annualMonthly: 19,
        discountPercent: 30,
    },
    // LEGACY
    premium: {
        regular: { ils: 149.99, usd: 49.99 },
        discounted: { ils: 119.99, usd: 39.99 },
        discountPercent: 20,
        code: 'PREMIUM20'
    },
};

// Base email wrapper with proper RTL support
function emailWrapper(content, preheader = '') {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.light}; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;" dir="rtl">
    <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BRAND.light};" dir="rtl">
        <tr>
            <td align="center" style="padding: 48px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px;" dir="rtl">
                    
                    <tr>
                        <td align="center" style="padding: 0 0 40px;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: ${BRAND.black}; letter-spacing: -0.5px;">ShiputzAI</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BRAND.white}; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);" dir="rtl">
                                <tr>
                                    <td style="padding: 48px 44px;" align="right" dir="rtl">
                                        ${content}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td align="center" style="padding: 32px 0 0;">
                            <p style="margin: 0 0 8px; font-size: 12px; color: ${BRAND.muted};">בהצלחה עם השיפוץ!</p>
                            <p style="margin: 0; font-size: 12px; color: ${BRAND.muted};"><strong>צוות ShiputzAI</strong></p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function p(text, bold = false) {
    const style = `font-size: 17px; line-height: 1.6; color: ${BRAND.text}; margin: 0 0 24px; text-align: right;${bold ? ' font-weight: 600;' : ''}`;
    return `<p style="${style}" dir="rtl">${text}</p>`;
}

function header(emoji, title, subtitle = '') {
    return `
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 48px; margin-bottom: 16px;">${emoji}</div>
            <h2 style="margin: 0; font-size: 28px; font-weight: 600; color: ${BRAND.text}; letter-spacing: -0.5px;">${title}</h2>
            ${subtitle ? `<p style="margin: 8px 0 0; font-size: 17px; color: ${BRAND.muted};">${subtitle}</p>` : ''}
        </div>`;
}

function button(text, url, color = BRAND.black) {
    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0 0;">
            <tr>
                <td align="center">
                    <a href="${url}" style="display: inline-block; padding: 16px 48px; font-size: 17px; font-weight: 500; color: #fff; background: ${color}; text-decoration: none; border-radius: 980px;">${text}</a>
                </td>
            </tr>
        </table>`;
}

function bulletList(items) {
    let html = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;" dir="rtl">';
    items.forEach(item => {
        html += `<tr><td style="padding: 8px 0; text-align: right;" dir="rtl"><span style="font-size: 16px; color: ${BRAND.text};">• ${item}</span></td></tr>`;
    });
    html += '</table>';
    return html;
}

function stepList(steps) {
    let html = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;" dir="rtl">';
    steps.forEach((step, i) => {
        const isLast = i === steps.length - 1;
        html += `
            <tr>
                <td style="padding: 16px 0;${isLast ? '' : ' border-bottom: 1px solid #f5f5f7;'}" dir="rtl">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="rtl">
                        <tr>
                            <td width="44" style="vertical-align: top;" align="right">
                                <div style="background: ${BRAND.primary}; border-radius: 50%; width: 32px; height: 32px; text-align: center; line-height: 32px; font-size: 15px; font-weight: 600; color: #fff;">${i + 1}</div>
                            </td>
                            <td style="padding-right: 16px; vertical-align: top; text-align: right;" dir="rtl">
                                <p style="font-size: 16px; font-weight: 600; color: ${BRAND.text}; margin: 0 0 4px; text-align: right;">${step.title}</p>
                                <p style="font-size: 15px; color: ${BRAND.muted}; margin: 0; line-height: 1.5; text-align: right;">${step.desc}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>`;
    });
    html += '</table>';
    return html;
}

function featureList(items) {
    let html = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;" dir="rtl">';
    items.forEach((item, i) => {
        const isLast = i === items.length - 1;
        html += `
            <tr>
                <td style="padding: 12px 0;${isLast ? '' : ' border-bottom: 1px solid #f5f5f7;'}" dir="rtl">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="rtl">
                        <tr>
                            <td width="44" style="vertical-align: middle;" align="right">
                                <div style="background: #f5f5f7; border-radius: 10px; width: 44px; height: 44px; text-align: center; line-height: 44px; font-size: 20px;">${item.emoji}</div>
                            </td>
                            <td style="padding-right: 16px; vertical-align: middle; text-align: right;" dir="rtl">
                                <span style="font-size: 16px; color: ${BRAND.text};">${item.text}</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>`;
    });
    html += '</table>';
    return html;
}

function discountBox(code, hours = 48) {
    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;">
            <tr>
                <td style="background: ${BRAND.black}; border-radius: 16px; padding: 32px; text-align: center;">
                    <p style="font-size: 11px; color: rgba(255,255,255,0.5); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px;">קוד הנחה</p>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 24px; display: inline-block;">
                        <span style="font-size: 24px; font-weight: 600; color: #ffffff; letter-spacing: 3px; font-family: 'SF Mono', Monaco, monospace;">${code}</span>
                    </div>
                    <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin: 16px 0 0;">⏰ תקף ל-${hours} שעות</p>
                </td>
            </tr>
        </table>`;
}

function priceBox(oldPrice, newPrice, suffix = '') {
    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;">
            <tr>
                <td style="text-align: center;">
                    <span style="font-size: 17px; color: ${BRAND.muted}; text-decoration: line-through;">${oldPrice}</span>
                    <span style="font-size: 17px; color: ${BRAND.muted}; margin: 0 8px;">←</span>
                    <span style="font-size: 32px; font-weight: 700; color: ${BRAND.text};">${newPrice}</span>
                    ${suffix ? `<span style="font-size: 15px; color: ${BRAND.muted};">${suffix}</span>` : ''}
                </td>
            </tr>
        </table>`;
}

function testimonial(quote, name, city) {
    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
            <tr>
                <td style="background: ${BRAND.light}; border-radius: 16px; padding: 24px; text-align: right;" dir="rtl">
                    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.text}; margin: 0 0 12px; font-style: italic; text-align: right;">"${quote}"</p>
                    <p style="font-size: 14px; color: ${BRAND.muted}; margin: 0; text-align: right;">— ${name}, ${city}</p>
                </td>
            </tr>
        </table>`;
}

function grayBox(content) {
    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;">
            <tr>
                <td style="background: ${BRAND.light}; border-radius: 16px; padding: 24px; text-align: center;">
                    ${content}
                </td>
            </tr>
        </table>`;
}

function purpleCard(emoji, title, desc) {
    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;">
            <tr>
                <td style="background: linear-gradient(135deg, ${BRAND.purple} 0%, ${BRAND.purpleEnd} 100%); border-radius: 16px; padding: 32px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 12px;">${emoji}</div>
                    <h3 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 8px;">${title}</h3>
                    <p style="color: rgba(255,255,255,0.85); font-size: 15px; margin: 0; line-height: 1.5;">${desc}</p>
                </td>
            </tr>
        </table>`;
}

// ============================================
// FLOW 1: Non-purchased (7 emails)
// ============================================

const FLOW1 = {
    day0_welcome: (userName = '') => emailWrapper(`
        ${header('👋', 'ברוך הבא ל-ShiputzAI!')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('תודה שנרשמת ל-ShiputzAI!')}
        ${p('אנחנו יודעים שניהול שיפוץ יכול להיות מטורף — עשרות קבלנים, הצעות מחיר, קבלות, ותקציב שכל הזמן משתנה.')}
        ${p('ShiputzAI עוזר לך:', true)}
        ${featureList([
            { emoji: '📊', text: 'לעקוב אחרי כל הוצאה בזמן אמת' },
            { emoji: '📸', text: 'לסרוק קבלות אוטומטית עם AI' },
            { emoji: '📋', text: 'לנתח הצעות מחיר ולהשוות' },
            { emoji: '🔔', text: 'לקבל התראות לפני שחורגים מהתקציב' }
        ])}
        ${button('להתחיל עכשיו ←', 'https://shipazti.com/signup')}
    `, 'תודה שנרשמת! הנה איך ShiputzAI יעזור לך'),

    day1_reminder: (userName = '') => emailWrapper(`
        ${header('👋', 'שכחת משהו?')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('שמנו לב שנרשמת ל-ShiputzAI אבל עדיין לא התחלת.')}
        ${p('ידעת ש-<strong>70% מהשיפוצים בישראל חורגים מהתקציב</strong>?')}
        ${p('עם ShiputzAI אתה יכול:', true)}
        ${bulletList([
            'לעקוב אחרי כל שקל בזמן אמת',
            'לקבל התראות לפני שזה קורה לך',
            'לחסוך בממוצע ₪8,000 בשיפוץ'
        ])}
        ${button('להתחיל עכשיו ←', 'https://shipazti.com/signup')}
    `, 'שמנו לב שעדיין לא התחלת...'),

    day3_discount: (userName = '') => emailWrapper(`
        ${header('🎁', 'מתנה בשבילך', '20% הנחה על ShiputzAI')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('רצינו לתת לך הזדמנות מיוחדת להצטרף ל-ShiputzAI.')}
        ${discountBox(PRICING.premium.code)}
        ${priceBox('₪' + PRICING.premium.regular.ils, '₪' + PRICING.premium.discounted.ils)}
        <p style="font-size: 15px; line-height: 1.6; color: ${BRAND.muted}; margin: 0 0 32px; text-align: center;">תשלום חד פעמי. גישה לכל הפיצ׳רים.</p>
        ${button('לממש את ההנחה ←', 'https://shipazti.com/signup?code=' + PRICING.premium.code, '#0071e3')}
    `, '🎁 20% הנחה מחכה לך — תקף 48 שעות'),

    day5_problem: (userName = '') => emailWrapper(`
        ${header('😱', '70% מהשיפוצים חורגים מהתקציב')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('נתון מטריד: <strong>70% מהשיפוצים בישראל חורגים מהתקציב המקורי</strong>.')}
        ${p('הסיבות העיקריות:', true)}
        ${bulletList([
            '❌ אין מעקב שוטף אחרי הוצאות',
            '❌ קבלות הולכות לאיבוד',
            '❌ הצעות מחיר לא מושוות נכון',
            '❌ הפתעות שלא תוכננו'
        ])}
        ${p('ShiputzAI פותר את כל זה:', true)}
        ${bulletList([
            '✅ מעקב בזמן אמת',
            '✅ סריקת קבלות אוטומטית',
            '✅ השוואת הצעות מחיר חכמה',
            '✅ התראות מוקדמות'
        ])}
        ${p('<strong>אל תהיה חלק מה-70%.</strong>')}
        ${button('להתחיל היום ←', 'https://shipazti.com/signup')}
    `, '70% מהשיפוצים חורגים מהתקציב — אל תהיה אחד מהם'),

    day7_testimonials: (userName = '') => emailWrapper(`
        ${header('💬', 'מה הלקוחות שלנו אומרים')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${testimonial('חסכתי ₪15,000 בזכות ההתראות על חריגה מהתקציב. הקבלן רצה להוסיף עבודות וראיתי מיד שזה מוציא אותי מהתקציב.', 'יעל', 'תל אביב')}
        ${testimonial('סרקתי 200 קבלות ב-10 דקות. בלי ShiputzAI הייתי מבלה שעות באקסל.', 'רועי', 'רמת גן')}
        ${testimonial('ניתוח הצעות המחיר חסך לי ₪8,000. הבנתי שאחד הקבלנים ניפח מחירים.', 'מיכל', 'חיפה')}
        ${button('להצטרף אליהם ←', 'https://shipazti.com/signup')}
    `, 'ראה מה הלקוחות שלנו אומרים'),

    day9_urgency: (userName = '') => emailWrapper(`
        ${header('⏰', 'נשארו 24 שעות להנחה!')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p(`קוד ההנחה שלך <strong>${PRICING.premium.code}</strong> פג בעוד 24 שעות!`)}
        ${grayBox(`
            <p style="font-size: 14px; color: ${BRAND.muted}; margin: 0 0 8px;">20% הנחה — לא תחזור</p>
            <span style="font-size: 20px; color: ${BRAND.muted}; text-decoration: line-through;">₪${PRICING.premium.regular.ils}</span>
            <span style="font-size: 20px; color: ${BRAND.muted}; margin: 0 8px;">←</span>
            <span style="font-size: 36px; font-weight: 700; color: ${BRAND.text};">₪${PRICING.premium.discounted.ils}</span>
        `)}
        <p style="font-size: 15px; line-height: 1.6; color: ${BRAND.muted}; margin: 0 0 32px; text-align: center;">אחרי זה, המחיר חוזר למחיר מלא.</p>
        ${button('לממש עכשיו ←', 'https://shipazti.com/signup?code=' + PRICING.premium.code, '#0071e3')}
    `, '⏰ נשארו 24 שעות להנחה של 20%'),

    day14_lastChance: (userName = '') => emailWrapper(`
        ${header('🤝', 'אולי לא בשבילך?')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('זה המייל האחרון שלנו.')}
        ${p('אם ShiputzAI לא מתאים לך — זה בסדר גמור. לא כולם צריכים כלי לניהול שיפוץ.')}
        ${p('אבל אם אתה עדיין מתלבט:', true)}
        ${bulletList([
            'יש לנו ניסיון חינם של 7 ימים',
            'אפשר לבטל בכל רגע',
            'אין התחייבות'
        ])}
        ${button('לנסות בחינם 7 ימים ←', 'https://shipazti.com/signup?trial=7')}
    `, 'זה המייל האחרון שלנו — יש לנו הצעה בשבילך')
};

// ============================================
// FLOW 2: Purchased Premium (7 emails)
// ============================================

const FLOW2 = {
    day0_welcome: (userName = '') => emailWrapper(`
        ${header('🎉', 'ברוך הבא ל-ShiputzAI')}
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: ${BRAND.black}; padding: 6px 16px; border-radius: 20px;">
                <span style="font-size: 13px; color: #ffffff; font-weight: 500;">Premium</span>
            </div>
        </div>
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('תודה שהצטרפת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.')}
        ${p('מה עכשיו?', true)}
        ${stepList([
            { title: 'היכנס לדשבורד', desc: 'הגדר את הפרויקט הראשון שלך' },
            { title: 'הגדר תקציב', desc: 'קבע את התקציב ההתחלתי לשיפוץ' },
            { title: 'התחל לתעד', desc: 'סרוק קבלות והוסף הוצאות' }
        ])}
        ${button('כניסה לדשבורד ←', 'https://shipazti.com/dashboard')}
    `, '🎉 ברוך הבא ל-ShiputzAI Premium!'),

    day1_gettingStarted: (userName = '') => emailWrapper(`
        ${header('💡', '3 דברים לעשות עכשיו')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('כדי להפיק את המקסימום מ-ShiputzAI, הנה 3 דברים לעשות היום:')}
        ${stepList([
            { title: 'הגדר קטגוריות תקציב', desc: 'חלק את התקציב לקטגוריות: חשמל, אינסטלציה, ריצוף, צבע... ככה תראה בדיוק איפה הכסף הולך.' },
            { title: 'צלם את הקבלות הראשונות', desc: 'פתח את האפליקציה ← לחץ על "סריקת קבלה" ← צלם. ה-AI יזהה אוטומטית את הסכום והקטגוריה.' },
            { title: 'הוסף את הקבלנים שלך', desc: 'הוסף שמות + טלפונים של הקבלנים. ככה תוכל לעקוב מי חייב לך כסף ומי קיבל.' }
        ])}
        ${button('להתחיל עכשיו ←', 'https://shipazti.com/dashboard')}
    `, '💡 3 דברים לעשות עכשיו כדי להתחיל נכון'),

    day3_upsell: (userName = '') => emailWrapper(`
        ${header('🏠', 'רוצה לראות איך השיפוץ ייראה?')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('יש לנו פיצ׳ר חדש שחייבים שתכיר:')}
        ${purpleCard('✨', '"איך השיפוץ שלי ייראה"', 'צלם תמונה של החדר ← ה-AI יראה לך<br>איך זה ייראה אחרי השיפוץ!')}
        ${featureList([
            { emoji: '🪵', text: 'החלפת ריצוף' },
            { emoji: '🎨', text: 'צבע קירות חדש' },
            { emoji: '🍳', text: 'שינוי מטבח' },
            { emoji: '🚿', text: 'עיצוב חדר רחצה' }
        ])}
        ${grayBox(`
            <p style="font-size: 12px; color: ${BRAND.muted}; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">מחיר מיוחד עם קוד ${PRICING.visualization.code}</p>
            <div style="margin: 12px 0;">
                <span style="font-size: 44px; font-weight: 700; color: ${BRAND.text};">$${PRICING.visualization.discounted}</span>
                <span style="font-size: 16px; color: ${BRAND.muted}; text-decoration: line-through; margin-right: 12px;">$${PRICING.visualization.regular}</span>
            </div>
            <p style="font-size: 15px; color: ${BRAND.text}; margin: 0; font-weight: 500;">לחודש הראשון! 🎉</p>
        `)}
        ${button('לנסות עכשיו ←', 'https://shipazti.com/visualization?code=' + PRICING.visualization.code)}
    `, '🏠 רוצה לראות איך השיפוץ ייראה לפני שמתחילים?'),

    day5_tips: (userName = '') => emailWrapper(`
        ${header('💰', 'איך לא לחרוג מהתקציב')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('5 טיפים שיעזרו לך להישאר בתקציב:')}
        ${stepList([
            { title: 'תמיד תשאיר 15% לבלת"מים', desc: 'דברים קורים. צנרת ישנה, בעיות חשמל, הפתעות.' },
            { title: 'קבל 3 הצעות מחיר לכל עבודה', desc: 'ואז השתמש בכלי "ניתוח הצעות" שלנו להשוואה.' },
            { title: 'תעד הכל ביום שזה קורה', desc: 'לא "אחר כך". קבלות נעלמות, זיכרון מטשטש.' },
            { title: 'תבדוק את הדשבורד פעם בשבוע', desc: '5 דקות בשבוע יכולות לחסוך אלפי שקלים.' },
            { title: 'אל תתביישו לשאול', desc: 'יש לנו צ׳אט AI שיכול לענות על כל שאלה.' }
        ])}
        ${button('לדשבורד ←', 'https://shipazti.com/dashboard')}
    `, '💰 5 טיפים איך לא לחרוג מהתקציב'),

    day7_checkin: (userName = '') => emailWrapper(`
        ${header('❓', 'איך הולך השיפוץ?')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('עבר שבוע מאז שהתחלת להשתמש ב-ShiputzAI.')}
        ${p('רצינו לבדוק איך הולך!')}
        ${p('כמה שאלות קצרות:', true)}
        ${bulletList([
            'הצלחת להגדיר את הפרויקט?',
            'סרקת קבלות?',
            'יש משהו שלא ברור?'
        ])}
        ${p('אם יש לך שאלות — פשוט תענה על המייל הזה.')}
        ${p('<strong>אנחנו קוראים הכל!</strong>')}
        ${button('לדשבורד ←', 'https://shipazti.com/dashboard')}
    `, 'איך הולך? יש לנו כמה שאלות'),

    day10_quoteAnalysis: (userName = '') => emailWrapper(`
        ${header('🔥', 'הכלי שרוב המשפצים לא מכירים')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('ידעת שיש לנו כלי לניתוח הצעות מחיר?')}
        ${p('ככה זה עובד:', true)}
        ${stepList([
            { title: 'מעלים 2-3 הצעות מחיר', desc: 'PDF או תמונה' },
            { title: 'ה-AI מנתח ומשווה', desc: 'בודק מחירים, סעיפים חסרים, וחריגות' },
            { title: 'מקבלים דו"ח מפורט', desc: 'איפה יש פערי מחירים, מה יקר מדי, והמלצה מי לבחור' }
        ])}
        ${grayBox(`
            <p style="font-size: 17px; color: ${BRAND.text}; margin: 0;">
                לקוחות שלנו חוסכים בממוצע<br>
                <strong style="font-size: 32px; color: ${BRAND.primary};">₪5,000</strong><br>
                בזכות הכלי הזה
            </p>
        `)}
        ${button('לנסות עכשיו ←', 'https://shipazti.com/dashboard/quotes')}
    `, '🔥 הכלי שחוסך בממוצע ₪5,000'),

    day14_feedback: (userName = '') => emailWrapper(`
        ${header('⭐', '30 שניות מזמנך?')}
        ${p(`היי${userName ? ' ' + userName : ''},`)}
        ${p('עברו שבועיים מאז שהתחלת להשתמש ב-ShiputzAI.')}
        ${p('נשמח מאוד לשמוע מה אתה חושב!')}
        <p style="font-size: 15px; line-height: 1.6; color: ${BRAND.muted}; margin: 0 0 32px; text-align: center;">כל תגובה עוזרת לנו להשתפר ולבנות מוצר טוב יותר.</p>
        ${button('לתת פידבק (30 שניות) ←', 'https://shipazti.com/feedback')}
    `, '⭐ 30 שניות לעזור לנו להשתפר')
};

const SUBJECTS = {
    flow1: {
        day0: '👋 ברוך הבא ל-ShiputzAI!',
        day1: '👋 שכחת משהו?',
        day3: '🎁 מתנה בשבילך — 20% הנחה',
        day5: '😱 70% מהשיפוצים חורגים מהתקציב',
        day7: '💬 "חסכתי ₪15,000 בזכותכם"',
        day9: '⏰ נשארו 24 שעות להנחה!',
        day14: '🤝 אולי לא בשבילך?'
    },
    flow2: {
        day0: '🎉 ברוך הבא ל-ShiputzAI Premium!',
        day1: '💡 3 דברים לעשות עכשיו',
        day3: '🏠 רוצה לראות איך השיפוץ ייראה?',
        day5: '💰 איך לא לחרוג מהתקציב',
        day7: '❓ איך הולך השיפוץ?',
        day10: '🔥 הכלי שרוב המשפצים לא מכירים',
        day14: '⭐ 30 שניות מזמנך?'
    }
};

// Subscription Cancellation Email
function subscriptionCancelled(email, periodEnd) {
    const periodEndDate = periodEnd ? new Date(periodEnd).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'סוף התקופה הנוכחית';
    
    const content = `
        ${header('👋', 'המנוי בוטל בהצלחה', 'קיבלנו את בקשתך')}
        
        ${p('שלום,')}
        
        ${p('קיבלנו את בקשת הביטול שלך למנוי הדמיות AI.')}
        
        ${grayBox(`
            <p style="margin: 0 0 8px; font-size: 14px; color: ${BRAND.muted};">פרטי הביטול:</p>
            <p style="margin: 0 0 4px; font-size: 15px; color: ${BRAND.text};"><strong>מייל:</strong> ${email}</p>
            <p style="margin: 0 0 4px; font-size: 15px; color: ${BRAND.text};"><strong>סטטוס:</strong> פעיל עד סוף התקופה</p>
            <p style="margin: 0; font-size: 15px; color: ${BRAND.text};"><strong>גישה עד:</strong> ${periodEndDate}</p>
        `)}
        
        ${p('תוכל להמשיך להשתמש בשירות ההדמיות עד לתאריך הנ"ל.')}
        
        ${p('אם תרצה לחדש את המנוי בעתיד, תמיד אפשר לעשות זאת מאזור האישי.')}
        
        ${p('נשמח לראות אותך שוב! 💚')}
        
        ${button('לאזור האישי', 'https://shipazti.com/dashboard', BRAND.black)}
    `;
    
    return {
        subject: '👋 המנוי בוטל בהצלחה — ShiputzAI',
        html: emailWrapper(content, 'קיבלנו את בקשת הביטול שלך')
    };
}

module.exports = { BRAND, PRICING, FLOW1, FLOW2, SUBJECTS, emailWrapper, button, p, header, bulletList, stepList, featureList, discountBox, priceBox, testimonial, grayBox, purpleCard, subscriptionCancelled };
