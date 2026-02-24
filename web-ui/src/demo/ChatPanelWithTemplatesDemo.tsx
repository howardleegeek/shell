import React from 'react'
import { Web3TemplatesPanel } from '../components/Web3TemplatesPanel'

// Small demo page showing how the templates panel fills chat input
export const ChatPanelWithTemplatesDemo: React.FC = () => {
  const [input, setInput] = React.useState('')
  const [showPanel, setShowPanel] = React.useState(true)

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: 12 }}>
        <strong>AI Chat</strong>
      </div>
      {showPanel ? (
        <Web3TemplatesPanel
          onSelect={(prompt) => setInput(prompt)}
          onDismiss={() => setShowPanel(false)}
        />
      ) : null}
      <div style={{ marginTop: 12 }}>
        <input
          aria-label="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ width: 600, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
      </div>
    </div>
  )
}

export default ChatPanelWithTemplatesDemo
