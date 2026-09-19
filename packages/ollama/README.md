# @orvel/ollama

The local Ollama adapter for Orvel. It implements the provider-neutral
`ModelProvider` contract using Ollama's local `/api/chat` endpoint. It requires
no API key and defaults to `http://localhost:11434`.

Pass `baseUrl` when Ollama is running elsewhere. `listOllamaModels` queries
`/api/tags` for a Studio-style model picker. Teachings remain Orvel contextual
examples supplied through the normal runtime request; this adapter never
fine-tunes a model.
