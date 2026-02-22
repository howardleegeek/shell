// Lightweight build script for the Web UI.
// - Ensures dist/ exists
// - Writes a minimal landing page to dist/index.html
// - No external dependencies required
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const distDir = path.join(projectRoot, 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeIndex() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Shell Vibe - Web</title>
    <style>
      :root { --bg: #0b1020; --fg: #e6e6e6; --green: #00ffa6; --purple: #6c5cff; --card: rgba(255,255,255,0.08); }
      html, body { height: 100%; margin: 0; font-family: Inter, ui-sans-serif, system-ui, Arial; background: #0a0a0a; color: var(--fg); }
      /* Cyberpunk vibe background */
      #bgCanvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
      .wrap { position: relative; z-index: 1; }
      .container { max-width: 1000px; margin: 0 auto; padding: 40px 16px 120px; text-align: center; }
      h1 { font-weight: 800; font-family: 'Trebuchet MS', sans-serif; font-size: 56px; margin: 40px 0 8px; letter-spacing: 1px; }
      .lead { font-size: 18px; color: #cbd5e1; margin-bottom: 20px; }
      .cta { display: inline-block; margin: 8px; padding: 14px 22px; border-radius: 999px; text-decoration: none; color: #061018; background: linear-gradient(135deg, var(--green), #00e6ff); font-weight: 700; }
      .section { padding: 48px 16px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: stretch; }
      .card { background: var(--card); border-radius: 12px; padding: 16px; text-align: left; min-height: 120px; border: 1px solid rgba(255,255,255,0.15); }
      .section h2 { margin-top: 0; font-size: 20px; text-transform: uppercase; letter-spacing: .6px; color: #a5f3fc; }
      .feature { display: flex; align-items: center; gap: 12px; }
      .feature .icon { font-size: 28px; }
      .footer { margin-top: 60px; color: #94a3b8; font-size: 12px; }
      @media (max-width: 900px) {
        .grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 600px) {
        h1 { font-size: 40px; }
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <canvas id="bgCanvas" aria-hidden="true"></canvas>
    <div class="wrap">
      <header class="container" style="padding-top: 48px; padding-bottom: 6px; text-align:center; position:relative; z-index:1;">
        <h1>Shell — Cursor for Web3</h1>
        <p class="lead">Describe it. Deploy it. Cyberpunk landing for your product.</p>
        <a class="cta" href="#web-app">Try Web App</a>
        <a class="cta" href="#desktop">Download Desktop</a>
      </header>
      <section id="web-app" class="section container wrap" style="text-align:left;">
        <h2 style="margin-bottom:12px; color:#7dd3fc;">Web App Preview</h2>
        <p style="color:#cbd5e1;">This is a self-contained landing page output suitable for deployment on Vercel. A minimal, fast, cyberpunk-styled intro.</p>
        <div class="grid" style="margin-top:16px;">
          <div class="card">
            <strong>Live Demo</strong>
            <p style="margin-top:6px; color:#cbd5e1;">Recordings of the product in action.</p>
          </div>
          <div class="card">
            <strong>Try Web App</strong>
            <p style="margin-top:6px; color:#cbd5e1;">Launch the web app to experience features.</p>
          </div>
          <div class="card">
            <strong>Download</strong>
            <p style="margin-top:6px; color:#cbd5e1;">Desktop client for offline workflows.</p>
          </div>
        </div>
      </section>
      <section class="section container wrap" id="features" style="text-align:left;">
        <h2 style="color:#7dd3fc; margin-bottom:12px;">Feature Showcase</h2>
        <div class="grid" aria-label="features-grid">
          <div class="card"><strong>AI Vibe Coding</strong><p style="margin-top:6px;color:#cbd5e1">Natural language → contracts</p></div>
          <div class="card"><strong>Dual Chain</strong><p style="margin-top:6px;color:#cbd5e1">SVM + EVM</p></div>
          <div class="card"><strong>Auto-Repair</strong><p style="margin-top:6px;color:#cbd5e1">AI-assisted fixes</p></div>
          <div class="card"><strong>Security First</strong><p style="margin-top:6px;color:#cbd5e1">Audits built-in</p></div>
          <div class="card"><strong>One-Click Deploy</strong><p style="margin-top:6px;color:#cbd5e1">Testnet / Mainnet</p></div>
          <div class="card"><strong>Native Desktop</strong><p style="margin-top:6px;color:#cbd5e1">Not just a browser toy</p></div>
        </div>
      </section>
      <section class="section container wrap" id="how-it-works" style="text-align:left;">
        <h2 style="color:#7dd3fc;">How It Works</h2>
        <ol>
          <li><strong>Describe</strong> your idea and requirements.</li>
          <li><strong>Generate</strong> code and templates automatically.</li>
          <li><strong>Deploy</strong> to the network with a click.</li>
        </ol>
      </section>
      <section class="section container wrap" id="pricing" style="text-align:left;">
        <h2 style="color:#7dd3fc;">Pricing</h2>
        <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="card"><strong>Free</strong><p style="color:#cbd5e1;margin-top:6px">Limited features</p></div>
          <div class="card"><strong>Pro</strong><p style="color:#cbd5e1;margin-top:6px">Advanced templates</p></div>
          <div class="card"><strong>Team</strong><p style="color:#cbd5e1;margin-top:6px">Collaboration tools</p></div>
        </div>
      </section>
      <footer class="footer container wrap" style="text-align:center; padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.08);">
        <div>GitHub | Discord | Twitter</div>
        <div>Built by Oyster Labs</div>
      </footer>
    </div>
    <script>
      // Simple canvas particle background for cyberpunk vibe
      (function() {
        const canvas = document.getElementById('bgCanvas');
        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;
        const particles = Array.from({ length: 80 }).map(() => {
          return { x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6, life: Math.random()*60+60 };
        });
        function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
        window.addEventListener('resize', resize);
        function draw(){
          ctx.clearRect(0,0,w,h);
          ctx.fillStyle = 'rgba(0,255,170,0.8)';
          particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if(p.x<0) p.x = w; if(p.x> w) p.x=0;
            if(p.y<0) p.y = h; if(p.y> h) p.y=0;
            ctx.fillRect(p.x, p.y, 2, 2);
          });
          requestAnimationFrame(draw);
        }
        draw();
      })();
    </script>
  </body>
  </html>`;
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
}

function main() {
  ensureDir(distDir);
  // Optional simulation: if a fail flag is present, simulate a build failure
  const failFlag = path.join(projectRoot, 'build_fail.flag');
  if (fs.existsSync(failFlag)) {
    // Write a failure report for the auto-repair loop
    const report = {
      ok: false,
      details: {
        errors: [
          'SOLANA_TEMPLATES export missing in templates.ts (UI import mismatch)'
        ]
      },
      code: 1
    };
    const reportPath = path.join(projectRoot, 'build_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.error('Build failed (simulated). See build_report.json.');
    process.exit(1);
  }

  writeIndex();
  console.log('Web UI build completed: dist/index.html');
}

main();
