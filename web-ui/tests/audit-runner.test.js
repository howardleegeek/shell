const assert = require('assert');
const {
  parseSlitherOutput,
  parseSemgrepOutput,
  parseClippyOutput,
  runAnchorSecurityLints,
  sortFindings,
  summarizeFindings,
} = require('../app/lib/web3/audit-runner');

function testSlitherParser() {
  const report = JSON.stringify({
    results: {
      detectors: [
        {
          check: 'reentrancy-eth',
          impact: 'High',
          description: 'Reentrancy in withdraw().\nRecommendation: Use checks-effects-interactions.',
          elements: [
            {
              source_mapping: {
                filename_relative: 'contracts/Vault.sol',
                lines: [45],
                starting_column: 3,
              },
            },
          ],
        },
      ],
    },
  });
  const input = `slither execution logs\n${report}`;

  const findings = parseSlitherOutput(input);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'high');
  assert.equal(findings[0].file, 'contracts/Vault.sol');
  assert.equal(findings[0].line, 45);
}

function testSortOrder() {
  const findings = sortFindings([
    { severity: 'medium', file: 'z.sol', line: 5 },
    { severity: 'critical', file: 'b.sol', line: 7 },
    { severity: 'high', file: 'a.sol', line: 9 },
  ]);

  assert.equal(findings[0].severity, 'critical');
  assert.equal(findings[1].severity, 'high');
  assert.equal(findings[2].severity, 'medium');
}

function testSemgrepParser() {
  const input = JSON.stringify({
    results: [
      {
        path: 'contracts/Token.sol',
        check_id: 'solidity.security.missing-zero-check',
        start: { line: 23, col: 7 },
        extra: {
          severity: 'WARNING',
          message: 'Missing zero-address check before transfer.',
        },
      },
    ],
  });

  const findings = parseSemgrepOutput(input);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'medium');
  assert.equal(findings[0].line, 23);
}

function testClippyParser() {
  const line = JSON.stringify({
    reason: 'compiler-message',
    message: {
      level: 'warning',
      message: 'unused mutable variable',
      code: { code: 'unused_mut' },
      spans: [
        {
          file_name: 'programs/demo/src/lib.rs',
          line_start: 11,
          column_start: 5,
          is_primary: true,
        },
      ],
    },
  });

  const findings = parseClippyOutput(`${line}\n`);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'medium');
  assert.equal(findings[0].ruleId, 'unused_mut');
}

function testAnchorLints() {
  const findings = runAnchorSecurityLints([
    [
      '/home/project/programs/demo/src/lib.rs',
      `
use anchor_lang::prelude::*;

#[program]
pub mod demo {
  use super::*;

  pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
    invoke(ctx.accounts.transfer_ix.clone(), &[])?;
    Ok(())
  }
}
      `,
    ],
  ]);

  assert.ok(findings.length >= 1);
  const summary = summarizeFindings(findings);
  assert.ok(summary.high >= 1);
}

function run() {
  testSlitherParser();
  testSemgrepParser();
  testClippyParser();
  testAnchorLints();
  testSortOrder();
  console.log('audit-runner tests passed');
}

try {
  run();
  process.exit(0);
} catch (error) {
  console.error('audit-runner tests failed:', error && error.message ? error.message : error);
  process.exit(1);
}
