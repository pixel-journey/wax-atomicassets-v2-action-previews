# AtomicAssets v2 action previews (shape and auth)

> **Catalog:** [wax-ecosystem-blueprint-catalog](https://github.com/pixel-journey/wax-ecosystem-blueprint-catalog)  
> **Sources:** [atomicassets-contract v2.0.0](https://github.com/atomicassets/atomicassets-contract/releases/tag/v2.0.0)

**Goal:** Lock the **shape and permission rules** of AtomicAssets v2 actions against the published headers and source — without compiling or broadcasting a transaction.

Read from `include/atomicassets.hpp` and `src/atomicassets.cpp` in the v2.0.0 tree. `backasset` still fails in that release; this repository does not call it.

Course notes: [EDUCATION.md](./EDUCATION.md).

## What the tests lock

| Function | Rule under test |
| --- | --- |
| `propose` / `accept` / `reject` | One pending author swap. Owner can accept at `now`. Active permission waits `604800`s, then expires `604800`s after that. Reject keeps the author. |
| `setRamPayer` / `setLastPayer` | New payer must already hold the id. Last payer is the greatest asset id, not a smaller id in the named collection. |
| `previewCreateOffer` | `createoffer` may list several ids; may not offer to yourself. Shape only — no ownership check. |
| `previewCancelOffer` / `previewAcceptOffer` / `previewDeclineOffer` | Sender cancels; recipient accepts or declines. Missing id uses the contract string. Auth only. |
| `previewCreateTemplate` | Both flags false is refused; every other pair is allowed. |
| `previewTransfer` / `previewBurn` | Non-transferable / non-burnable templates fail with contract strings. Templateless assets skip the flag. |
| `previewPayOfferRam` | Rewrites the offer payer; does not measure bytes. |
| `previewCreateBuyo` | AtomicMarket: `createbuyo` is exactly one asset (market C++ not opened here). |

## Related labs

- `wax-ram-cleanup-garbage-collection-assistant` estimates bytes; it does not move `ram_payer`.
- `wax-atomic-markets-and-trading-interface` previews `purchasesale` and refuses a second asset id on a sale; it does not build `createbuyo`.

```bash
npm test
```

MIT — Pixel Journey
