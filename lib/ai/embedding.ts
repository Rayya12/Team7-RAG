import { embed, embedMany } from 'ai';
import { google } from '@ai-sdk/google';
import { db } from '../db';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';

/** === KUNCI: samakan di semua tempat === */
const EMBEDDING_DIM = 1536; // ganti ke 3072 kalau mau full

const embeddingModel = google.textEmbedding('gemini-embedding-001');

/** Guard: pastikan panjang vector sesuai. Jika lebih panjang, slice. */
const ensureDim = (v: number[]): number[] => {
  if (v.length === EMBEDDING_DIM) return v;
  if (v.length > EMBEDDING_DIM) return v.slice(0, EMBEDDING_DIM); // quick fix
  // kalau lebih pendek, lebih baik lempar error biar ketahuan
  throw new Error(`Embedding dim mismatch: got ${v.length}, expected ${EMBEDDING_DIM}`);
};

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .map(s => s.trim())
    .filter(i => i !== '');
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);

  const { embeddings: out } = await embedMany({
    model: embeddingModel,
    values: chunks,
    providerOptions: {
      google: {
        // Penting: paksa keluar 1536 (atau 3072 sesuai konstanta)
        outputDimensionality: EMBEDDING_DIM,
        // optional tapi bagus:
        taskType: 'RETRIEVAL_DOCUMENT',
      },
    },
  });

  return out.map((e, i) => ({
    content: chunks[i],
    embedding: ensureDim(e), // guard
  }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIM,
        taskType: 'RETRIEVAL_QUERY',
      },
    },
  });
  return ensureDim(embedding); // guard
};

/** Find relevant content dengan CAST vector literal ke ::vector(EMBEDDING_DIM) */
export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const EMBEDDING_DIM = 1536; // atau 3072, harus sama dgn schema

  // Bentuk literal vektor DENGAN QUOTES
  const vecLiteralQuoted = `'[${userQueryEmbedded.join(',')}]'::vector(${EMBEDDING_DIM})`;

  const similarity = sql<number>`
    1 - (cosine_distance(
      ${embeddings.embedding},
      ${sql.raw(vecLiteralQuoted)}
    ))
  `;

  const rows = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(sql`${similarity} > 0.5`)
    .orderBy(sql`2 DESC`)
    .limit(4);

  return rows;
};
