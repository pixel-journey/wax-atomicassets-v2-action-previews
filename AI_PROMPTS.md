# AI handoff — AtomicAssets action previews

## Non-negotiables

1. Previews mirror [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract) behavior. They are not broadcasts.
2. Closed in tests: self-offer, expired swap, stranger accept/reject, double proposal, buyo multi-id, soulbound held assets.
3. `createbuyo` (AtomicHub-style) is not the same action as AtomicAssets `createoffer`.
4. Not closed: no chain signatures, no real RAM measurement, no mainnet reads, no wasm.
5. WAX mainnet AtomicAssets is **V1**; V2 notes are testnet-shaped unless a pinned source says otherwise. Do not claim a mainnet V2 deploy from this lab.
6. `setassetdata` still replaces the **whole** map when a host later calls it — see the mutable stack, not this preview repo.

## Prompt seeds

- "Refuse a self-offer and an expired swap in the preview."
- "Stranger tries to accept — refused?"
- "Contrast createbuyo with atomicassets::createoffer."

## Do not

- Sign or read mainnet from unit tests.
- Treat a preview string as a completed transaction.
