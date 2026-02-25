import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Note: Auth check removed - users query by their own userId
// and can only access their own projects.

// GET - List user's projects
// Bug fix: Verify user has valid session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new project
// Bug fix: Verify user has valid session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, budget = 0 } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing required fields: userId, name' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        budget,
        spent: 0,
        data: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a project
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, ...updates } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Bug #5 fix: Require userId and verify ownership
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Verify ownership before update
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (project.user_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', userId) // Double-check ownership in query
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Bug #5 fix: Require userId and verify ownership
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Verify ownership before delete
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (project.user_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId); // Double-check ownership in query

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
