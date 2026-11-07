# Three v2 previews, none of them a transaction

**Trust label:** `educational-reference`  
**Catalog:** [wax-ecosystem-blueprint-catalog](https://github.com/pixel-journey/wax-ecosystem-blueprint-catalog)

Read from [atomicassets-contract v2.0.0](https://github.com/atomicassets/atomicassets-contract/releases/tag/v2.0.0) `include/atomicassets.hpp` and `src/atomicassets.cpp`. Not compiled. Not broadcast. `backasset` still fails in that file. This repo does not call it.

| Function | What the test locks |
| --- | --- |
| `propose` / `accept` / `reject` | One pending swap. Owner permission can accept at `now`. Active permission waits `604800` seconds, then expires `604800` seconds after that. Reject keeps the author. |
| `setRamPayer` / `setLastPayer` | The new payer must already hold the id. The last payer is the greatest asset id, not a smaller id in the collection you named. |
| `previewCreateOffer` | AtomicAssets `createoffer` may list several ids. It may not offer to yourself. Shape only: no ownership check. |
| `previewCreateBuyo` | AtomicMarket release note: `createbuyo` is exactly one asset. The market C++ was not opened. |

The course is [EDUCATION.md](./EDUCATION.md).

`wax-ram-cleanup-garbage-collection-assistant` estimates bytes. It does not move `ram_payer`. `wax-atomic-markets-and-trading-interface` previews `purchasesale` and refuses a second asset id on a sale. It does not build `createbuyo`.

```bash
npm test
```

MIT — Pixel Journey
