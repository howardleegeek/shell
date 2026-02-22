import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.projects');

export async function loader({ request }: LoaderFunctionArgs) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return json({ error: 'No authorization token provided' }, { status: 401 });
  }
  
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
      return json({ error: 'projectId is required' }, { status: 400 });
    }
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT * FROM projects WHERE user_id = auth.uid() ORDER BY updated_at DESC',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to fetch projects:', errorText);
      return json({ error: 'Failed to fetch projects' }, { status: response.status });
    }
    
    const result = await response.json();
    return json(result);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 },
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return json({ error: 'No authorization token provided' }, { status: 401 });
  }
  
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { projectId, name, chain, description, files, is_public, template } = body as any;
      
      if (!projectId) {
        return json({ error: 'projectId is required' }, { status: 400 });
      }
      
      const insertData = {
        id: crypto.randomUUID(),
        name,
        chain,
        description: description || '',
        files: files || {},
        is_public: is_public || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `INSERT INTO projects (id, user_id, name, chain, description, files, is_public, created_at, updated_at) VALUES ($1, auth.uid(), $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          params: [
            insertData.id,
            insertData.name,
            insertData.chain,
            insertData.description,
            JSON.stringify(insertData.files),
            insertData.is_public,
            insertData.created_at,
            insertData.updated_at,
          ],
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to create project:', errorText);
        return json({ error: 'Failed to create project' }, { status: response.status });
      }
      
      const result = await response.json();
      return json(result[0] || insertData, { status: 201 });
    } catch (error) {
      logger.error('Error creating project:', error);
      return json(
        { error: error instanceof Error ? error.message : 'Failed to create project' },
        { status: 500 },
      );
    }
  }
  
  return json({ error: 'Method not allowed' }, { status: 405 });
}
