# @orvel/groq

The Groq cloud adapter for Orvel. It implements the provider-neutral
`ModelProvider` contract using Groq's OpenAI-compatible Chat Completions API.
Configure it server-side with `GROQ_API_KEY`; no key is sent to the browser.

Teachings are Orvel contextual examples supplied through the normal runtime
request, not Groq model fine-tuning. Model availability and limits are managed
by Groq and can change.
