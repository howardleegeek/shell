const fs = require('fs');
const path = require('path');

function loadServers() {
  // Resolve to project root desktop/mcp-servers.json
  const root = path.resolve(__dirname, '../../desktop/mcp-servers.json');
  try {
    const raw = fs.readFileSync(root, 'utf8');
    const cfg = JSON.parse(raw);
    return cfg;
  } catch (e) {
    return { error: e && e.message ? e.message : String(e) };
  }
}

module.exports = { loadServers };
