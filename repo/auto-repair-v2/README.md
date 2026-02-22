Auto Repair v2: Test & Audit Auto-Fix Orchestrator (Skeleton)

- Reads reports/test.*.json and reports/audit.*.json to surface failing tests and high-severity audits.
- Generates patch descriptors under patches/ for later application by a real AI patcher.
- Writes progress entries to progress.txt for traceability.

This is a lightweight scaffold to demonstrate the workflow. The actual patch generation is represented as metadata files to keep changes safe in this educational environment.
