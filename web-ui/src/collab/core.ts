// Lightweight, testable collaboration core (CRDT-inspired helpers)
// This module provides pure logic that can be unit-tested without a browser environment.

export type Presence = {
  id: string
  name: string
  editing: boolean
  filePath: string
}

// Merge local and remote content in a simple, deterministic way.
// In a real setup this would delegate to Yjs CRDT merges; here we keep it
// deterministic and testable for the repo's exercises.
export function simpleMerge(local: string, remote?: string): string {
  if (remote != null) return remote
  return local
}

// Create a presence object for a user.
export function createPresence(id: string, name: string, editing: boolean, filePath: string): Presence {
  return { id, name, editing, filePath }
}
