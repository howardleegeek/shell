import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.projects.$id');

export async function loader({ request, params }: LoaderFunctionArgs) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return json({ error: 'No authorization token provided' }, { status: 401 });
  }
  
  const { id } = params;
  
  if (!id) {
    return json({ error: 'Project ID is required' }, { status: 400 });
  }
  
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
      return json({ error: 'projectId query parameter is required' }, { status: 400 });
    }
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `SELECT * FROM projects WHERE id = $1 AND user_id = auth.uid()`,
        params: [id],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to fetch project:', errorText);
      return json({ error: 'Failed to fetch project' }, { status: response.status });
    }
    
    const result = await response.json();
    
    if (!result || result.length === 0) {
      return json({ error: 'Project not found' }, { status: 404 });
    }
    
    return json(result[0]);
  } catch (error) {
    logger.error('Error fetching project:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to fetch project' },
      { status: 500 },
    );
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return json({ error: 'No authorization token provided' }, { status: 401 });
  }
  
  const { id } = params;
  
  if (!id) {
    return json({ error: 'Project ID is required' }, { status: 400 });
  }
  
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  
  if (!projectId) {
    return json({ error: 'projectId query parameter is required' }, { status: 400 });
  }
  
  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const { name, description, files, is_public } = body as any;
      
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (files !== undefined) {
        updates.push(`files = $${paramIndex++}`);
        values.push(JSON.stringify(files));
      }
      if (is_public !== undefined) {
        updates.push(`is_public = $${paramIndex++}`);
        values.push(is_public);
      }
      
      if (updates.length === 0) {
        return json({ error: 'No updates provided' }, { status: 400 });
      }
      
      updates.push(`updated_at = $${paramIndex++}`);
      values.push(new Date().toISOString());
      
      values.push(id);
      
      const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex} AND user_id = auth.uid() RETURNING *`;
      
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, params: values }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to update project:', errorText);
        return json({ error: 'Failed to update project' }, { status: response.status });
      }
      
      const result = await response.json();
      
      if (!result || result.length === 0) {
        return json({ error: 'Project not found' }, { status: 404 });
      }
      
      return json(result[0]);
    } catch (error) {
      logger.error('Error updating project:', error);
      return json(
        { error: error instanceof Error ? error.message : 'Failed to update project' },
        { status: 500 },
      );
    }
  }
  
  if (request.method === 'DELETE') {
    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `DELETE FROM projects WHERE id = $1 AND user_id = auth.uid() RETURNING id`,
          params: [id],
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to delete project:', errorText);
        return json({ error: 'Failed to delete project' }, { status: response.status });
      }
      
      const result = await response.json();
      
      if (!result || result.length === 0) {
        return json({ error: 'Project not found' }, { status: 404 });
      }
      
      return json({ success: true });
    } catch (error) {
      logger.error('Error deleting project:', error);
      return json(
        { error: error instanceof Error ? error.message : 'Failed to delete project' },
        { status: 500 },
      );
    }
  }
  
  return json({ error: 'Method not allowed' }, { status: 405 });
}
