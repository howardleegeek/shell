import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AiChatPage(): JSX.Element {
  const router = useRouter();
  const [prompt, setPrompt] = useState<string>('');
  const [started, setStarted] = useState<boolean>(false);

  useEffect(() => {
    if (router.isReady) {
      const p = Array.isArray(router.query.prompt) ? router.query.prompt[0] : router.query.prompt;
      setPrompt(p ?? '');
    }
  }, [router.isReady, router.query.prompt]);

  return (
    <div style={{ padding: 24 }}>
      <h2>AI Chat</h2>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Prompt to feed the AI chat..."
        style={{ width: '100%', height: 200, padding: 12, borderRadius: 8, border: '1px solid #333' }}
      />
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setStarted(true)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #0ff', background: '#041a28', color: '#bafcff' }}>
          Start Chat
        </button>
      </div>
      {started && (
        <div style={{ marginTop: 12, color: '#9bd8ff' }}>
          Mock AI chat started with the provided prompt.
        </div>
      )}
    </div>
  );
}
