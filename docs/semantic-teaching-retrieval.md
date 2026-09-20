# Semantic teaching retrieval

Orvel v0.1 teaching remains contextual: it retrieves creator-saved corrections
and supplies only the selected examples to the model. It does not fine-tune or
retrain any model.

## Retrieval modes

Orvel supports three provider-neutral modes, selected by configuration:

- **Embedding semantic retrieval** uses an `EmbeddingProvider` and cosine
  similarity. The included Ollama adapter is local and opt-in.
- **LLM semantic relevance retrieval** uses a `SemanticRelevanceProvider` to
  judge whether each stored teaching is useful for a new message. Studio uses
  the Groq adapter when `GROQ_API_KEY` is present and no embedding model is
  configured. It uses an additional Groq request and tokens per candidate.
- **Lexical fallback** uses deterministic token overlap when neither semantic
  mode is configured or a semantic provider fails.

## Hybrid embedding retrieval

`@orvel/training` keeps the deterministic lexical retriever and adds a
provider-neutral `EmbeddingProvider` interface plus `createHybridTeachingRetriever`.
For every saved teaching scoped to the current agent, the hybrid retriever:

1. calculates the existing lexical token-overlap score;
2. obtains cosine similarity between the query vector and the teaching vector
   when an embedding provider is configured;
3. when both query and teaching vectors are available, accepts a teaching only
   when semantic score is at least `0.72`; otherwise falls back to lexical score
   of at least `0.12`;
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
embedding vectors are similar. A generic lexical overlap such as “How do I
change…” is not enough to retrieve an account-password teaching for a delivery
address question when their semantic vectors differ.

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

## LLM relevance judging

The LLM judge receives the new user message and one candidate teaching and
returns only `{ relevant, confidence }`; it is explicitly instructed not to
answer the user. For small v0.1 collections, all teachings for the current
agent can be judged directly. Results must be relevant and meet the default
confidence of `0.8`, are ranked by confidence, deduplicated by corrected
response, and limited to three.

In Studio, set `GROQ_API_KEY` and leave `OLLAMA_EMBEDDING_MODEL` unset to use
the Groq judge automatically. `GROQ_RELEVANCE_MODEL` is optional and selects a
different Groq model for judging without changing the agent's response model.

If a judge call fails, times out, is rate-limited, or produces malformed JSON,
the complete operation falls back to lexical retrieval so chat continues. This
strategy is independent of the agent's normal response model and can be
replaced by another `SemanticRelevanceProvider` later. It remains contextual
retrieval, not fine-tuning.
