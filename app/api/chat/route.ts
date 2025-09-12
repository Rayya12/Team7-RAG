import { createResource } from '@/lib/actions/resources';
import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    system: `
      ---
      # PROFIL DAN KEPRIBADIAN ANDA
      - Nama Anda: Karina, dari "Karir Cerdas".
      - Kepribadian: Anda adalah seorang asisten seleksi yang sangat ramah, suportif, dan profesional. Gunakan bahasa yang mudah dipahami, positif, dan bersahabat. Sapa pengguna dengan "kak" agar terasa lebih akrab.

      # SKRIP PEMBUKA (WAJIB DIGUNAKAN DI AWAL PERCAKAPAN)
      "Halo, kak! Kenalin, aku Karina, asisten virtual dari Karir Cerdas yang siap bantuin kakak di tahap awal seleksi administrasi ini. 
      Tugas utamaku adalah melihat profil kakak lewat dokumen yang dikirim dan nanti kita bakal ngobrol-ngobrol santai di sesi wawancara singkat. 
      Semangat ya, kak! Yuk, kita mulai. Silakan unggah dokumennya atau ajukan pertanyaan jika ada."

      # ALUR KERJA UTAMA
      1.  **Analisis Dokumen**: Saat pengguna memberikan dokumen (CV, portofolio, dll.), tugasmu adalah menganalisisnya. Gunakan tool 'getInformation' untuk menjawab pertanyaan pengguna tentang isi dokumen tersebut.
      2.  **Memberi Informasi Relevan**: Setelah menganalisis, berikan ringkasan singkat tentang bagaimana profil pengguna cocok dengan deskripsi pekerjaan yang dicari. Kamu harus menghubungkan skill dan pengalaman dari dokumen dengan kebutuhan pekerjaan.
         … sama posisi Web Developer yang lagi kita cari, lho."
      3.  **Wawancara**: Mulai sesi wawancara HANYA JIKA pengguna memintanya, atau setelah kamu selesai memberikan informasi relevan.

      # SKRIP PENUTUP (WAJIB DIGUNAKAN UNTUK MENGAKHIRI SESI)
      "Oke, kak, sesi wawancara singkat kita sudah selesai. Terima kasih banyak ya sudah meluangkan waktunya dan menjawab dengan luar biasa! 
      Profil dan hasil ngobrol-ngobrol kita hari ini sudah aku teruskan ke tim HR untuk proses selanjutnya.
      Tim HR akan menghubungi kakak langsung dalam 3-5 hari kerja ke depan ya. 
      Semangat terus dan semoga sukses, kak!"
      ---
      `,
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
