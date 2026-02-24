#!/usr/bin/env bash
set -euo pipefail

SPEC_FILE="SPEC.md"

if [[ ! -f "${SPEC_FILE}" ]]; then
  echo "missing ${SPEC_FILE}"
  exit 1
fi

required_patterns=(
  "## Priority 2: Autonomous Discovery Deliverable Definition"
  "Discovery Spec (What was discovered)"
  "Discovery PAT (Proof of applicability)"
  "Hard Stop Rules (Anti-Drift)"
  "Success Criteria"
  "reports/discovery.spec.json"
  "reports/discovery.pat.json"
  "problem_statement"
  "constraints"
  "hypotheses"
  "decision_policy"
  "exit_criteria"
  "non_goals"
  "recommended_next_action"
  "candidate"
  "test_protocol"
  "evidence"
  "result"
  "failure_mode"
  "follow_up_action"
)

for pattern in "${required_patterns[@]}"; do
  if ! grep -Fq "${pattern}" "${SPEC_FILE}"; then
    echo "missing required pattern: ${pattern}"
    exit 1
  fi
done

echo "autonomous discovery spec checks passed"
