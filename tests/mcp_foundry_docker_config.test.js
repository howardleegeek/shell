const fs = require('fs');
const path = require('path');

describe('MCP Foundry Docker config', () => {
  test('Dockerfile and related config exist with expected content', () => {
    const dockerfile = fs.readFileSync(path.resolve(__dirname, '../mcp-server/Dockerfile'), 'utf8');
    expect(dockerfile).toMatch(/FROM\s+.+/i);
    expect(dockerfile).toMatch(/foundryup/i);
    expect(dockerfile).toContain('COPY entrypoint.sh /entrypoint.sh');

    const entrypoint = fs.readFileSync(path.resolve(__dirname, '../mcp-server/entrypoint.sh'), 'utf8');
    expect(entrypoint).toMatch(/anvil/i);
    expect(entrypoint).toContain('exec node dist/server.js --transport sse --port 3001');

    const compose = fs.readFileSync(path.resolve(__dirname, '../mcp-server/docker-compose.yaml'), 'utf8');
    // simple structural assertions
    expect(compose).toContain('ports');
    expect(compose).toContain('3001:3001');
    expect(compose).toContain('8545:8545');

    const ignore = fs.readFileSync(path.resolve(__dirname, '../mcp-server/.dockerignore'), 'utf8');
    expect(ignore).toContain('node_modules');
    expect(ignore).toContain('dist');
    expect(ignore).toContain('.git');
  });
});
