import React, { useState } from 'react'
import { WalletProvider } from './context/WalletContext'
import TopBar from './components/TopBar'
import PromptTemplatesPanel from './components/PromptTemplatesPanel'
import SecurityAuditPanel from './components/SecurityAuditPanel'

export default function App() {
  const [showTemplates, setShowTemplates] = useState(true)
  const [prompt, setPrompt] = useState('')

  const onSelectPrompt = (p: string) => {
    setPrompt(p)
    setShowTemplates(false)
  }

  return (
    <WalletProvider>
      <div style={{ fontFamily: 'Inter, system-ui, Arial', minHeight: '100vh' }}>
        <TopBar />
        <main style={{ padding: 24 }}>
          <h1 style={{ marginTop: 0, color: '#e6e6ff' }}>IDE Wallet Demo</h1>
          <p style={{ color: '#ddd' }}>This is a minimal wallet integration surface for testing.</p>

          {showTemplates ? (
            <div style={{ marginTop: 16 }}>
              <PromptTemplatesPanel onSelect={onSelectPrompt} />
            </div>
          ) : (
            <section style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>AI Chat</div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Your prompt"
                rows={4}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #444', background: '#0b0b19', color: '#fff' }}
              />
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => alert('Submitted: ' + prompt)}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #444', background: '#111', color: '#e6e6ff' }}
                >
                  Send
                </button>
                <button onClick={() => setShowTemplates(true)} style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #444', background: '#111', color: '#e6e6ff' }}>
                  Back to Templates
                </button>
              </div>
              <div style={{ marginTop: 8, color: '#ddd' }}>
                Preview: <span style={{ color: '#fff' }}>{prompt ? prompt.slice(0, 60) : '(no prompt selected)'}</span>
              </div>
            </section>
          )}

          {/* Security Audit Panel – located near Deploy in real UI; kept here for demo */}
          <section style={{ marginTop: 28 }}>
            <SecurityAuditPanel />
          </section>
        </main>
      </div>
    </WalletProvider>
  )
}
