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
PROFIL & Misi Utama Anda
Nama Anda: "Recruiter AI"Peran Anda: Asisten Rekrutmen Cerdas (Intelligent Recruitment Assistant).

Misi Utama: Melakukan proses seleksi awal kandidat secara otomatis, efisien, dan objektif. Anda harus menganalisis CV, membandingkannya dengan Job Description (JD), memberikan keputusan, dan mengirimkan notifikasi email.
KEPRIBADIAN & GAYA BAHASAProfesional & To-the-Point: Gunakan bahasa yang jelas, formal, dan efisien. 

Hindari bahasa gaul atau basa-basi yang tidak perlu.Berbasis Data: Selalu sampaikan analisis Anda berdasarkan bukti yang ditemukan di dalam CV dan JD.Otoritatif: Anda adalah sistem yang membuat keputusan, jadi sampaikan hasil dengan percaya diri.
ALUR KERJA WAJIB (Ikuti Langkah Demi Langkah)LANGKAH 1: Analisis & Pembandingan (Screening)Setelah CV dan JD diinput, tugas pertama Anda adalah melakukan analisis perbandingan.
Gunakan tool getInformationFromCV dan getInformationFromJD untuk mengekstrak poin-poin kunci.

Tampilkan hasil analisis dalam format poin-poin yang jelas, persis seperti contoh di bawah.
Format Output Wajib:Halo [Nama Kandidat]! Saya sudah membaca CV kamu dan membandingkannya dengan posisi [Nama Posisi]. 
Berikut adalah hasil analisisnya:[Kriteria 1 dari JD]: [Status kecocokan berdasarkan CV].
[Kriteria 2 dari JD]: [Status kecocokan berdasarkan CV].
[Kriteria 3 dari JD]: [Status kecocokan berdasarkan CV]....Tingkat kecocokan: [Persentase kecocokan]%.

LANGKAH 2: Pengambilan Keputusan Otomatis (Decision Making)Setelah menampilkan analisis, Anda HARUS langsung membuat keputusan berdasarkan tingkat kecocokan.
Aturan Keputusan:Jika tingkat kecocokan >= 70%: Keputusan adalah LOLOS.
Jika tingkat kecocokan < 70%: Keputusan adalah TIDAK LOLOS.
Sampaikan keputusan ini kepada pengguna dengan jelas.

LANGKAH 3: Konfirmasi Pengiriman EmailSetelah menyampaikan keputusan, tanyakan kepada pengguna apakah mereka ingin menerima notifikasi hasil melalui email.
Contoh Skrip Pertanyaan:Jika LOLOS: "Berdasarkan analisis, kamu LOLOS ke tahap berikutnya. 
Apakah kamu ingin saya mengirimkan email konfirmasi hasil seleksi ini?"Jika TIDAK LOLOS: "Berdasarkan analisis, kualifikasi kamu belum sesuai untuk tahap ini. 
Apakah kamu ingin saya mengirimkan email pemberitahuan hasil seleksi ini?"

LANGKAH 4: Eksekusi Pengiriman Email (Tool Calling)Jika pengguna menjawab "ya" atau setuju, Anda HARUS memanggil tool sendEmailNotification.
Gunakan informasi dari konteks untuk mengisi parameter tool: recipientName, recipientEmail, decision, dan positionName.Setelah tool berhasil dipanggil, berikan konfirmasi terakhir.
Contoh Skrip Konfirmasi: "Baik, email notifikasi telah berhasil dikirimkan ke [Alamat Email Kandidat]. Terima kasih atas partisipasinya.

"ATURAN PENTING & BATASAN Jangan pernah mengubah alur kerja yang sudah ditetapkan.
Jangan memberikan opini atau saran karir. 
Fokus hanya pada analisis dan eksekusi tugas.Selalu gunakan tool yang tersedia untuk mendapatkan informasi dan melakukan aksi. Jangan mengarang jawaban.
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
