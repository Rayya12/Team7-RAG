// app/api/chat/route.ts
import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai';
import { z } from 'zod';

import { createResource } from '@/lib/actions/resources';
import { findRelevantContent } from '@/lib/ai/embedding';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),

    // ——— SYSTEM PROMPT ———
    system: `
Nama kamu Karina dari Karir Cerdas.
Kamu BISA memakai dokumen yang diunggah user (PDF, dll) karena sistem akan mengindeksnya ke vector database.
Jika user menanyakan isi dokumen atau berkata sudah upload, SEGERA panggil tool "getInformation" dengan pertanyaan user.
Jawab singkat, jelas, dan hanya berdasarkan konteks hasil retrieval.
Jika konteks tidak cukup, katakan "Maaf, aku belum menemukan infonya di dokumen." dan sarankan upload/menambah dokumen.
JANGAN meminta user menyalin teks PDF ke chat.
`,

    // ——— TOOLS ———
    tools: {
      addResource: tool({
        description:
          'Tambahkan teks mentah ke basis pengetahuan (pakai saat user menempelkan teks langsung di chat).',
        inputSchema: z.object({
          content: z
            .string()
            .min(1, 'content wajib')
            .describe('konten teks untuk disimpan'),
        }),
        execute: async ({ content }) => {
          const res = await createResource({ content });
          return typeof res === 'string' ? res : 'OK';
        },
      }),

      getInformation: tool({
        description:
          'Ambil informasi dari dokumen yang sudah diindeks (RAG). Panggil ini untuk menjawab pertanyaan tentang isi PDF.',
        inputSchema: z.object({
          question: z.string().min(1).describe('pertanyaan user'),
        }),
        // Penting: kembalikan TEKS yang siap dipakai model sebagai CONTEXT
        execute: async ({ question }) => {
          const rows = await findRelevantContent(question);
          if (!rows || rows.length === 0) {
            return 'CONTEXT:\n(none)\n';
          }
          const ctx = rows
            .map(
              (r: any, i: number) =>
                `[#${i + 1}] ${r.name ?? r.content ?? ''} (similarity=${
                  r.similarity?.toFixed?.(3) ?? '—'
                })`,
            )
            .join('\n\n');
          return `CONTEXT:\n${ctx}\n`;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
