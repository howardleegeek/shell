import { detectLanguageFromPath, formatMarkdownSnippet } from './ShareSnippet';

describe('ShareSnippet helpers', () => {
  test('detects language from file extension', () => {
    expect(detectLanguageFromPath('src/main.ts')).toBe('typescript');
    expect(detectLanguageFromPath('contracts/Foo.sol')).toBe('solidity');
  });

  test('falls back to plaintext without extension', () => {
    expect(detectLanguageFromPath('README')).toBe('plaintext');
    expect(detectLanguageFromPath(undefined)).toBe('plaintext');
  });

  test('formats markdown fenced block', () => {
    const markdown = formatMarkdownSnippet('typescript', 'const x = 1;');
    expect(markdown).toBe('```typescript\nconst x = 1;\n```');
  });
});
