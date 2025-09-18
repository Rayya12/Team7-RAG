import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/env.mjs';
import { resources } from './schema/resources';
import { embeddings } from './schema/embeddings';

const client = postgres(env.DATABASE_URL, { max: 5 });
export const db = drizzle(client, { schema: { resources, embeddings } });
