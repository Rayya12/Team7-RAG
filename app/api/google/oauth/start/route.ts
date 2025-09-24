// app/api/google/oauth/start/route.ts

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  // 1. Buat client OAuth2
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  // 2. Tentukan scope/izin yang kita butuhkan
  // Di sini kita hanya butuh izin untuk mengirim email
  const scopes = ['https://www.googleapis.com/auth/gmail.send'];

  // 3. Buat URL otorisasi
  const authorizationUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' diperlukan untuk mendapatkan refresh_token
    scope: scopes,
    prompt: 'consent', // Minta persetujuan setiap kali
  });

  // 4. Arahkan pengguna ke URL tersebut
  return NextResponse.redirect(authorizationUrl);
}