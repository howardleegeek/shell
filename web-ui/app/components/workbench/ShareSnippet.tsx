import { memo, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import type { EditorContextMenuPayload, EditorDocument } from '~/components/editor/codemirror/CodeMirrorEditor';

interface ShareSnippetProps {
  payload: EditorContextMenuPayload | null;
  doc?: EditorDocument;
  onClose: () => void;
}

interface SnippetContent {
  code: string;
  fileName: string;
  language: string;
}

type TokenKind = 'plain' | 'keyword' | 'string' | 'number' | 'comment' | 'symbol';

const KEYWORDS = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'class',
  'const',
  'continue',
  'default',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'for',
  'from',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'interface',
  'let',
  'new',
  'null',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'var',
  'while',
]);

const EXTENSION_TO_LANG: Record<string, string> = {
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  java: 'java',
  js: 'javascript',
  jsx: 'jsx',
  kt: 'kotlin',
  mjs: 'javascript',
  php: 'php',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'bash',
  sol: 'solidity',
  ts: 'typescript',
  tsx: 'tsx',
  vue: 'vue',
  yml: 'yaml',
  yaml: 'yaml',
};

const TOKEN_COLORS: Record<TokenKind, string> = {
  plain: '#d4d4d4',
  keyword: '#569cd6',
  string: '#ce9178',
  number: '#b5cea8',
  comment: '#6a9955',
  symbol: '#c586c0',
};

export function detectLanguageFromPath(filePath?: string) {
  if (!filePath) {
    return 'plaintext';
  }

  const extension = filePath.split('.').pop()?.toLowerCase();

  if (!extension) {
    return 'plaintext';
  }

  return EXTENSION_TO_LANG[extension] ?? extension;
}

export function formatMarkdownSnippet(language: string, code: string) {
  const lang = language || 'plaintext';
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

function makeSnippetContent(payload: EditorContextMenuPayload | null, doc?: EditorDocument): SnippetContent | null {
  if (!payload) {
    return null;
  }

  const code = payload.selectedText.trimEnd();

  if (!code) {
    return null;
  }

  const filePath = payload.filePath || doc?.filePath;
  const fileName = filePath ? filePath.split('/').pop() || 'snippet.txt' : 'snippet.txt';

  return {
    code,
    fileName,
    language: detectLanguageFromPath(filePath),
  };
}

function tokenize(line: string): Array<{ value: string; kind: TokenKind }> {
  if (!line) {
    return [{ value: '', kind: 'plain' }];
  }

  const regex = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w$]*\b|\S)/g;
  const out: Array<{ value: string; kind: TokenKind }> = [];
  let cursor = 0;
  let match: RegExpExecArray | null = regex.exec(line);

  while (match) {
    const value = match[0];
    const start = match.index;

    if (start > cursor) {
      out.push({ value: line.slice(cursor, start), kind: 'plain' });
    }

    out.push({ value, kind: classifyToken(value) });
    cursor = start + value.length;
    match = regex.exec(line);
  }

  if (cursor < line.length) {
    out.push({ value: line.slice(cursor), kind: 'plain' });
  }

  return out;
}

function classifyToken(value: string): TokenKind {
  if (value.startsWith('//')) {
    return 'comment';
  }

  if (value.startsWith('"') || value.startsWith("'") || value.startsWith('`')) {
    return 'string';
  }

  if (/^\d/.test(value)) {
    return 'number';
  }

  if (KEYWORDS.has(value)) {
    return 'keyword';
  }

  if (/^[^\w\s]+$/.test(value)) {
    return 'symbol';
  }

  return 'plain';
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function buildCanvas(snippet: SnippetContent) {
  const codeLines = snippet.code.split('\n');
  const fontSize = 16;
  const lineHeight = 24;
  const padding = 24;
  const headerHeight = 48;
  const gutterGap = 16;
  const gutterChars = String(codeLines.length).length;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas rendering context is not available');
  }

  ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
  const gutterWidth = Math.max(28, ctx.measureText('9'.repeat(gutterChars)).width);

  let maxCodeWidth = 0;

  for (const line of codeLines) {
    const lineWidth = ctx.measureText(line.replace(/\t/g, '  ')).width;
    maxCodeWidth = Math.max(maxCodeWidth, lineWidth);
  }

  const width = Math.ceil(padding * 2 + gutterWidth + gutterGap + maxCodeWidth + 20);
  const height = Math.ceil(padding * 2 + headerHeight + codeLines.length * lineHeight + 12);

  canvas.width = Math.max(560, width);
  canvas.height = Math.max(220, height);

  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, '#0a0a0f');
  background.addColorStop(1, '#1a1a2e');

  ctx.fillStyle = background;
  roundedRect(ctx, 0.5, 0.5, canvas.width - 1, canvas.height - 1, 14);
  ctx.fill();

  ctx.strokeStyle = '#00ff8833';
  ctx.lineWidth = 1;
  roundedRect(ctx, 0.5, 0.5, canvas.width - 1, canvas.height - 1, 14);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
  roundedRect(ctx, 12, 12, canvas.width - 24, headerHeight, 10);
  ctx.fill();

  ctx.font = '600 14px "JetBrains Mono", monospace';
  ctx.fillStyle = '#8cf7c6';
  ctx.fillText(snippet.fileName, 24, 42);

  const langLabel = snippet.language.toUpperCase();
  const langWidth = ctx.measureText(langLabel).width + 16;
  ctx.fillStyle = 'rgba(0, 255, 136, 0.18)';
  roundedRect(ctx, canvas.width - langWidth - 24, 22, langWidth, 22, 6);
  ctx.fill();

  ctx.fillStyle = '#00ff88';
  ctx.fillText(langLabel, canvas.width - langWidth - 16, 38);

  ctx.font = '16px "JetBrains Mono", monospace';
  const startY = padding + headerHeight + 24;
  const lineNumberX = padding;
  const codeStartX = padding + gutterWidth + gutterGap;

  codeLines.forEach((line, lineIndex) => {
    const y = startY + lineIndex * lineHeight;
    ctx.fillStyle = '#5d6479';
    ctx.fillText(String(lineIndex + 1).padStart(gutterChars, ' '), lineNumberX, y);

    let x = codeStartX;

    for (const token of tokenize(line.replace(/\t/g, '  '))) {
      ctx.fillStyle = TOKEN_COLORS[token.kind];
      ctx.fillText(token.value, x, y);
      x += ctx.measureText(token.value).width;
    }
  });

  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(0, 255, 136, 0.45)';
  ctx.fillText('SHELL IDE', canvas.width - 96, canvas.height - 16);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert snippet canvas to PNG blob'));
      }
    }, 'image/png');
  });
}

export const ShareSnippet = memo(({ payload, doc, onClose }: ShareSnippetProps) => {
  const snippet = useMemo(() => makeSnippetContent(payload, doc), [payload, doc]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!payload) {
      setMenuOpen(false);
      return;
    }

    setMenuOpen(true);
  }, [payload]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setDialogOpen(false);
        onClose();
      }
    };

    const handleClick = () => {
      if (!dialogOpen) {
        setMenuOpen(false);
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('click', handleClick);
    };
  }, [dialogOpen, onClose]);

  const generatePreview = async () => {
    if (!snippet) {
      toast.warn('Select some code before sharing');
      return;
    }

    const canvas = buildCanvas(snippet);
    const blob = await canvasToBlob(canvas);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(blob));
  };

  const openDialog = async () => {
    if (!snippet) {
      toast.warn('Select some code before sharing');
      setMenuOpen(false);
      onClose();
      return;
    }

    try {
      await generatePreview();
      setDialogOpen(true);
      setMenuOpen(false);
    } catch (error) {
      console.error('Failed to generate snippet card:', error);
      toast.error('Failed to generate snippet card');
    }
  };

  const copyMarkdown = async () => {
    if (!snippet) {
      return;
    }

    await navigator.clipboard.writeText(formatMarkdownSnippet(snippet.language, snippet.code));
    toast.success('Markdown snippet copied');
  };

  const copyImage = async () => {
    if (!snippet) {
      return;
    }

    try {
      const canvas = buildCanvas(snippet);
      const blob = await canvasToBlob(canvas);
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      toast.success('Snippet image copied');
    } catch (error) {
      console.error('Failed to copy snippet image:', error);
      toast.error('Image copy is not supported in this browser');
    }
  };

  const downloadPng = async () => {
    if (!snippet) {
      return;
    }

    const canvas = buildCanvas(snippet);
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${snippet.fileName.replace(/\.[^/.]+$/, '')}-snippet.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Snippet PNG downloaded');
  };

  return (
    <>
      {menuOpen && payload && (
        <div
          className="fixed z-[90]"
          style={{ left: payload.x, top: payload.y }}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <button
            type="button"
            className="rounded-md border border-[#00ff8833] bg-[#0f1020] px-3 py-2 text-sm text-[#8cf7c6] shadow-lg"
            onClick={(event) => {
              event.stopPropagation();
              void openDialog();
            }}
          >
            Share Snippet
          </button>
        </div>
      )}

      {dialogOpen && snippet && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60"
          onClick={() => {
            setDialogOpen(false);
            onClose();
          }}
        >
          <div
            className="w-[min(920px,95vw)] rounded-xl border border-[#00ff8833] bg-[#0d0e1d] p-4"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-3 flex items-center justify-between text-sm text-[#9effd2]">
              <div>{snippet.fileName}</div>
              <div>{snippet.language}</div>
            </div>

            <div className="overflow-auto rounded-lg border border-[#00ff8833] bg-[#0a0a0f] p-2">
              {previewUrl && <img src={previewUrl} alt="Snippet share card" className="mx-auto block max-h-[60vh] max-w-full" />}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-[#00ff8833] bg-[#101227] px-3 py-2 text-sm text-[#8cf7c6]"
                onClick={() => {
                  void copyImage();
                }}
              >
                Copy as Image
              </button>
              <button
                type="button"
                className="rounded-md border border-[#00ff8833] bg-[#101227] px-3 py-2 text-sm text-[#8cf7c6]"
                onClick={() => {
                  void downloadPng();
                }}
              >
                Download PNG
              </button>
              <button
                type="button"
                className="rounded-md border border-[#00ff8833] bg-[#101227] px-3 py-2 text-sm text-[#8cf7c6]"
                onClick={() => {
                  void copyMarkdown();
                }}
              >
                Copy as Markdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ShareSnippet.displayName = 'ShareSnippet';
