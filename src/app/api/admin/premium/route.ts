import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';

const PREMIUM_FILE = '/tmp/premium-list.json';

interface PremiumUser {
  email: string;
  days: number;
  until: string;
  addedAt: string;
}

async function getPremiumList(): Promise<PremiumUser[]> {
  try {
    const data = await fs.readFile(PREMIUM_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function savePremiumList(list: PremiumUser[]): Promise<void> {
  await fs.writeFile(PREMIUM_FILE, JSON.stringify(list), 'utf-8');
}

// GET - Get premium list or check if email has premium
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const list = await getPremiumList();
  
  // Filter out expired premium
  const now = new Date();
  const activeList = list.filter(p => new Date(p.until) > now);
  
  // Save cleaned list if different
  if (activeList.length !== list.length) {
    await savePremiumList(activeList);
  }
  
  if (!email) {
    return NextResponse.json({ list: activeList });
  }
  
  const user = activeList.find(p => p.email.toLowerCase() === email.toLowerCase());
  return NextResponse.json({ hasPremium: !!user, until: user?.until });
}

// POST - Add premium to user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, days, adminEmail } = body;
    
    if (adminEmail !== 'guyceza@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!email || !days) {
      return NextResponse.json({ error: 'Email and days required' }, { status: 400 });
    }
    
    const list = await getPremiumList();
    
    // Calculate until date
    const until = new Date();
    until.setDate(until.getDate() + days);
    
    // Check if user already has premium
    const existingIndex = list.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
    
    if (existingIndex >= 0) {
      // Extend premium
      const existing = new Date(list[existingIndex].until);
      if (existing > new Date()) {
        // Add days to existing
        existing.setDate(existing.getDate() + days);
        list[existingIndex].until = existing.toISOString().split('T')[0];
        list[existingIndex].days += days;
      } else {
        // Set new premium
        list[existingIndex] = {
          email: email.toLowerCase(),
          days,
          until: until.toISOString().split('T')[0],
          addedAt: new Date().toISOString()
        };
      }
    } else {
      list.push({
        email: email.toLowerCase(),
        days,
        until: until.toISOString().split('T')[0],
        addedAt: new Date().toISOString()
      });
    }
    
    await savePremiumList(list);
    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add premium' }, { status: 500 });
  }
}

// DELETE - Remove premium from user
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    if (adminEmail !== 'guyceza@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const list = await getPremiumList();
    const newList = list.filter(p => p.email.toLowerCase() !== email.toLowerCase());
    await savePremiumList(newList);
    
    return NextResponse.json({ success: true, list: newList });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove premium' }, { status: 500 });
  }
}
