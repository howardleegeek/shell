import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('cyberpunk theme wiring', () => {
  it('defines the required cyberpunk palette and neon effects', () => {
    const stylesheet = readFileSync('app/styles/index.scss', 'utf8');

    expect(stylesheet).toContain('--cyber-bg: #0a0a0f;');
    expect(stylesheet).toContain('--cyber-accent: #00ff88;');
    expect(stylesheet).toContain('--cyber-accent-secondary: #b84dff;');
    expect(stylesheet).toContain("font-family: 'JetBrains Mono'");
    expect(stylesheet).toContain('box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);');
  });

  it('keeps Shell branding text and subtitle in root html output', () => {
    const entryServer = readFileSync('app/entry.server.tsx', 'utf8');
    const root = readFileSync('app/root.tsx', 'utf8');

    expect(entryServer).toContain('data-brand-title="Shell"');
    expect(entryServer).toContain('data-brand-subtitle="Web3 Vibe Coding"');
    expect(root).toContain("{ title: 'Shell' }");
    expect(root).toContain("{ name: 'description', content: 'Web3 Vibe Coding' }");
  });
});
