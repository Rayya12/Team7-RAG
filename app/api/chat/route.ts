import { google } from 'ai-sdk/google';
import { streamText, type UIMessage } from 'ai';

// meningkatkan durasi maksimum agar sesi wawancara tidak terputus
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        // 1. MEMBACA DATA DARI FRONTEND
        // Nantinya kita akan mengirimkan ID Kandidat agar tahu CV mana yang harus dibaca.
        const { messages }: { messages: UIMessage[] } = await req.json();

        // --- AREA SIMULASI (MOCKING) ---
        // 2. MENGAMBIL KONTEKS CV DARI DATABASE (SAAT INI DISIMULASIKAN)
        //    Di dunia nyata, kita akan menggunakan 'candidateId' dari request
        //    untuk mengambil data CV dari database yang sudah di embed.
        //    untuk sekarang, kita gunakan teks statis sebagai simulasi.
        const cvContext = `
      Informasi Kandidat dari CV:
      - Nama: Budi Santoso
      - Posisi yang dilamar: Junior Web Developer
      - Pengalaman: 1 tahun di PT Cipta Solusi, fokus pada React dan Node.js.
      - Proyek Terakhir: Membangun sistem kasir (Point of Sale) menggunakan Next.js dan TypeScript.
      - Skill: JavaScript, TypeScript, React, Next.js, Express.js, PostgreSQL.
      - Pendidikan: S1 Teknik Informatika, Universitas Gadjah Mada.
    `;
    // --- AKHIR AREA SIMULASi ---


    // 3. MEMBUAT PROMPT UNTUK AI
    //    Ini adalah "Briefing" untuk AI. Kita memberinya peran, instruksi, 
    //    dan yang terpenting, konteks dari CV Kandidat.
    const systemPrompt = `
      Anda adalah "RecruiterBot", seorang asisten rekrutmen AI dari PT Maju Jaya.
      Peran Anda adalah melakukan wawancara teknis awal untuk posisi Web Developer.
      
      Gunakan informasi dari CV kandidat yang saya berikan di bawah ini sebagai dasar UTAMA untuk pertanyaan Anda.
      Tujuan Anda adalah untuk menggali lebih dalam tentang pengalaman dan proyek yang tertulis di CV.
      
      Aturan Wawancara:
      1. Mulailah dengan sapaan profesional dan perkenalkan diri Anda.
      2. Ajukan pertanyaan satu per satu, berdasarkan KONTEKS CV di bawah.
      3. Jangan menanyakan hal yang sudah jelas ada di CV (seperti nama atau universitas), kecuali untuk validasi.
      4. Jaga agar percakapan tetap relevan dengan posisi Web Developer.
      5. Setelah 5-7 pertanyaan, akhiri sesi dengan ucapan terima kasih yang netral.
      
      Berikut adalah KONTEKS CV kandidat:
      ---
      ${cvContext}
      ---
      `;

    // 4. MEMANGGIL MODEL AI
    //    Kita mengirimkan semua pesan sebelumnya ditambah dengan prompt sistem
    //    untuk menjaga alur percakapan.
    const result = await streamText({
      model: google('gemini-1.5-flash-latest'),
      system: systemPrompt,
      messages,
    });      
    
     // 5. MENGIRIMKAN KEMBALI HASILNYA KE FRONTEND
    //    Hasilnya dikirim sebagai stream agar teks muncul kata per kata di UI.
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Terjadi kesalahan pada server.', { status: 500 });
  }
}

    

    
