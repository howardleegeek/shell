// Git operations facade
// This module forwards to the in-repo git actions implementation.
// It exists to provide a stable API surface for the UI to consume.

export {
  getStatus,
  stage,
  unstage,
  isPathStaged,
  getDiff,
  commitWithAI,
  commitMessage,
  getCommits,
  reset as reset,
  push,
  pull,
} from '../../git/gitActions';
