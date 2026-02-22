const fs = require('fs');
const path = require('path');

function read(file) {
  const p = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing file: ${p}`);
  }
  return fs.readFileSync(p, 'utf8');
}

describe('MCP Server Foundry Docker config', () => {
  test('Dockerfile exists and contains Foundry setup and MCP server config', () => {
    const dockerfile = read('mcp-server/Dockerfile');
    expect(dockerfile).toContain('FROM node:22-bookworm-slim AS base');
    expect(dockerfile).toContain('RUN curl -L https://foundry.paradigm.xyz | bash');
    expect(dockerfile).toContain('ENV PATH="/root/.foundry/bin:${PATH}"');
    expect(dockerfile).toContain('RUN foundryup');
    expect(dockerfile).toContain('WORKDIR /app');
    expect(dockerfile).toContain('COPY package.json package-lock.json* ./');
    expect(dockerfile).toContain('RUN npm install --production');
    expect(dockerfile).toContain('COPY . .');
    expect(dockerfile).toContain('RUN npm run build');
    expect(dockerfile).toContain('EXPOSE 3001');
    expect(dockerfile).toContain('EXPOSE 8545');
    expect(dockerfile).toContain('COPY entrypoint.sh /entrypoint.sh');
    expect(dockerfile).toContain('CMD ["/entrypoint.sh"]');
  });

  test('entrypoint.sh starts Anvil and then MCP Server', () => {
    const script = read('mcp-server/entrypoint.sh');
    expect(script).toContain('# Start Anvil in the background');
    expect(script).toContain('anvil --host 0.0.0.0 &');
    expect(script).toContain('# Start MCP Server');
    expect(script).toContain('exec node dist/server.js --transport sse --port 3001');
  });

  test('docker-compose.yaml exposes correct ports and mounts', () => {
    const compose = read('mcp-server/docker-compose.yaml');
    expect(compose).toContain('ports:');
    expect(compose).toContain('- "3001:3001"');
    expect(compose).toContain('- "8545:8545"');
    expect(compose).toContain('- ./projects:/app/projects');
  });

  test('.dockerignore contains expected patterns', () => {
    const ignore = read('mcp-server/.dockerignore');
    expect(ignore).toContain('node_modules');
    expect(ignore).toContain('dist');
    expect(ignore).toContain('.git');
  });
});
