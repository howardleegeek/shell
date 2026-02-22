import { useMemo, useState } from 'react';

export interface MonacoRangeLike {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface MonacoModelLike {
  getValueInRange(range: MonacoRangeLike): string;
  getLanguageId(): string;
  uri?: { path?: string };
}

export interface MonacoEditorLike {
  getModel(): MonacoModelLike | null;
  getSelection(): MonacoRangeLike | null;
}

export interface SnippetToken {
  text: string;
  color?: string;
}

export interface SnippetLine {
  tokens: SnippetToken[];
}

export interface MonacoColorToken {
  offset: number;
  color: string;
}

export interface ShareSnippetData {
  code: string;
  fileName: string;
  language: string;
  lines?: SnippetLine[];
}

interface CardColors {
  keyword: string;
  string: string;
  number: string;
  comment: string;
  plain: string;
}

const CARD_COLORS: CardColors = {
  keyword: '#ff66ff',
  string: '#73ffd2',
  number: '#ffc44d',
  comment: '#7d8db3',
  plain: '#d8e1ff',
};

const DEFAULT_FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export function extractSnippetFromEditor(editor: MonacoEditorLike): ShareSnippetData | null {
  const model = editor.getModel();
  const selection = editor.getSelection();
  if (!model || !selection) {
    return null;
  }

  const code = model.getValueInRange(selection).replace(/\s+$/, '');
  if (!code.trim()) {
    return null;
  }

  const path = model.uri?.path ?? 'snippet.txt';
  const fileName = path.split('/').pop() ?? 'snippet.txt';
  return { code, fileName, language: model.getLanguageId() || 'text' };
}

export function toMarkdownCodeBlock(data: ShareSnippetData): string {
  const language = data.language?.trim() || 'text';
  return ['```' + language, data.code, '```'].join('\n');
}

export function mapMonacoTokensToSnippetLines(lines: string[], tokensByLine: MonacoColorToken[][]): SnippetLine[] {
  return lines.map((line, index) => {
    const sorted = [...(tokensByLine[index] || [])].sort((a, b) => a.offset - b.offset);
    if (!sorted.length) {
      return { tokens: [{ text: line, color: CARD_COLORS.plain }] };
    }

    const segments: SnippetToken[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const start = sorted[i].offset;
      const end = i + 1 < sorted.length ? sorted[i + 1].offset : line.length;
      segments.push({ text: line.slice(start, end), color: sorted[i].color || CARD_COLORS.plain });
    }
    return { tokens: segments };
  });
}

export async function copyMarkdownCodeBlock(data: ShareSnippetData): Promise<void> {
  await navigator.clipboard.writeText(toMarkdownCodeBlock(data));
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);
}

export async function downloadCanvasAsPng(canvas: HTMLCanvasElement, name: string): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizeFileName(name) + '.png';
  link.click();
  URL.revokeObjectURL(url);
}

export function createShareSnippetMenuItem(onSelect: () => void) {
  return {
    id: 'share-snippet',
    label: 'Share Snippet',
    action: onSelect,
  };
}

export function renderSnippetCard(
  data: ShareSnippetData,
  makeCanvas: (width: number, height: number) => HTMLCanvasElement = makeDomCanvas,
): HTMLCanvasElement {
  const textLines = data.code.split('\n');
  const rows = toRenderableLines(textLines, data.lines);
  const fontSize = 14;
  const lineHeight = 22;
  const padding = 28;
  const header = 56;
  const lineNumberWidth = 44;
  const codeWidth = measureMaxCodeWidth(rows, fontSize);
  const width = Math.max(560, padding * 2 + lineNumberWidth + codeWidth + 12);
  const height = header + padding + rows.length * lineHeight + 16;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('2D context unavailable');
  }

  paintBackground(ctx, width, height);
  paintHeader(ctx, data, padding);
  paintCodeRows(ctx, rows, { padding, header, lineHeight, lineNumberWidth, fontSize });
  paintWatermark(ctx, width, height);
  return canvas;
}

function paintBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a0a0f');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#00ff8833';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

function paintHeader(ctx: CanvasRenderingContext2D, data: ShareSnippetData, padding: number) {
  ctx.font = `600 13px ${DEFAULT_FONT}`;
  ctx.fillStyle = '#8ec5ff';
  ctx.fillText(data.fileName, padding, 34);
  const langLabel = (data.language || 'text').toUpperCase();
  const tagWidth = ctx.measureText(langLabel).width + 16;
  ctx.fillStyle = '#00ff8855';
  ctx.fillRect(padding, 40, tagWidth, 18);
  ctx.fillStyle = '#00ffbe';
  ctx.font = `600 11px ${DEFAULT_FONT}`;
  ctx.fillText(langLabel, padding + 8, 53);
}

function paintCodeRows(
  ctx: CanvasRenderingContext2D,
  rows: SnippetLine[],
  opts: { padding: number; header: number; lineHeight: number; lineNumberWidth: number; fontSize: number },
) {
  ctx.font = `${opts.fontSize}px ${DEFAULT_FONT}`;
  rows.forEach((row, index) => {
    const y = opts.header + opts.padding + index * opts.lineHeight;
    ctx.fillStyle = '#5a6686';
    ctx.fillText(String(index + 1), opts.padding, y);
    let x = opts.padding + opts.lineNumberWidth;
    row.tokens.forEach((token) => {
      ctx.fillStyle = token.color || CARD_COLORS.plain;
      ctx.fillText(token.text, x, y);
      x += ctx.measureText(token.text).width;
    });
  });
}

function paintWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.font = `500 12px ${DEFAULT_FONT}`;
  ctx.fillStyle = '#00ff8844';
  ctx.fillText('Shell IDE', width - 88, height - 16);
}

function toRenderableLines(textLines: string[], provided?: SnippetLine[]): SnippetLine[] {
  if (provided?.length === textLines.length) {
    return provided;
  }
  return textLines.map((line) => ({ tokens: basicTokenize(line) }));
}

function basicTokenize(line: string): SnippetToken[] {
  const parts = line.match(/\/\/.*|#.*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(\.\d+)?\b|\b(const|let|var|if|else|for|while|function|return|class|import|from|export|async|await)\b|[^\s]+|\s+/g);
  if (!parts) {
    return [{ text: line, color: CARD_COLORS.plain }];
  }

  return parts.map((text) => ({ text, color: tokenColor(text) }));
}

function tokenColor(token: string): string {
  if (/^\/\/|^#/.test(token)) return CARD_COLORS.comment;
  if (/^['"]/.test(token)) return CARD_COLORS.string;
  if (/^\d/.test(token)) return CARD_COLORS.number;
  if (/^(const|let|var|if|else|for|while|function|return|class|import|from|export|async|await)$/.test(token)) {
    return CARD_COLORS.keyword;
  }
  return CARD_COLORS.plain;
}

function measureMaxCodeWidth(rows: SnippetLine[], fontSize: number): number {
  const probe = makeDomCanvas(8, 8);
  const ctx = probe.getContext('2d');
  if (!ctx) {
    return 420;
  }

  ctx.font = `${fontSize}px ${DEFAULT_FONT}`;
  return rows.reduce((max, row) => {
    const width = row.tokens.reduce((sum, token) => sum + ctx.measureText(token.text).width, 0);
    return Math.max(max, width);
  }, 420);
}

function makeDomCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    throw new Error('Failed to generate PNG blob');
  }
  return blob;
}

function sanitizeFileName(raw: string): string {
  return raw.replace(/[^\w.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'snippet';
}

export function ShareSnippet({ data }: { data: ShareSnippetData }) {
  const [status, setStatus] = useState<string>('');
  const canvas = useMemo(() => renderSnippetCard(data), [data]);

  return (
    <div
      style={{
        border: '1px solid #00ff8833',
        background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e)',
        padding: '12px',
        borderRadius: '10px',
        fontFamily: DEFAULT_FONT,
      }}
    >
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <button
          onClick={async () => {
            await copyCanvasToClipboard(canvas);
            setStatus('Copied image to clipboard');
          }}
        >
          Copy as Image
        </button>
        <button
          onClick={async () => {
            await downloadCanvasAsPng(canvas, data.fileName);
            setStatus('Downloaded PNG');
          }}
        >
          Download PNG
        </button>
        <button
          onClick={async () => {
            await copyMarkdownCodeBlock(data);
            setStatus('Copied Markdown code block');
          }}
        >
          Copy Markdown
        </button>
      </div>
      <img alt="Share snippet preview" src={canvas.toDataURL('image/png')} style={{ maxWidth: '100%' }} />
      {status ? <div style={{ color: '#00ffbe', marginTop: '8px', fontSize: '12px' }}>{status}</div> : null}
    </div>
  );
}
