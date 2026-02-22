import { describe, expect, it, vi } from 'vitest';
import {
  createShareSnippetMenuItem,
  extractSnippetFromEditor,
  mapMonacoTokensToSnippetLines,
  renderSnippetCard,
  toMarkdownCodeBlock,
  type MonacoEditorLike,
} from './ShareSnippet';

describe('ShareSnippet helpers', () => {
  it('extracts selected code, file name, and language from editor', () => {
    const editor: MonacoEditorLike = {
      getModel: () => ({
        getValueInRange: () => 'const answer = 42;',
        getLanguageId: () => 'typescript',
        uri: { path: '/workspace/app/example.ts' },
      }),
      getSelection: () => ({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 19,
      }),
    };

    expect(extractSnippetFromEditor(editor)).toEqual({
      code: 'const answer = 42;',
      fileName: 'example.ts',
      language: 'typescript',
    });
  });

  it('formats markdown code block', () => {
    const markdown = toMarkdownCodeBlock({
      code: "console.log('ok')",
      fileName: 'demo.ts',
      language: 'typescript',
    });

    expect(markdown).toBe("```typescript\nconsole.log('ok')\n```");
  });

  it('creates Share Snippet menu item', () => {
    const fn = vi.fn();
    const item = createShareSnippetMenuItem(fn);
    expect(item.label).toBe('Share Snippet');
    item.action();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('maps Monaco token colors into render lines', () => {
    const lines = mapMonacoTokensToSnippetLines(['const x = 1;'], [[{ offset: 0, color: '#ff66ff' }, { offset: 6, color: '#d8e1ff' }]]);
    expect(lines[0].tokens).toEqual([
      { text: 'const ', color: '#ff66ff' },
      { text: 'x = 1;', color: '#d8e1ff' },
    ]);
  });

  it('renders cyberpunk card on canvas', () => {
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
    } as unknown as CanvasRenderingContext2D;

    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toDataURL: vi.fn(() => 'data:image/png;base64,AA=='),
    } as unknown as HTMLCanvasElement;

    const result = renderSnippetCard(
      {
        code: 'const answer = 42;\nconsole.log(answer)',
        fileName: 'demo.ts',
        language: 'typescript',
      },
      () => canvas,
    );

    expect(result).toBe(canvas);
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect((ctx.fillText as any).mock.calls.length).toBeGreaterThan(0);
  });
});
