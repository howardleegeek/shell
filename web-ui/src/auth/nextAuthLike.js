"use strict";

// Lightweight in-memory mock implementing a NextAuth-like surface
// for tests and basic UI integration without external networks.
// This is intentionally simple and deterministic for test stability.

let _session = null;

function getSession() {
  return _session;
}

async function signIn(provider, options = {}) {
  if (!provider) throw new Error('Provider required');
  if (provider === 'wallet') {
    const address = options.address;
    if (!address) throw new Error('Wallet address required');
    _session = {
      id: 'wallet-' + address.toLowerCase(),
      provider: 'wallet',
      walletAddress: address,
      name: 'Wallet User',
      avatar: null,
      createdAt: new Date().toISOString()
    };
    return { ok: true, user: _session };
  } else if (provider === 'github') {
    // Simulated OAuth sign-in result
    _session = {
      id: 'github-' + Math.random().toString(36).slice(2, 8),
      provider: 'github',
      githubId: 'gh-' + Math.random().toString(36).slice(2, 10),
      name: 'GitHub User',
      avatar: '',
      createdAt: new Date().toISOString()
    };
    return { ok: true, user: _session };
  } else {
    throw new Error('Unsupported provider');
  }
}

async function signOut() {
  _session = null;
  return { ok: true };
}

module.exports = {
  signIn,
  signOut,
  getSession
};
