import { atom, map, type MapStore } from 'nanostores';
import type { Project, CreateProjectInput, UpdateProjectInput } from '~/types/project';

const storage =
  typeof globalThis !== 'undefined' &&
  typeof globalThis.localStorage !== 'undefined' &&
  typeof globalThis.localStorage.getItem === 'function'
    ? globalThis.localStorage
    : null;

export interface ProjectsState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;
}

const savedState = storage ? storage.getItem('projects_state') : null;
const initialState: ProjectsState = savedState
  ? JSON.parse(savedState)
  : {
      projects: [],
      currentProjectId: null,
      isLoading: false,
      error: null,
    };

export const projectsState = map<ProjectsState>(initialState);
export const currentProject = atom<Project | null>(null);

export function updateProjectsState(updates: Partial<ProjectsState>) {
  const state = projectsState.get();
  const newState = { ...state, ...updates };
  projectsState.set(newState);
  
  if (storage) {
    storage.setItem('projects_state', JSON.stringify({
      projects: newState.projects,
      currentProjectId: newState.currentProjectId,
      isLoading: false,
      error: null,
    }));
  }
  
  if (updates.currentProjectId !== undefined || updates.projects) {
    const projectId = updates.currentProjectId ?? state.currentProjectId;
    const projects = updates.projects ?? state.projects;
    const project = projects.find(p => p.id === projectId) || null;
    currentProject.set(project);
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutoSave(projectId: string, files: Project['files']) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveProject(projectId, { files }).catch(console.error);
    saveTimeout = null;
  }, 2000);
}

export async function fetchProjects() {
  updateProjectsState({ isLoading: true, error: null });
  
  try {
    const supabaseToken = typeof window !== 'undefined' 
      ? localStorage.getItem('supabase_connection')
      : null;
    
    if (!supabaseToken) {
      updateProjectsState({ isLoading: false });
      return [];
    }
    
    const { token, selectedProjectId } = JSON.parse(supabaseToken);
    
    if (!token || !selectedProjectId) {
      updateProjectsState({ isLoading: false });
      return [];
    }
    
    const response = await fetch(`/api/projects?projectId=${selectedProjectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch projects');
    }
    
    const projects = await response.json();
    updateProjectsState({ projects: Array.isArray(projects) ? projects : [], isLoading: false });
    
    return projects;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects';
    updateProjectsState({ error: message, isLoading: false });
    throw error;
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  updateProjectsState({ isLoading: true, error: null });
  
  try {
    const supabaseToken = typeof window !== 'undefined' 
      ? localStorage.getItem('supabase_connection')
      : null;
    
    if (!supabaseToken) {
      throw new Error('Not connected to Supabase');
    }
    
    const { token, selectedProjectId } = JSON.parse(supabaseToken);
    
    if (!token || !selectedProjectId) {
      throw new Error('Not connected to Supabase');
    }
    
    const response = await fetch(`/api/projects?projectId=${selectedProjectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...input, projectId: selectedProjectId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create project');
    }
    
    const project = await response.json();
    const state = projectsState.get();
    updateProjectsState({ 
      projects: [project, ...state.projects],
      currentProjectId: project.id,
      isLoading: false,
    });
    
    return project;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    updateProjectsState({ error: message, isLoading: false });
    throw error;
  }
}

export async function saveProject(projectId: string, updates: UpdateProjectInput): Promise<Project> {
  try {
    const supabaseToken = typeof window !== 'undefined' 
      ? localStorage.getItem('supabase_connection')
      : null;
    
    if (!supabaseToken) {
      throw new Error('Not connected to Supabase');
    }
    
    const { token, selectedProjectId } = JSON.parse(supabaseToken);
    
    if (!token || !selectedProjectId) {
      throw new Error('Not connected to Supabase');
    }
    
    const response = await fetch(`/api/projects/${projectId}?projectId=${selectedProjectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save project');
    }
    
    const updatedProject = await response.json();
    const state = projectsState.get();
    const projects = state.projects.map(p => 
      p.id === projectId ? updatedProject : p
    );
    updateProjectsState({ projects });
    
    if (state.currentProjectId === projectId) {
      currentProject.set(updatedProject);
    }
    
    return updatedProject;
  } catch (error) {
    console.error('Failed to save project:', error);
    throw error;
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    const supabaseToken = typeof window !== 'undefined' 
      ? localStorage.getItem('supabase_connection')
      : null;
    
    if (!supabaseToken) {
      throw new Error('Not connected to Supabase');
    }
    
    const { token, selectedProjectId } = JSON.parse(supabaseToken);
    
    if (!token || !selectedProjectId) {
      throw new Error('Not connected to Supabase');
    }
    
    const response = await fetch(`/api/projects/${projectId}?projectId=${selectedProjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete project');
    }
    
    const state = projectsState.get();
    const projects = state.projects.filter(p => p.id !== projectId);
    const currentProjectId = state.currentProjectId === projectId ? null : state.currentProjectId;
    
    updateProjectsState({ projects, currentProjectId });
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
}

export function switchProject(projectId: string | null) {
  updateProjectsState({ currentProjectId: projectId });
}

export function getCurrentProject(): Project | null {
  return currentProject.get();
}

export async function initializeProjects() {
  try {
    await fetchProjects();
  } catch (error) {
    console.error('Failed to initialize projects:', error);
  }
}

if (typeof window !== 'undefined') {
  initializeProjects();
}
