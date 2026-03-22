import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';
import crypto from 'crypto';

const HASH_SECRET = 'shiputzai-unsubscribe-2024';

function generateToken(email: string): string {
  return crypto.createHmac('sha256', HASH_SECRET).update(email).digest('hex').slice(0, 16);
}

function getFirstName(name: string): string {
  if (!name) return 'שלום';
  const cleaned = name
    .replace(/סטודיו|studio|עיצוב פנים|אדריכלות|interior design|design|ltd|בע"מ/gi, '')
    .replace(/[-–|,]/g, ' ')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'שלום';
  const first = parts[0];
  if (/^[a-zA-Z]/.test(first) && parts.length > 1) return parts[1]; // skip English company prefix
  if (first.length <= 2) return 'שלום';
  return first;
}

const PROFESSION_EMAILS: Record<string, { subject1: string; hook: string; value: string; followup: string }> = {
  'מעצבי פנים': {
    subject1: 'כלי חדש למעצבי פנים',
    hook: 'ראיתי את העבודות שלכם בגוגל ונראה מרשים.',
    value: 'בניתי כלי שמייצר הדמיות AI לפרויקטי שיפוץ. מעלים תמונה של חדר ומקבלים הדמיה מקצועית תוך שניות. מעצבי פנים משתמשים בזה כדי להציג ללקוחות לפני שמתחילים.',
    followup: 'מעצבים שמשתמשים ב-ShiputzAI אומרים שזה חוסך להם שעות של עבודה על הדמיות ומרשים את הלקוחות.',
  },
  'אדריכלים': {
    subject1: 'כלי AI חדש לאדריכלים',
    hook: 'ראיתי את המשרד שלכם בגוגל. עבודות מרשימות.',
    value: 'בניתי כלי שמייצר הדמיות AI לפרויקטי שיפוץ ובנייה. מעלים תמונה של חלל ומקבלים הדמיה מקצועית תוך שניות. אדריכלים משתמשים בזה כדי להציג אופציות ללקוחות בלי לחכות לרנדר.',
    followup: 'אדריכלים שמשתמשים ב-ShiputzAI אומרים שזה חוסך להם זמן יקר על הדמיות ראשוניות ומזרז את תהליך האישור מול לקוחות.',
  },
  'קבלני שיפוצים': {
    subject1: 'כלי AI שעוזר לקבלני שיפוצים',
    hook: 'ראיתי את העסק שלכם בגוגל.',
    value: 'בניתי כלי שמייצר הדמיות AI לפרויקטי שיפוץ. הלקוח מעלה תמונה של החדר ורואה איך זה ייראה אחרי השיפוץ. קבלנים משתמשים בזה כדי לסגור עסקאות מהר יותר.',
    followup: 'קבלנים שמשתמשים ב-ShiputzAI אומרים שהלקוחות מתלהבים כשהם רואים הדמיה של התוצאה הסופית. וזה עוזר לסגור עסקאות.',
  },
  'מטבחים ואמבטיות': {
    subject1: 'כלי AI לעיצוב מטבחים ואמבטיות',
    hook: 'ראיתי את העסק שלכם בגוגל.',
    value: 'בניתי כלי שמייצר הדמיות AI. הלקוח מעלה תמונה של המטבח או האמבטיה ורואה איך זה ייראה אחרי שיפוץ. עוזר ללקוחות להחליט על סגנון לפני שמתחילים.',
    followup: 'עסקים בתחום המטבחים והאמבטיות משתמשים ב-ShiputzAI כדי להראות ללקוחות הדמיות של התוצאה הסופית. וזה מזרז החלטות.',
  },
  'נגרות אדריכלית': {
    subject1: 'כלי AI לנגרות ועיצוב',
    hook: 'ראיתי את העבודות שלכם בגוגל.',
    value: 'בניתי כלי שמייצר הדמיות AI לפרויקטי עיצוב ושיפוץ. מעלים תמונה של חלל ורואים איך ייראה עם הנגרות החדשה. עוזר ללקוחות לדמיין את התוצאה.',
    followup: 'אנשי מקצוע בתחום הנגרות משתמשים ב-ShiputzAI כדי להציג ללקוחות הדמיות מהירות של פרויקטים. בלי לחכות לרנדרים.',
  },
};

export async function GET(request: NextRequest) {
  try {
    const authEmail = request.headers.get('x-admin-email') || '';
    if (!isAdmin(authEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = request.nextUrl.searchParams.get('email');
    const seq = parseInt(request.nextUrl.searchParams.get('seq') || '1');
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: lead } = await supabase
      .from('leads')
      .select('name, profession, email')
      .eq('email', email)
      .single();

    const name = lead?.name || '';
    const profession = lead?.profession || 'מעצבי פנים';
    const firstName = getFirstName(name);
    const token = generateToken(email);
    const content = PROFESSION_EMAILS[profession] || PROFESSION_EMAILS['מעצבי פנים'];

    let subject: string;
    let body: string;

    if (seq === 1) {
      subject = content.subject1;
      body = `היי ${firstName},\n\n${content.hook}\n\n${content.value} הדמיות, סיור וירטואלי, זיהוי מוצרים, כתב כמויות ועוד. 130+ אנשי מקצוע כבר משתמשים.\n\nלנסות בחינם: https://shipazti.com`;
    } else {
      subject = 'Re: ' + content.subject1;
      body = `היי ${firstName},\n\nשלחתי מייל לפני כמה ימים. אולי נחת בספאם.\n\n${content.followup}\n\nאשמח לשמוע מה אתם חושבים. https://shipazti.com`;
    }

    return NextResponse.json({
      subject,
      body,
      name,
      profession,
      firstName,
      unsubscribeUrl: `https://shipazti.com/unsubscribe?token=${token}&email=${encodeURIComponent(email)}&source=leads`,
    });
  } catch (error) {
    console.error('Lead preview error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
