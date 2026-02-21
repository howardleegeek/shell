import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { projectsState, createProject, deleteProject, switchProject } from '~/lib/stores/projects';
import { supabaseConnection } from '~/lib/stores/supabase';
import type { ChainType } from '~/types/project';
import styles from './projects.module.scss';

export default function ProjectsPage() {
  const state = useStore(projectsState);
  const supabaseState = useStore(supabaseConnection);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectChain, setNewProjectChain] = useState<ChainType>('evm');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!state.projects.length && !state.isLoading) {
      fetchProjectsFromAPI();
    }
  }, []);

  async function fetchProjectsFromAPI() {
    if (!supabaseState.token || !supabaseState.selectedProjectId) return;

    try {
      const response = await fetch(`/api/projects?projectId=${supabaseState.selectedProjectId}`, {
        headers: {
          Authorization: `Bearer ${supabaseState.token}`,
        },
      });

      if (response.ok) {
        const projects = await response.json();
        projectsState.setKey('projects', projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim() || !supabaseState.token || !supabaseState.selectedProjectId) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/projects?projectId=${supabaseState.selectedProjectId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseState.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: supabaseState.selectedProjectId,
          name: newProjectName,
          chain: newProjectChain,
          description: newProjectDescription,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        projectsState.setKey('projects', [project, ...state.projects]);
        setShowNewProject(false);
        setNewProjectName('');
        setNewProjectDescription('');
        switchProject(project.id);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    if (!supabaseState.token || !supabaseState.selectedProjectId) return;
    if (!confirm('Are you sure you want to delete this project?')) return;

    setDeletingId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}?projectId=${supabaseState.selectedProjectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${supabaseState.token}`,
        },
      });

      if (response.ok) {
        const projects = state.projects.filter(p => p.id !== projectId);
        projectsState.setKey('projects', projects);
        if (state.currentProjectId === projectId) {
          switchProject(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeletingId(null);
    }
  }

  function handleSwitchProject(projectId: string) {
    switchProject(projectId);
    window.location.href = '/';
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }

  if (!supabaseState.isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>Connect to Supabase</h2>
          <p>Please connect to Supabase first to manage your projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Projects</h1>
        <button
          className={styles.newButton}
          onClick={() => setShowNewProject(true)}
          disabled={!supabaseState.selectedProjectId}
        >
          + New Project
        </button>
      </div>

      {showNewProject && (
        <div className={styles.modal}>
          <form onSubmit={handleCreateProject}>
            <h3>Create New Project</h3>
            <div className={styles.field}>
              <label>Project Name *</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Smart Contract"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Chain *</label>
              <select
                value={newProjectChain}
                onChange={(e) => setNewProjectChain(e.target.value as ChainType)}
              >
                <option value="evm">EVM (Ethereum, Polygon, etc.)</option>
                <option value="svm">SVM (Solana)</option>
                <option value="move">Move (Aptos, Sui)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Description</label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className={styles.actions}>
              <button type="button" onClick={() => setShowNewProject(false)}>
                Cancel
              </button>
              <button type="submit" disabled={isCreating || !newProjectName.trim()}>
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {state.isLoading ? (
        <div className={styles.loading}>Loading projects...</div>
      ) : state.projects.length === 0 ? (
        <div className={styles.empty}>
          <h2>No projects yet</h2>
          <p>Create your first smart contract project to get started.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {state.projects.map((project) => (
            <div
              key={project.id}
              className={`${styles.card} ${state.currentProjectId === project.id ? styles.active : ''}`}
            >
              <div className={styles.cardHeader}>
                <h3>{project.name}</h3>
                <span className={styles.chain}>{project.chain.toUpperCase()}</span>
              </div>
              {project.description && <p className={styles.description}>{project.description}</p>}
              <div className={styles.meta}>
                <span>Updated {formatDate(project.updated_at)}</span>
                {project.is_public && <span className={styles.public}>Public</span>}
              </div>
              <div className={styles.cardActions}>
                <button
                  onClick={() => handleSwitchProject(project.id)}
                  className={styles.openButton}
                >
                  Open
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  disabled={deletingId === project.id}
                  className={styles.deleteButton}
                >
                  {deletingId === project.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
