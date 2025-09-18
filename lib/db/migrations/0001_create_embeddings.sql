CREATE TABLE IF NOT EXISTS embeddings (
  id          varchar(191) PRIMARY KEY,
  resource_id varchar(191) REFERENCES resources(id) ON DELETE CASCADE,
  content     text NOT NULL,
  embedding   vector(1536) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_embeddings_embedding_cosine
  ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_embeddings_resource_id
  ON embeddings(resource_id);
