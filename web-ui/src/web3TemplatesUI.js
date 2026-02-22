// Browser UI module to render Web3 prompt templates and fill chat input
import { templates } from './templates.mjs';

function createCard(item, onClick) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.innerHTML = `
    <div class="template-emoji">${item.emoji}</div>
    <div class="template-title">${item.title}</div>
    <div class="template-desc">${item.description}</div>
  `;
  card.addEventListener('click', () => onClick(item));
  return card;
}

function renderPanel(active) {
  let panel = document.getElementById('template-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'template-panel';
    panel.innerHTML = `
      <h2>Web3 Prompt Templates</h2>
      <div id="template-tabs" class="template-tabs"></div>
      <div id="template-grid" class="template-grid"></div>
      <div id="template-chat" class="template-chat" aria-label="Template chat">
        <input id="chatInput" type="text" placeholder="Chat input..." style="width:100%; padding:8px; font-size:14px;" />
      </div>
    `;
    document.getElementById('app').appendChild(panel);
  }

  // Inject styles once
  if (!document.getElementById('template-styles')) {
    const style = document.createElement('style');
    style.id = 'template-styles';
    style.textContent = `
      #template-panel { padding: 16px; border: 1px solid #334; border-radius: 8px; background: #14142b; margin: 16px 0; }
      .template-tabs { display:flex; gap:8px; margin-bottom:12px; }
      .template-tab { padding:6px 12px; border-radius:999px; border:1px solid #334; cursor:pointer; color:#ddd; }
      .template-tab.active { background:#1e1a2b; box-shadow: inset 0 0 0 2px #00ff88; }
      .template-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:12px; }
      .template-card { background:#1f1b2e; padding:12px; border-radius:8px; cursor:pointer; border:1px solid #2a2a2a; }
      .template-emoji { font-size:24px; }
      .template-title { font-weight:600; margin-top:6px; }
      .template-desc { font-size:12px; color:#ccc; margin-top:4px; }
      #template-chat { margin-top:12px; }
    `;
    document.head.appendChild(style);
  }
  // Build tabs and cards if not already built
  const tabs = document.getElementById('template-tabs');
  const grid = document.getElementById('template-grid');
  if (tabs && grid) {
    // Keep only a lightweight state, 5 items per category
    tabs.innerHTML = `
      <button class="template-tab active" data-kind="svm">SVM</button>
      <button class="template-tab" data-kind="evm">EVM</button>
    `;
    const btns = tabs.querySelectorAll('.template-tab');
    btns.forEach((b) => {
      b.addEventListener('click', () => {
        btns.forEach((bb) => bb.classList.remove('active'));
        b.classList.add('active');
        renderGrid(b.dataset.kind);
      });
    });
  }

  function renderGrid(kind) {
    grid.innerHTML = '';
    const items = templates[kind] || [];
    items.forEach((it) => {
      const card = createCard(it, (item) => {
        const input = document.getElementById('chatInput');
        if (input) input.value = item.prompt;
      });
      grid.appendChild(card);
    });
  }
  renderGrid(kindFromState());
}

function polyfillActive() {
  // default to svm
  return 'svm';
}

function kindFromState() {
  // Attempt to read chain type to decide default, fallback to svm
  try {
    const s = (window && window.__shell_state) || null;
    if (s && s.chainType) {
      return s.chainType === 'evm' ? 'evm' : 'svm';
    }
  } catch (e) {}
  return 'svm';
}

document.addEventListener('DOMContentLoaded', () => {
  // Create a very lightweight global state for the templates panel
  window.__shell_state = window.__shell_state || { chainType: 'svm' };
  renderPanel(true);
});
