import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Ubah file menjadi buffer untuk diproses
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Parse PDF dan ekstrak teksnya
    const data = await pdf(fileBuffer);
    const cvText = data.text;

    // Untuk sekarang, kita hanya log teksnya untuk memastikan berhasil
    console.log('--- CV Text Extracted ---');
    console.log(cvText);
    console.log('-------------------------');

    return NextResponse.json({ 
      message: 'CV received and text extracted successfully.',
      textLength: cvText.length 
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: 'Failed to process PDF.' }, { status: 500 });
  }
}