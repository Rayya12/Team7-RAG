'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const { messages, sendMessage } = useChat();

  const fileInputRef = useRef(null);

  async function handleUpload(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const ct = res.headers.get('content-type') ?? '';
      const raw = await res.text();
      const data = ct.includes('application/json') ? (() => { try { return JSON.parse(raw); } catch { return undefined; } })() : undefined;

      if (!res.ok) {
        const msg = (data?.error ?? raw.slice(0, 200)) || `Upload failed (${res.status})`;
        throw new Error(msg);
      }
      alert('File uploaded successfully!');
    } catch (error: any) {
      console.error(error);
      alert('Upload failed: ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      (fileInputRef.current as HTMLInputElement).click();
    }
  };

  const handleCardClick = (prompt: string) => {
    sendMessage({ text: prompt });
  };

  return (
    <div className="flex flex-col h-screen bg-[#F3F4F6] text-[#1F2937] p-4 font-sans antialiased">
      {/* Container Pesan (Area Tengah) */}
      <div className="flex-1 overflow-y-auto space-y-4 pt-4 pb-24 md:max-w-full md:mx-0 max-w-lg mx-auto w-full">
        {/* Tampilan awal ketika belum ada pesan */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2">Selamat datang di HR Agent AI 👋</h1>
            <p className="text-gray-500 mb-8 max-w-sm">Kami dirancang untuk membantu perusahaan dalam proses seleksi awal kandidat.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full px-4 md:px-0">
              <button 
                onClick={() => handleCardClick('Proses CV & Job Description')}
                className="bg-white p-4 rounded-lg shadow-md text-left transition-transform transform hover:scale-105"
              >
                {/* Ikon Kertas dengan Pensil */}
                <div className="w-10 h-10 mb-2 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.5m-.981 6.578a4.5 4.5 0 01-5.744-5.744l-1.396 1.396a.75.75 0 01-1.06 0l-2.06-2.06a.75.75 0 010-1.06L7.14 7.14a4.5 4.5 0 015.744 5.744l-1.396 1.396z" />
                  </svg>
                </div>
                Proses CV & Job Description
              </button>
              <button 
                onClick={() => handleCardClick('Temukan Kandidat yang Paling Tepat')}
                className="bg-white p-4 rounded-lg shadow-md text-left transition-transform transform hover:scale-105"
              >
                {/* Ikon Target */}
                <div className="w-10 h-10 mb-2 bg-pink-100 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-pink-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5zm0 0A.75.75 0 1112 12a.75.75 0 010 .75z" />
                  </svg>
                </div>
                Temukan Kandidat yang Paling Tepat
              </button>
              <button 
                onClick={() => handleCardClick('Percepat Proses Seleksi Anda')}
                className="bg-white p-4 rounded-lg shadow-md text-left transition-transform transform hover:scale-105"
              >
                <div className="w-10 h-10 mb-2 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Percepat Proses Seleksi Anda
              </button>
            </div>
          </div>
        ) : (
          /* Tampilan percakapan saat sudah ada pesan */
          messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className={`p-4 rounded-[20px] shadow-sm ${m.role === 'user' ? 'bg-[#3B82F6] text-white rounded-br-[4px] ml-auto' : 'bg-white text-gray-800 rounded-bl-[4px]'}`}>
                  {m.parts?.map((part, idx) => {
                    if (part.type === 'text') {
                      return <p key={idx}>{part.text}</p>;
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Area Input (Bagian Bawah) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md shadow-lg md:max-w-full md:mx-0 max-w-lg mx-auto w-full flex items-center gap-2">
        {/* Tombol Upload File */}
        <button 
          onClick={handleButtonClick}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-700 disabled:opacity-50"
          disabled={busy}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="font-medium text-sm">Upload CV</span>
        </button>
        {/* Input file yang tersembunyi */}
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={e => {
            const f = e.currentTarget.files?.[0];
            if (f) handleUpload(f);
            e.currentTarget.value = '';
          }}
          disabled={busy}
          className="hidden"
          ref={fileInputRef}
        />

        {/* Form Input Teks */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput('');
            }
          }}
          className="flex-1 flex gap-2"
        >
          <input
            className="w-full pl-5 pr-4 py-3 rounded-full bg-[#E5E7EB] placeholder-gray-400 text-gray-800 border-none focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            value={input}
            placeholder={busy ? 'Mengunggah dokumen...' : 'Tanyakan sesuatu...'}
            onChange={e => setInput(e.currentTarget.value)}
            disabled={busy}
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy || !input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}