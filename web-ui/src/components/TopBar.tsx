import React, { useState, CSSProperties } from 'react'
import { useWallet, Chain } from '../context/WalletContext'

function abbreviate(addr: string, max = 6) {
  if (!addr) return ''
  if (addr.length <= max + 4) return addr
  return addr.slice(0, max) + '...' + addr.slice(-4)
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 20px',
  borderBottom: '1px solid #eee',
  background: 'linear-gradient(135deg, #0e1020 0%, #1a1f3b 100%)',
  color: '#e6e6ff',
}

const rightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const buttonStyle: CSSProperties = {
  background: '#111',
  color: '#e6e6ff',
  border: '1px solid #444',
  padding: '8px 12px',
  borderRadius: 6,
  cursor: 'pointer',
}

const modalOverlay: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalBox: CSSProperties = {
  width: 320,
  padding: 20,
  borderRadius: 8,
  background: 'linear-gradient(135deg, #0b0b15 0%, #1a1239 100%)',
  color: '#eaeaff',
  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
}

const modalHeader: CSSProperties = {
  fontWeight: 700,
  marginBottom: 12,
}

const modalRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 8,
}

const modalBtn: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid #444',
  background: '#111',
  color: '#e6e6ff',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left' as const,
}

export default function TopBar() {
  const { state, connectSolana, connectEVM, disconnect, setChain } = useWallet()
  const [modalOpen, setModalOpen] = useState(false)

  const onConnectClick = () => setModalOpen(true)
  const onClose = () => setModalOpen(false)

  const addr = state.walletAddress ?? ''
  const shownAddr = abbreviate(addr)
  const balanceLabel = state.chain === 'solana' ? `${state.balance} SOL` : `${state.balance} ETH`

  return (
    <div>
      <header style={headerStyle}>
        <div style={{ fontWeight: 700, letterSpacing: 1 }}>OYSTER IDE</div>
        <div style={rightStyle}>
          {state.connected ? (
            <span
              title="Click to disconnect"
              onClick={disconnect}
              style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: '1px solid #444', background: '#0b0b21' }}
            >
              {shownAddr} | {balanceLabel}
            </span>
          ) : (
            <button onClick={onConnectClick} style={buttonStyle}>
              🔗 Connect Wallet
            </button>
          )}
          <select
            value={state.chain}
            onChange={(e) => setChain(e.target.value as Chain)}
            aria-label="chain-switch"
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #444', color: '#fff', background: '#111' }}
          >
            <option value="solana">Solana</option>
            <option value="evm">Ethereum</option>
          </select>
        </div>
      </header>

      {modalOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={modalHeader}>Connect Wallet</div>
            <div style={modalRow}>
              <button
                style={modalBtn}
                onClick={() => {
                  connectSolana()
                  setModalOpen(false)
                }}
              >
                Phantom (Solana)
              </button>
            </div>
            <div style={modalRow}>
              <button
                style={modalBtn}
                onClick={() => {
                  connectEVM()
                  setModalOpen(false)
                }}
              >
                MetaMask (EVm)
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={onClose} style={buttonStyle}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
