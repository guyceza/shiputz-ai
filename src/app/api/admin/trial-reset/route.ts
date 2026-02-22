import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const RESET_FILE = '/tmp/trial-reset-list.json';

async function getResetList(): Promise<string[]> {
  try {
    const data = await fs.readFile(RESET_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveResetList(list: string[]): Promise<void> {
  await fs.writeFile(RESET_FILE, JSON.stringify(list), 'utf-8');
}

// GET - Check if email is in reset list
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    const list = await getResetList();
    return NextResponse.json({ list });
  }
  
  const list = await getResetList();
  const shouldReset = list.includes(email.toLowerCase());
  
  if (shouldReset) {
    // Remove from list after checking
    const newList = list.filter(e => e !== email.toLowerCase());
    await saveResetList(newList);
  }
  
  return NextResponse.json({ shouldReset });
}

// POST - Add email to reset list (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    // Simple admin check
    if (adminEmail !== 'guyceza@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const list = await getResetList();
    if (!list.includes(email.toLowerCase())) {
      list.push(email.toLowerCase());
      await saveResetList(list);
    }
    
    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add email' }, { status: 500 });
  }
}

// DELETE - Remove email from reset list
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    if (adminEmail !== 'guyceza@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const list = await getResetList();
    const newList = list.filter(e => e !== email.toLowerCase());
    await saveResetList(newList);
    
    return NextResponse.json({ success: true, list: newList });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove email' }, { status: 500 });
  }
}
