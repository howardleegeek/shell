export type ChainType = 'svm' | 'evm' | 'move';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  chain: ChainType;
  description?: string;
  files: Record<string, { type: 'file' | 'directory'; content?: string; isBinary?: boolean }>;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export interface CreateProjectInput {
  name: string;
  chain: ChainType;
  description?: string;
  template?: string;
  is_public?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  files?: Project['files'];
  is_public?: boolean;
}
