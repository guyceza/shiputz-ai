import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';

const BANNED_FILE = '/tmp/banned-list.json';

async function getBannedList(): Promise<string[]> {
  try {
    const data = await fs.readFile(BANNED_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveBannedList(list: string[]): Promise<void> {
  await fs.writeFile(BANNED_FILE, JSON.stringify(list), 'utf-8');
}

// GET - Get banned list or check if email is banned
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const list = await getBannedList();
  
  if (!email) {
    return NextResponse.json({ list });
  }
  
  const isBanned = list.includes(email.toLowerCase());
  return NextResponse.json({ isBanned });
}

// POST - Ban user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    if (adminEmail !== 'guyceza@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const list = await getBannedList();
    
    if (!list.includes(email.toLowerCase())) {
      list.push(email.toLowerCase());
      await saveBannedList(list);
    }
    
    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
  }
}

// DELETE - Unban user
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    if (adminEmail !== 'guyceza@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const list = await getBannedList();
    const newList = list.filter(e => e !== email.toLowerCase());
    await saveBannedList(newList);
    
    return NextResponse.json({ success: true, list: newList });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
  }
}
