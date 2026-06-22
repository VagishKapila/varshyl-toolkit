-- pgvector Q&A embeddings for @varshylinc/soren-screen
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS np_soren_qa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  TEXT NOT NULL,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  tags        TEXT[],
  embedding   vector(1536),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, question)
);

CREATE INDEX IF NOT EXISTS idx_np_soren_qa_embedding
  ON np_soren_qa
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

CREATE INDEX IF NOT EXISTS idx_np_soren_qa_product
  ON np_soren_qa(product_id);
