// Simple browser UI wiring for chain selection using the chainStore module
import { getState, setChainType, setNetwork, subscribe, getNetworkOptions } from './chainStore.js';

function render(state) {
  // SVM / EVM / Move toggle
  const svmBtn = document.getElementById('svmBtn');
  const evmBtn = document.getElementById('evmBtn');
  const moveBtn = document.getElementById('moveBtn');
  if (svmBtn) svmBtn.classList.toggle('active', state.chainType === 'svm');
  if (evmBtn) evmBtn.classList.toggle('active', state.chainType === 'evm');
  if (moveBtn) moveBtn.classList.toggle('active', state.chainType === 'move');

  // Networks based on chain type
  const netSelector = document.getElementById('net-selector');
  if (!netSelector) return;
  netSelector.innerHTML = '';
  const options = getNetworkOptions(state.chainType);
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = opt;
    if (state.network === opt) btn.classList.add('active');
    btn.addEventListener('click', () => setNetwork(opt));
    netSelector.appendChild(btn);
  });
}

// Initial render from current state
document.addEventListener('DOMContentLoaded', () => {
  const current = getState();
  render(current);
  // Wire controls
  const svmBtn = document.getElementById('svmBtn');
  const evmBtn = document.getElementById('evmBtn');
  const moveBtn = document.getElementById('moveBtn');
  if (svmBtn) svmBtn.addEventListener('click', () => setChainType('svm'));
  if (evmBtn) evmBtn.addEventListener('click', () => setChainType('evm'));
  if (moveBtn) moveBtn.addEventListener('click', () => setChainType('move'));
  // Subscribe to store changes to re-render
  subscribe((s) => render(s));
});
