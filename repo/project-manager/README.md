Project Manager CLI

Overview
- Basic project management with create/list/switch/update operations.
- Data persisted in a JSON file under data/; can be overridden with PROJECT_MANAGER_DATA_DIR env var.

Usage
- Create a project:
  node project-manager/index.js create --name "My Project" --chain evm --description "Demo project"
- List projects:
  node project-manager/index.js list
- Switch current project:
  node project-manager/index.js switch --id <project-id>
- Update a project:
  node project-manager/index.js update --id <project-id> --name "New Name" --description "Updated"
- Show current project:
  node project-manager/index.js current
- Delete a project:
  node project-manager/index.js delete --id <project-id>

Notes
- The CLI is intentionally lightweight. It is designed to be IDE-friendly and resilient to retries.
- For production-grade integration with Supabase, replace JSON store calls with API calls to Supabase databases.
