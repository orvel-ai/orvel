# SupportBot teaching loop

This runnable example uses a local mock model provider to demonstrate the v0.1
flow without a network call:

1. SupportBot receives a refund question and responds without prior teaching.
2. A creator saves the correction: “Refunds normally take 5–7 business days.”
3. A fresh, related refund question retrieves that teaching.
4. The mock provider receives the explicit teaching context and returns the
   corrected guidance.

Run it from the repository root after building:

```bash
pnpm --filter @orvel/example-support-bot start
```

The mock provider is only an example fixture. Orvel's runtime never hard-codes
the correction; the SDK retrieves it from stored teaching and provides it as
context.
