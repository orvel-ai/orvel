# Semantic teaching retrieval

Orvel v0.1 teaching remains contextual: it retrieves creator-saved corrections
and supplies only the selected examples to the model. It does not fine-tune or
retrain any model.

## Hybrid retrieval

`@orvel/training` keeps the deterministic lexical retriever and adds a
provider-neutral `EmbeddingProvider` interface plus `createHybridTeachingRetriever`.
For every saved teaching scoped to the current agent, the hybrid retriever:

1. calculates the existing lexical token-overlap score;
2. obtains cosine similarity between the query vector and the teaching vector
   when an embedding provider is configured;
3. accepts a teaching when lexical score is at least `0.12` or semantic score
   is at least `0.72`;
4. ranks semantic candidates with `0.35 × lexical + 0.65 × semantic`, or uses
   lexical score alone when no vector is available;
5. sorts ties deterministically by semantic score, lexical score, and teaching
   ID; removes duplicate corrected responses; and returns at most three results.

These defaults deliberately favor precision over recall. They are configurable
when creating the retriever and are not universal quality guarantees. Match
metadata includes lexical score, semantic score, combined score, and strategy
(`lexical`, `semantic`, or `hybrid`) for debugging; only selected teaching text
goes into model context.

For example, a teaching for “How long does delivery take?” can be retrieved for
“When will I get my order?” even when the words differ, because their local
embedding vectors are similar. “What color is the sky?” is rejected unless it
also clears one of the explicit thresholds.

## Local, opt-in embeddings

Studio does not send teachings to a hosted embedding API. Semantic retrieval is
enabled only when `OLLAMA_EMBEDDING_MODEL` is set in `apps/studio/.env.local`.
It uses the configured locally running Ollama server and its `/api/embed`
endpoint. Pull an embedding model yourself; Orvel never downloads one:

```bash
ollama pull embeddinggemma
```

```bash
OLLAMA_EMBEDDING_MODEL=embeddinggemma
```

Without that setting, or if local embeddings are temporarily unavailable,
Studio uses lexical retrieval exactly as before. Other local or hosted embedding
providers can implement `EmbeddingProvider`; none is enabled by default.

## Persistence and compatibility

Local teachings may receive an optional `semanticEmbedding` field containing a
provider ID and vector. Vectors are generated lazily on first relevant hybrid
retrieval and written through the existing atomic JSON store. Existing data
files and teachings without vectors remain valid: they use lexical retrieval
until a configured embedding provider can populate a cache. A provider ID
change causes vectors to be regenerated, preventing vectors from incompatible
models being compared.

This is an in-memory scan of local teaching vectors, appropriate for v0.1's
small local datasets. It intentionally adds no vector database, remote storage,
or automatic model download.
