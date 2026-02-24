import { mcpTools } from '../mcpTools';

describe('MCP Tools', () => {
  test('exports a non-empty list', () => {
    expect(Array.isArray(mcpTools)).toBe(true);
    expect(mcpTools.length).toBeGreaterThan(0);
  });
  test('each tool has required fields', () => {
    for (const t of mcpTools) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.label).toBe('string');
      expect(typeof t.command).toBe('string');
    }
  });
});
