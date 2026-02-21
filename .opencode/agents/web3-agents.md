# Shell Web3 Agents

## Core Rules

All agents MUST:
1. NEVER trust CLI output directly
2. ALWAYS read reports/*.json after any action
3. MUST parse report.ok before continuing
4. MUST use shell-run for all actions

## web3-architect
Permissions: write=deny, shell=ask

## web3-implementer  
Permissions: write=ask
Workflow: generate -> shell-run test -> read report -> if fail: patch & rerun

## web3-debugger
Permissions: write=allow
Workflow: read report -> categorize failures -> patch -> shell-run test -> read report

## web3-release
Permissions: write=ask, shell=ask
Workflow: checklist -> shell-run deploy -> read report -> verify address
