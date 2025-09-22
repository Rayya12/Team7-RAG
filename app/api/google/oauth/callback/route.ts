// app/api/google/oauth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  // 1. Ambil 'code' dari URL
  const code = new URL(req.url).searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  // 2. Buat client OAuth2 dengan kredensial yang sama
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  try {
    // 3. Tukarkan 'code' dengan 'tokens'
    const { tokens } = await oAuth2Client.getToken(code);

    // PENTING UNTUK DEVELOPMENT:
    // Tampilkan token di konsol agar bisa kamu copy-paste ke file .env.local
    console.log('--- GOOGLE OAUTH TOKENS ---');
    console.log('Copy GMAIL_ACCESS_TOKEN dan GMAIL_REFRESH_TOKEN di bawah ini ke file .env.local Anda:');
    console.log(`GMAIL_ACCESS_TOKEN=${tokens.access_token}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('--------------------------');

    // 4. Arahkan pengguna kembali ke halaman utama
    const redirectUrl = new URL('/', req.url);
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Error getting tokens:', error);
    return NextResponse.json({ error: 'Failed to retrieve access token' }, { status: 500 });
  }
}