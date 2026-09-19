# `@orvel/local`

A dependency-free, file-backed persistence adapter for local Orvel development.
It stores a compact JSON document atomically on disk. It is suitable for v0.1
single-user development, not concurrent or distributed production workloads.
