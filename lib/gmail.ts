
// lib/gmail.ts

import { google } from 'googleapis';

/**
 * Fungsi untuk mengirim email menggunakan akun Gmail yang sudah terautentikasi.
 * Menggunakan token yang disimpan di .env.local.
 * @param to Alamat email tujuan.
 * @param subject Subjek email.
 * @param html Isi email dalam format HTML.
 */
export async function sendGmail(to: string, subject: string, html: string) {
  // 1. Membuat client otorisasi dengan kredensial dari .env
  const oAuth2Client = new google.auth.OAuth2(

    process.env.GMAIL_CLIENT_ID!,
    process.env.GMAIL_CLIENT_SECRET!,
    process.env.GMAIL_REDIRECT_URI!
  );
  


  // 2. Mengatur token akses & refresh yang sudah kita dapatkan
  oAuth2Client.setCredentials({
    access_token: process.env.GMAIL_ACCESS_TOKEN,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  // 3. Menyiapkan 'layanan' Gmail dengan client yang sudah siap
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // 4. Menyusun format email mentah sesuai standar internet
  const emailContent = [
    `From: ${process.env.GMAIL_SENDER}`, // Pastikan GMAIL_SENDER ada di .env.local
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  // 5. Mengubah format email menjadi Base64URL yang dibutuhkan oleh Gmail API
  const encodedMessage = Buffer.from(emailContent)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    // 6. Perintah untuk mengirim email
    const res = await gmail.users.messages.send({
      userId: 'me', // 'me' berarti akun yang terautentikasi
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('Email sent successfully! Message ID:', res.data.id);
    return { id: res.data.id! };
  } catch (error) {
    console.error('Gagal mengirim email:', error);
    throw new Error('Gagal mengirim email.');
  }
}
