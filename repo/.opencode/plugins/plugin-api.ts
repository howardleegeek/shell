// OpenCode Shell Plugin API - TypeScript interfaces (design-time contract)
// This file defines the core plugin contract used by TypeScript plugins that
// extend the Shell via the plugin engine. The runtime (JavaScript) loader
// does not depend on TypeScript types, but these definitions help ensure
// consistency for TS-based plugins in the future.

export type ChainType = 'svm' | 'evm' | 'move' | 'all';

export interface EditorAPI {
  // Write text to the embedded editor
  write?(text: string): void;
  // Read current editor content (best-effort)
  read?(): string;
}

export interface TerminalAPI {
  log?(text: string): void;
  error?(text: string): void;
}

export interface ReportsAPI {
  write?(name: string, data: any): void;
  read?(name: string): any;
}

export interface ChainAPI {
  // Balance or other chain interactions can be added here
  balance?: (...args: any[]) => Promise<any>;
}

export interface UIAPI {
  // Register a UI panel or widget in the host application
  registerPanel?(name: string, options?: any): void;
  // Show a panel by id (optional, for extensibility)
  showPanel?(id: string): void;
}

export interface PluginContext {
  editor?: EditorAPI;
  terminal?: TerminalAPI;
  reports?: ReportsAPI;
  chain?: ChainAPI;
  ui?: UIAPI;
}

export interface ShellPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  chain?: ChainType;
  activate(context: PluginContext): void;
  deactivate(): void;
}

// Optional helper to annotate a plugin factory for TS-friendly tooling.
export type PluginFactory = () => ShellPlugin | Promise<ShellPlugin>;
