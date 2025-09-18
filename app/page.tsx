'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const { messages, sendMessage } = useChat();

  async function handleUpload(file: File) {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch('/api/upload', { method: 'POST', body: fd }); // JANGAN set Content-Type
  const ct = res.headers.get('content-type') ?? '';
  const raw = await res.text();
  const data = ct.includes('application/json') ? (() => { try { return JSON.parse(raw); } catch { return undefined; } })() : undefined;

  if (!res.ok) {
  const msg = (data?.error ?? raw.slice(0, 200)) || `Upload failed (${res.status})`;
  throw new Error(msg);
}


}


  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="space-y-4">
        {messages.map(m => (
          <div key={m.id} className="whitespace-pre-wrap">
            <div>
              <div className="font-bold">{m.role}</div>
              {m.parts?.map((part, idx) => {
                switch (part.type) {
                  case 'text':
                    return <p key={idx}>{part.text}</p>;
                  case 'tool-addResource':
                  case 'tool-getInformation':
                    return (
                      <div key={idx}>
                        <p>call{part.state === 'output-available' ? 'ed' : 'ing'} tool: {part.type}</p>
                        <pre className="my-4 bg-zinc-100 p-2 rounded-sm">
                          {JSON.stringify(part.input, null, 2)}
                        </pre>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur p-2 mb-4 rounded-lg shadow-lg border flex gap-2">
        <input
          type="file"
          accept="application/pdf"
          onChange={e => {
            const f = e.currentTarget.files?.[0];
            if (f) handleUpload(f);
            e.currentTarget.value = '';
          }}
          disabled={busy}
          className="flex-1"
        />
        <form
          onSubmit={e => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput('');
            }
          }}
          className="flex gap-2"
        >
          <input
            className="flex-1 p-2 border border-gray-300 rounded shadow-inner"
            value={input}
            placeholder={busy ? 'Mengindeks PDF...' : 'Tanyakan sesuatu...'}
            onChange={e => setInput(e.currentTarget.value)}
            disabled={busy}
          />
          <button
            className="px-3 py-2 border rounded bg-gray-900 text-white disabled:opacity-60"
            disabled={busy}
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
