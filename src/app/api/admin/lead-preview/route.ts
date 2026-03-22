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
  let cleaned = name
    .replace(/\|.*/g, '')
    .replace(/[-–—].*(?:עיצוב|אדריכל|מעצב|סטודיו|לימודי|ביה"ס).*/g, '')
    .replace(/\s*[-–—]\s*/g, ' ')
    .replace(/עיצוב פנים.*/i, '')
    .replace(/מעצב[ת]?\s+פנים.*/i, '')
    .replace(/אדריכל[ית]?.*$/i, '')
    .replace(/אדריכלים.*$/i, '')
    .replace(/מתכנני.*$/i, '')
    .replace(/בע"מ/g, '')
    .replace(/סטודיו\s*/i, '')
    .replace(/Studio\s*/i, '')
    .replace(/לימודי\s*/i, '')
    .replace(/Interior Design.*/i, '')
    .replace(/Architects?.*/i, '')
    .replace(/Design.*/i, '')
    .replace(/בתל אביב.*/i, '')
    .replace(/במרכז.*/i, '')
    .replace(/בירושלים.*/i, '')
    .replace(/בחיפה.*/i, '')
    .replace(/\(.*\)/g, '')
    .replace(/לבית.*$/i, '')
    .replace(/לעסקים.*$/i, '')
    .replace(/והום סטיילינג.*/i, '')
    .replace(/שיפוצים.*$/i, '')
    .replace(/ועבודות.*$/i, '')
    .replace(/קבלן.*$/i, '')
    .replace(/חומרי.*$/i, '')
    .replace(/Building.*$/i, '')
    .replace(/Materials.*$/i, '')
    .trim();

  if (!cleaned || cleaned.length <= 1) return 'שלום';

  const parts = cleaned.split(/\s+/).filter(p => p.length > 1);
  const skipWords = ['סטודיו', 'Studio', 'K.O.T', 'DYC', 'SAY', '6B', 'ETN', 'ביה"ס',
    'עמותת', 'חברת', 'חנות', 'מפעל', 'קבוצת', 'רשת', 'המרכז', 'המכון', 'בית', 'השירות', 'משרד'];
  
  let firstName = parts[0] || 'שלום';
  if (skipWords.some(w => firstName === w) || /^[A-Z.]{1,4}$/.test(firstName)) {
    firstName = parts.length > 1 ? parts[1] : 'שלום';
    if (skipWords.some(w => firstName === w)) return 'שלום';
  }

  // All English = company name
  if (/^[A-Za-z]+$/.test(firstName) && parts.every(p => /^[A-Za-z.,]+$/.test(p))) return 'שלום';
  // Abbreviation like א.ב
  if (/^.\./.test(firstName) || /\.$/.test(firstName)) return 'שלום';
  if (/^[א-ת]\.[א-ת]/.test(firstName)) return 'שלום';
  if (firstName.length <= 1 || firstName === 'ל') return 'שלום';

  return firstName;
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
