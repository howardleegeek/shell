OpenCode Shell Plugins - Design Guide

- Plugins extend the Shell runtime by providing new capabilities (commands, UI panels, reports, etc.).
- The runtime loads plugins from a directory (local or remote) and calls activate(context) on each plugin.
- This repository ships a small sample plugin and a manager that demonstrates loading a plugin from
  repo/.opencode/plugins/sample-plugins/.

Design notes:
- Plugins should be self-contained and idempotent where possible.
- Activation should be side-effect free apart from registering UI elements, writing to the editor, or emitting reports.
- Deactivation should gracefully clean up any registered resources.

Basic contract (TypeScript): see plugin-api.ts for interfaces. JavaScript plugins can follow the same shape
as the example in repo/.opencode/plugins/sample-plugins/echo-plugin.js.
