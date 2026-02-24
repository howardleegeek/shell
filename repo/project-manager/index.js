#!/usr/bin/env node
// Simple CLI: create/list/switch/update projects with JSON persistence
// Data directory can be overridden via PROJECT_MANAGER_DATA_DIR env var
// In production, this can be wired to Supabase; here we keep a local JSON store with a simple stub for Supabase.

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.PROJECT_MANAGER_DATA_DIR || path.resolve(__dirname, '../../data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CURRENT_FILE = path.join(DATA_DIR, 'current.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadProjects() {
  ensureDataDir();
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]), 'utf8');
  }
  const raw = fs.readFileSync(PROJECTS_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Invalid projects.json, resetting');
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]), 'utf8');
    return [];
  }
}

function saveProjects(projects) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

function loadCurrentId() {
  ensureDataDir();
  if (!fs.existsSync(CURRENT_FILE)) {
    fs.writeFileSync(CURRENT_FILE, JSON.stringify({ id: null }), 'utf8');
  }
  const raw = fs.readFileSync(CURRENT_FILE, 'utf8');
  try {
    return JSON.parse(raw).id;
  } catch (e) {
    fs.writeFileSync(CURRENT_FILE, JSON.stringify({ id: null }), 'utf8');
    return null;
  }
}

function saveCurrentId(id) {
  ensureDataDir();
  fs.writeFileSync(CURRENT_FILE, JSON.stringify({ id }), 'utf8');
}

function nowISO() {
  return new Date().toISOString();
}

function uuid() {
  // Simple UUID-like generator
  return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createProject({ name, chain = 'evm', description = '', files = [], user_id = 'user-1' } = {}) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('name is required');
  }
  const id = uuid();
  const p = {
    id,
    user_id,
    name: name.trim(),
    chain,
    description,
    files,
    created_at: nowISO(),
    updated_at: nowISO(),
    is_public: false,
  };
  const projects = loadProjects();
  projects.push(p);
  saveProjects(projects);
  saveCurrentId(id);
  return p;
}

function listProjects() {
  const projects = loadProjects();
  // Return in reverse chronological order by updated_at
  return projects.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function getCurrentProject() {
  const id = loadCurrentId();
  const projects = loadProjects();
  if (!id) return null;
  return projects.find((p) => p.id === id) || null;
}

function updateProject(id, updates = {}) {
  if (!id) throw new Error('project id is required');
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error('project not found');
  const proj = { ...projects[idx], ...updates, updated_at: nowISO() };
  projects[idx] = proj;
  saveProjects(projects);
  // If updated, keep current id in sync
  saveCurrentId(id);
  return proj;
}

function removeProject(id) {
  const projects = loadProjects();
  const newList = projects.filter((p) => p.id !== id);
  if (newList.length === projects.length) {
    throw new Error('project not found');
  }
  saveProjects(newList);
  const current = loadCurrentId();
  if (current === id) {
    saveCurrentId(null);
  }
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const toKeyValue = (arr) => {
    const obj = {};
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      if (a.startsWith('--')) {
        const key = a.substring(2);
        const val = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true;
        obj[key] = val;
      }
    }
    return obj;
  };

  try {
    switch (cmd) {
      case 'create': {
        const opts = toKeyValue(args.slice(1));
        const name = opts.name || opts._name;
        const chain = opts.chain || 'evm';
        const description = opts.description || '';
        const proj = createProject({ name, chain, description });
        console.log('Created project:');
        console.log(JSON.stringify(proj, null, 2));
        break;
      }
      case 'list': {
        const list = listProjects();
        console.log(JSON.stringify(list, null, 2));
        break;
      }
      case 'switch': {
        const opts = toKeyValue(args.slice(1));
        const id = opts.id;
        if (!id) throw new Error('id is required to switch');
        saveCurrentId(id);
        console.log('Switched to project id: ' + id);
        break;
      }
      case 'update': {
        const opts = toKeyValue(args.slice(1));
        const id = opts.id;
        const updates = {};
        if (opts.name) updates.name = opts.name;
        if (opts.chain) updates.chain = opts.chain;
        if (opts.description) updates.description = opts.description;
        if (opts.is_public !== undefined) updates.is_public = opts.is_public === 'true' || opts.is_public === true;
        if (opts.files) {
          try {
            updates.files = JSON.parse(opts.files);
          } catch {
            updates.files = opts.files;
          }
        }
        if (!id) throw new Error('id is required for update');
        const proj = updateProject(id, updates);
        console.log('Updated project:');
        console.log(JSON.stringify(proj, null, 2));
        break;
      }
      case 'current': {
        const c = getCurrentProject();
        console.log(JSON.stringify(c, null, 2));
        break;
      }
      case 'delete': {
        const opts = toKeyValue(args.slice(1));
        const id = opts.id;
        if (!id) throw new Error('id is required to delete');
        removeProject(id);
        console.log('Deleted project ' + id);
        break;
      }
      default:
        console.log('Usage: node index.js <command> [--options]');
        console.log('Commands: create, list, switch, update, current, delete');
    }
  } catch (err) {
    console.error('Error: ' + err.message);
    process.exitCode = 1;
  }
}

// Run when executed directly
if (require.main === module) {
  main();
}
