const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

let cached;
try {
  cached = fs.readFileSync(INDEX, 'utf8');
} catch (e) {
  cached = '<html><body><h1>bolt.diy fork</h1><p>Missing index.html</p></body></html>';
}

function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch (e) {
    // ignore
  }
}

const deployModule = require('./deploy');

const server = http.createServer(async (req, res) => {
  // Serve static UI for root path
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(cached);
    return;
  }

  // Simple API endpoint to deploy
  if (req.url === '/deploy' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const taskId = 'S10-deploy';
        // Basic validation
        if (!payload.chain) throw new Error('Missing chain');
        if (!payload.network) throw new Error('Missing network');
        // Run deploy engine
        const result = await deployModule.deploy({ chain: payload.chain, network: payload.network, taskId });
        // Persist a lightweight progress marker
        ensureDir(path.join(__dirname, 'reports'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Fallback: return 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Bolt UI fork dev server running at http://localhost:${PORT}`);
});
