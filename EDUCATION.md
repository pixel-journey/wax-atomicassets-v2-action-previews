# Education — author, RAM payer, and two offers

> **Rung:** `npm test` runs `src/*.test.ts`.  
> **The test is the rule.** The C++ was read at tag v2.0.0. It was not compiled and not sent.

## What you should be able to do

| Level | After this file |
| --- | --- |
| Beginner | Say who becomes author, and when |
| Intermediate | Pick the asset `setlastpayer` actually touches |
| Masterclass | Keep AtomicAssets `createoffer` apart from AtomicMarket `createbuyo` |

---

## Beginner — one week, or none

`WEEK` is `604800`. `propose` stores `acceptanceDate = now` when `ownerPermission` is true, and `now + WEEK` when it is false. The contract comment calls those the owner and active paths. This function does not ask a node which permission signed.

```ts
propose({ collection: "pixel", author: "alice", pending: null }, "alice", "bob", true, now)
accept(that, "bob", now) // author becomes bob, pending is null

propose(same, "alice", "bob", false, now)
accept(that, "bob", now + WEEK - 1)
// "[ 1 ] seconds remaining until this author swap can be accepted"
```

Accept at `acceptanceDate + WEEK` is expired (`now >= acceptanceDate + WEEK`). A second `propose` while one is pending returns the contract string, including the apostrophe in `author's`. `reject` by alice or bob clears the row and leaves the author. A third account gets `Missing required authorizations`.

`require_auth would fail` is our preview text. The chain does not use that sentence.

### Predict, then run

```bash
npm test
```

---

## Intermediate — greatest id, not the collection you hoped

| Attack | Naive code | This lab | Test |
| --- | --- | --- | --- |
| `setlastpayer` updates every asset in the collection | filter by collection | the greatest `assetId` must already be in that collection | id `9` in `other` blocks a call aimed at `pixel` |
| Pay RAM for an asset you do not hold | any id | the id must be in the list passed as the new payer's assets | empty list |
| Set the payer to the same account | no-op success | the contract string refuses it | already `alice` |
| Treat this as the byte estimate | 8 bytes per name | no byte count in `ramPayer.ts` | the return is old and new payer |

`wax-ram-cleanup-garbage-collection-assistant` is the byte estimate. Do not add these results.

---

## Masterclass — `createoffer` is not `createbuyo`

AtomicAssets `createoffer` still takes two vectors. Two sender ids and an empty recipient side pass the shape check. Sender equal to recipient fails. A repeated id on one side fails. Memo length 256 passes the shape path; 257 fails. `checked: "shape-only"` means ownership and the transferable flag were not looked at. The contract does those next. This function stops before them.

AtomicMarket v2.0.0 says `createbuyo` rejects more than one asset. `previewCreateBuyo(["1001", "1002"])` fails. `previewCreateBuyo(["42"])` returns `action: "createbuyo"`. That sentence is the release note. The market source was not opened in this pass. `wax-atomic-markets-and-trading-interface` `buyPreview` refuses a second id on a sale. It still does not build `createbuyo`.

Native backing stays deprecated. `backasset` in the same cpp file fails unconditionally. Nothing here escrows a token. Holder splits remain `equalSplit` and `duePayout` in `wax-nft-backed-token-unlock-visualizer`.

### What this course will not teach

- A broadcast, a RAM byte refund, or `is_account`
- `atomicdropsx::claimdrop` (the drops ABI was not verified)
- That `shape-only` means the offer would succeed on chain
