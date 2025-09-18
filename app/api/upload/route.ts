// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { resources } from '@/lib/db/schema/resources';
import { embeddings as embeddingsTable } from '@/lib/db/schema/embeddings';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMBEDDING_DIM = 1536;
const embeddingModel = google.textEmbedding('gemini-embedding-001');

export async function POST(req: NextRequest) {
  try {
    // Wajib FormData (multipart)
    const ct = req.headers.get('content-type') ?? '';
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: `Wrong Content-Type: ${ct}. Send FormData (multipart/form-data) with key "file".` },
        { status: 415 },
      );
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file field named "file".' }, { status: 400 });
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF supported' }, { status: 400 });
    }

    // Pastikan benar-benar binary
    const ab = await file.arrayBuffer();
    if (!ab || (ab as any).byteLength === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }
    const buf = Buffer.from(ab);

    // === PARSE PDF ===
    // Penting: import ke path implementasi supaya TIDAK memanggil index.js yang baca sample test file.
    const mod: any = await import('pdf-parse/lib/pdf-parse.js');
    const pdfParse = mod.default ?? mod;

    const parsed = await pdfParse(buf);
    const raw = (parsed?.text ?? '')
      .replace(/\u0000/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!raw) {
      return NextResponse.json({ error: 'PDF has no extractable text' }, { status: 400 });
    }

    // === CHUNK ===
    const chunks = chunkWords(raw, 800, 200);
    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No chunks produced' }, { status: 400 });
    }

    // === EMBED ===
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks,
      providerOptions: {
        google: { outputDimensionality: EMBEDDING_DIM, taskType: 'RETRIEVAL_DOCUMENT' },
      },
    });

    // === SIMPAN ===
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

    const [resource] = await db
      .insert(resources)
      .values({
        content: `PDF:${file.name}\nsha256:${sha256}\nlen:${raw.length}`,
      })
      .returning();

    await db.insert(embeddingsTable).values(
      embeddings.map((vec, i) => ({
        resourceId: resource.id,
        content: chunks[i],
        embedding: ensureDim(vec, EMBEDDING_DIM),
      })),
    );

    return NextResponse.json({
      ok: true,
      resourceId: resource.id,
      filename: file.name,
      chunks: chunks.length,
    });
  } catch (e: any) {
    console.error('[upload] error:', e);
    // Pastikan SELALU JSON agar client tidak mencoba parse HTML
    return NextResponse.json({ error: e?.message ?? 'Upload failed' }, { status: 500 });
  }
}

// ===== Utils kecil =====
function chunkWords(input: string, target = 800, overlap = 200) {
  const words = input.split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += (target - overlap)) {
    const slice = words.slice(i, i + target).join(' ').trim();
    if (slice) out.push(slice);
  }
  return out;
}

function ensureDim(v: number[], dim: number) {
  if (v.length === dim) return v;
  if (v.length > dim) return v.slice(0, dim);
  throw new Error(`Embedding dim mismatch: got ${v.length}, expected ${dim}`);
}
